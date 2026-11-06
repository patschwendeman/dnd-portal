import { loadFeature, defineFeature } from 'jest-cucumber'
import {
  By, Key, WebDriver, error,
} from 'selenium-webdriver'

import {
  BASE_URL,
  WAIT_TIMEOUT,
  buildDriver,
  clickElement,
  openScreen,
  waitForAttribute,
  waitForElement,
  waitForElementGone,
  waitForFullscreen,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/adminDashboard.feature')

// Wide enough for rail, panel, notes and dashboard side by side
const WINDOW_RECT = { width: 1600, height: 1000 }

const HEADER = '[data-test-id="admin-header"]'
const DASHBOARD = '[data-test-id="dashboard"]'
const DASHBOARD_TOGGLE = '[data-test-id="dashboard-toggle"]'
const DASHBOARD_PANELS = `${DASHBOARD} > section`
const NOTES_VIEW = '[data-test-id="notes-view"]'
const NOTES_SCROLL = '[data-test-id="notes-scroll"]'
const AUDIO_PANEL = '[data-test-id="dashboard-panel-audio"]'
const MUSIC_TOGGLE = `${AUDIO_PANEL} [data-test-id="music-toggle"]`
const MUSIC_STATE = `${AUDIO_PANEL} [data-test-id="music-state"]`
const NO_OUTPUT_HINT = `${AUDIO_PANEL} [data-test-id="music-no-output"]`
const VOLUME_THUMB = `${AUDIO_PANEL} .MuiSlider-thumb`
const VOLUME_RAIL = `${AUDIO_PANEL} .MuiSlider-rail`
const VOLUME_INPUT = `${AUDIO_PANEL} .MuiSlider-root input`
const VOLUME_VALUE = `${AUDIO_PANEL} [data-test-id="music-volume-value"]`
const SOUND_BUTTON = `${AUDIO_PANEL} [data-test-id="sound-heal"]`
const JOIN_BUTTON = '[data-test-id="join-button"]'
const PLAYERS_STATUS = '[data-test-id="screen-players"]'
const FULLSCREEN_TOGGLE = '[data-test-id="fullscreen-toggle"]'
const JOIN_DIALOG = '[data-test-id="join-dialog"]'
const PANEL_LABELS = ['Aktive Szene', 'Audio', 'Spieltisch', 'Party']
const DASHBOARD_MIN_WIDTH = 400
const DASHBOARD_MAX_WIDTH = 560
// space.5: the space between the tiles and the edge of the screen
const SCREEN_SPACE = 24
// The volume the slider is moved to: the middle of the rail
const MIDDLE_VOLUME = 50
// Any other volume, so moving the slider to the middle changes it
const START_VOLUME = 20
const SCROLL_TOP = 400
// Three status waits plus the start of two more browsers, see the scenario
const SCREENS_SCENARIO_TIMEOUT = 6 * WAIT_TIMEOUT

const entry = (id: string): string => `[data-test-id="notes-entry-${id}"]`
const panel = (id: string): string => `[data-test-id="dashboard-panel-${id}"]`

const screenStatus = (screen: string): string => (
  `${panel('table')} [data-test-id="screen-${screen}-status"]`
)

interface ScreenCounts { wall: number | null, ground: number | null }

// Inverse of screenStatusText: "nicht verbunden" 0, "verbunden" 1, "<n> verbunden" n; null while
// the server has not sent the counts yet ("–") or for an unknown text
const parseScreenCount = (text: string): number | null => {
  if (text === 'nicht verbunden') {
    return 0
  }
  if (text === 'verbunden') {
    return 1
  }
  const match = /^(\d+) verbunden$/.exec(text)
  return match === null ? null : Number(match[1])
}

const readScreenCounts = async (driver: WebDriver): Promise<ScreenCounts> => {
  const [wall, ground] = await Promise.all(['wall', 'ground'].map(async (screen) => {
    const elements = await driver.findElements(By.css(screenStatus(screen)))
    return elements.length > 0 ? parseScreenCount(await elements[0].getText()) : null
  }))
  return { wall, ground }
}

// Waits until both counts match (or, without expected counts, until the server has sent them) and
// returns the last seen counts instead of throwing on timeout, so the step's expect shows expected
// vs. actual
const waitForScreenCounts = async (
  driver: WebDriver,
  expected?: ScreenCounts,
): Promise<ScreenCounts> => {
  await waitForElement(driver, panel('table'))
  let actual: ScreenCounts = { wall: null, ground: null }
  try {
    await driver.wait(async () => {
      actual = await readScreenCounts(driver)
      if (expected === undefined) {
        return actual.wall !== null && actual.ground !== null
      }
      return actual.wall === expected.wall && actual.ground === expected.ground
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

const openAdmin = async (driver: WebDriver): Promise<void> => {
  await driver.manage().window().setRect(WINDOW_RECT)
  await openScreen(driver, '/admin')
}

const getScrollTop = async (driver: WebDriver): Promise<number> => driver.executeScript(
  `return document.querySelector('${NOTES_SCROLL}').scrollTop`,
)

const getNotesWidth = async (driver: WebDriver): Promise<number> => (
  (await (await waitForElement(driver, NOTES_VIEW)).getRect()).width
)

// Returns the last seen text instead of throwing on timeout, so the step's expect shows it
const waitForText = async (
  driver: WebDriver,
  selector: string,
  expected: string,
): Promise<string | null> => {
  let actual: string | null = null
  try {
    await driver.wait(async () => {
      const elements = await driver.findElements(By.css(selector))
      actual = elements.length > 0 ? await elements[0].getText() : null
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

interface Audio { playing: boolean, volume: number }

const getAudio = async (): Promise<Audio> => {
  const response = await fetch(`${BASE_URL}/api/table/audio`)
  expect(response.ok).toBe(true)
  return (await response.json()) as Audio
}

const isMusicPlaying = async (): Promise<boolean> => (await getAudio()).playing

const saveAudio = async (update: Partial<Audio>): Promise<void> => {
  const response = await fetch(`${BASE_URL}/api/table/audio`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  })
  expect(response.ok).toBe(true)
}

const setMusicPlaying = async (playing: boolean): Promise<void> => saveAudio({ playing })

// The button changes only with the push of the server, so it shows the state the server keeps.
// The click made this window the audio output, so the panel shows the state instead of the hint
const waitForMusicState = async (driver: WebDriver, playing: boolean): Promise<void> => {
  expect(await waitForAttribute(driver, MUSIC_TOGGLE, 'data-playing', String(playing)))
    .toBe(String(playing))
  expect(await isMusicPlaying()).toBe(playing)
  const state = playing ? 'Läuft' : 'Pausiert'
  expect(await waitForText(driver, MUSIC_STATE, state)).toBe(state)
}

defineFeature(feature, (test) => {
  let driver: WebDriver
  // Wall and ground screens a scenario opens in addition; quit after each scenario, also on failure
  let screenDrivers: WebDriver[] = []
  // Audio before a scenario that changes the volume, restored afterwards: all specs share the one
  // game table
  let restoreAudio: Audio | null = null

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    const drivers = [driver, ...screenDrivers]
    screenDrivers = []
    await Promise.allSettled(drivers.map((item) => item.quit()))
    if (restoreAudio !== null) {
      await saveAudio(restoreAudio)
      restoreAudio = null
    }
  })

  test('The dashboard shows its panels next to the notes', ({ given, then, and }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    then(
      'I see the dashboard with the panels Aktive Szene, Audio, Spieltisch, Party and no panel '
        + 'Level',
      async () => {
        await waitForElement(driver, DASHBOARD)
        // In one script: the stage replaces its element once the active scene is loaded
        let labels: string[] = []
        try {
          await driver.wait(async () => {
            labels = await driver.executeScript(
              `return [...document.querySelectorAll('${DASHBOARD_PANELS}')]
                .map((item) => item.getAttribute('aria-label'))`,
            )
            return labels.length === PANEL_LABELS.length
          }, WAIT_TIMEOUT)
        } catch (err) {
          if (!(err instanceof error.TimeoutError)) {
            throw err
          }
        }
        expect(labels).toEqual(PANEL_LABELS)
        await waitForElement(driver, `${panel('stage')} [data-test-id="active-scene-name"]`)
        expect(await driver.findElements(By.css(panel('level')))).toHaveLength(0)
      },
    )

    and(
      'the panels lie in one column over the full width of the dashboard, each as high as its '
        + 'content',
      async () => {
        // Without the scroll bar the dashboard gets once it is higher than the main area. The
        // last child of a panel is its content (the stage: the caption); without padding and border
        // below it the panel ends where the content ends
        const layout: { width: number, x: number, y: number, bottom: number, gap: number }[] = (
          await driver.executeScript(
            `const innerWidth = document.querySelector('${DASHBOARD}').clientWidth
            return [...document.querySelectorAll('${DASHBOARD_PANELS}')].map((item) => {
              const box = item.getBoundingClientRect()
              const content = item.lastElementChild.getBoundingClientRect()
              const style = getComputedStyle(item)
              const padding = parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth)
              return {
                width: Math.round(box.width) - innerWidth,
                x: box.x,
                y: box.y,
                bottom: box.bottom,
                gap: Math.round(box.bottom - padding - content.bottom),
              }
            })`,
          )
        )
        expect(layout).toHaveLength(PANEL_LABELS.length)
        layout.forEach((item, index) => {
          expect(item.width).toBe(0)
          expect(item.x).toBe(layout[0].x)
          expect(item.gap).toBe(0)
          if (index > 0) {
            expect(item.y).toBeGreaterThan(layout[index - 1].bottom)
          }
        })
      },
    )

    and(
      'the dashboard takes a third of the width, at least 400 and at most 560 pixels',
      async () => {
        const dashboard = (await (await waitForElement(driver, DASHBOARD)).getRect()).width
        const notes = await getNotesWidth(driver)
        const third = (notes + dashboard) / 3
        const expected = Math.min(DASHBOARD_MAX_WIDTH, Math.max(DASHBOARD_MIN_WIDTH, third))
        expect(Math.abs(dashboard - expected)).toBeLessThan(1)
        expect(notes).toBeGreaterThan(dashboard)
      },
    )

    and('no panel scrolls on its own', async () => {
      // Content (last child of each panel) that is larger than its box would scroll or be cut
      // off; a panel that is larger than its rows would overflow them
      const overflowing: string[] = await driver.executeScript(
        `const overflows = (box) => box.scrollHeight > box.clientHeight
          || box.scrollWidth > box.clientWidth
        return [...document.querySelectorAll('${DASHBOARD_PANELS}')]
          .filter((item) => overflows(item) || overflows(item.lastElementChild))
          .map((item) => item.getAttribute('aria-label'))`,
      )
      expect(overflowing).toEqual([])
    })

    and('there is no bottom bar, no sound button and no join button in the header', async () => {
      const header = await waitForElement(driver, HEADER)
      expect(await header.findElements(By.css('[data-test-id^="sound-"]'))).toHaveLength(0)
      expect(await header.findElements(By.css(JOIN_BUTTON))).toHaveLength(0)
      const notes = await (await waitForElement(driver, NOTES_VIEW)).getRect()
      const windowHeight: number = await driver.executeScript('return window.innerHeight')
      const rail = await (await waitForElement(driver, '[data-test-id="nav-rail"]')).getRect()
      expect(rail.y + rail.height).toBe(windowHeight - SCREEN_SPACE)
      expect(notes.y + notes.height).toBeLessThanOrEqual(windowHeight)
    })
  })

  test('I collapse and expand the dashboard', ({
    given, and, when, then,
  }) => {
    let notesWidth = 0
    let scrollTop = 0

    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    and('I selected the notes entry Leveling and scrolled down the notes', async () => {
      await clickElement(driver, entry('leveling'))
      await waitForElement(driver, `${NOTES_VIEW} h1#note-leveling-level_1--level_1`)
      scrollTop = await driver.executeScript(
        `const notes = document.querySelector('${NOTES_SCROLL}')
        notes.scrollTo({ top: ${SCROLL_TOP}, behavior: 'instant' })
        return notes.scrollTop`,
      )
      expect(scrollTop).toBe(SCROLL_TOP)
      notesWidth = await getNotesWidth(driver)
    })

    when('I click on the dashboard icon in the header', async () => {
      expect(await waitForAttribute(driver, DASHBOARD_TOGGLE, 'aria-expanded', 'true'))
        .toBe('true')
      await clickElement(driver, DASHBOARD_TOGGLE)
    })

    then('the dashboard is hidden, the notes are wider, the icon is off', async () => {
      await waitForElementGone(driver, DASHBOARD)
      expect(await getNotesWidth(driver)).toBeGreaterThan(notesWidth)
      expect(await waitForAttribute(driver, DASHBOARD_TOGGLE, 'aria-expanded', 'false'))
        .toBe('false')
    })

    and('Leveling is still selected and the notes are at the same scroll position', async () => {
      expect(await waitForAttribute(driver, entry('leveling'), 'data-active', 'true'))
        .toBe('true')
      expect(await getScrollTop(driver)).toBe(scrollTop)
    })

    when('I click on the dashboard icon again', async () => {
      await clickElement(driver, DASHBOARD_TOGGLE)
    })

    then('the dashboard is shown again and the icon is highlighted', async () => {
      await waitForElement(driver, DASHBOARD)
      expect(await waitForAttribute(driver, DASHBOARD_TOGGLE, 'aria-expanded', 'true'))
        .toBe('true')
      expect(await getNotesWidth(driver)).toBe(notesWidth)
      expect(await getScrollTop(driver)).toBe(scrollTop)
    })

    when('I reload the admin screen after collapsing the dashboard', async () => {
      await clickElement(driver, DASHBOARD_TOGGLE)
      await waitForElementGone(driver, DASHBOARD)
      await driver.navigate().refresh()
    })

    then('the dashboard is shown', async () => {
      await waitForElement(driver, DASHBOARD)
      expect(await waitForAttribute(driver, DASHBOARD_TOGGLE, 'aria-expanded', 'true'))
        .toBe('true')
    })
  })

  test('I control music and sounds from the dashboard', ({ given, when, then }) => {
    let before: Audio = { playing: false, volume: 0 }

    given('I am on the admin screen', async () => {
      before = await getAudio()
      restoreAudio = before
      await saveAudio({ volume: START_VOLUME })
      await openAdmin(driver)
      await waitForAttribute(driver, MUSIC_TOGGLE, 'data-playing', String(before.playing))
    })

    when('I click on the play button in the panel Audio', async () => {
      await clickElement(driver, MUSIC_TOGGLE)
    })

    then('the music state on the server switches and the panel shows it', async () => {
      await waitForMusicState(driver, !before.playing)
    })

    when('I click on the play button again', async () => {
      await clickElement(driver, MUSIC_TOGGLE)
    })

    then('the music state on the server switches back', async () => {
      await waitForMusicState(driver, before.playing)
    })

    when('I move the volume slider to 50 and release it', async () => {
      expect(await waitForAttribute(driver, VOLUME_INPUT, 'value', String(START_VOLUME)))
        .toBe(String(START_VOLUME))
      const thumb = await waitForElement(driver, VOLUME_THUMB)
      const rail = await waitForElement(driver, VOLUME_RAIL)
      await driver.actions()
        .move({ origin: thumb })
        .press()
        .move({ origin: rail })
        .release()
        .perform()
    })

    then('the volume on the server is 50 and the panel shows 50', async () => {
      const expected = String(MIDDLE_VOLUME)
      expect(await waitForAttribute(driver, VOLUME_INPUT, 'value', expected)).toBe(expected)
      expect(await waitForText(driver, VOLUME_VALUE, expected)).toBe(expected)
      expect((await getAudio()).volume).toBe(MIDDLE_VOLUME)
    })

    when('I click on a sound button in the panel Audio', async () => {
      await clickElement(driver, SOUND_BUTTON)
    })

    then('no error bar is shown', async () => {
      // Only a failed command is visible in the Admin, as an error bar
      await driver.sleep(WAIT_TIMEOUT / 10)
      expect(await driver.findElements(By.css('[role="alert"]'))).toHaveLength(0)
    })
  })

  test(
    'The first interaction makes an admin window the audio output',
    ({
      given, and, then, when,
    }) => {
      let second: WebDriver | null = null
      let wasPlaying = false

      given('I am on the admin screen and no window is the audio output', async () => {
        const response = await fetch(`${BASE_URL}/api/table/audio`)
        const audio = (await response.json()) as { output_ready: boolean, playing: boolean }
        expect(audio.output_ready).toBe(false)
        wasPlaying = audio.playing
        // The play button below has to start the music
        await setMusicPlaying(false)
        await openAdmin(driver)
      })

      and('a second admin window is open', async () => {
        second = buildDriver()
        screenDrivers.push(second)
        await openAdmin(second)
      })

      then(
        'both admin windows show the hint Keine Audioausgabe bereit and no button Hier abspielen',
        async () => {
          // The hint needs the first audio state, so afterwards a click may request the output
          await Promise.all([driver, second as WebDriver].map(async (item) => {
            await waitForElement(item, NO_OUTPUT_HINT)
            const text = await (await waitForElement(item, panel('audio'))).getText()
            expect(text).not.toContain('Hier abspielen')
          }))
        },
      )

      when('I click on the notes in the first admin window', async () => {
        await clickElement(driver, NOTES_VIEW)
      })

      then('the hint is gone in both admin windows', async () => {
        await waitForElementGone(driver, NO_OUTPUT_HINT)
        await waitForElementGone(second as WebDriver, NO_OUTPUT_HINT)
      })

      when(
        'I press a key in the second admin window and the first admin window is closed',
        async () => {
          await (second as WebDriver).actions().sendKeys('a').perform()
          // Gives a wrongly sent audio_ready of the second window time to reach the server first
          await driver.sleep(WAIT_TIMEOUT / 10)
          await driver.quit()
          driver = second as WebDriver
          screenDrivers = screenDrivers.filter((item) => item !== second)
        },
      )

      then('the second admin window shows the hint Keine Audioausgabe bereit', async () => {
        await waitForElement(driver, NO_OUTPUT_HINT)
      })

      when('I click on the play button in the second admin window', async () => {
        await clickElement(driver, MUSIC_TOGGLE)
      })

      then('the hint is gone and the music plays', async () => {
        await waitForElementGone(driver, NO_OUTPUT_HINT)
        await waitForMusicState(driver, true)
      })

      when('I reload the second admin window', async () => {
        await driver.navigate().refresh()
      })

      then('it shows the hint Keine Audioausgabe bereit until I press a key there', async () => {
        await waitForElement(driver, NO_OUTPUT_HINT)
        await driver.actions().sendKeys('a').perform()
        await waitForElementGone(driver, NO_OUTPUT_HINT)
        await setMusicPlaying(wasPlaying)
      })
    },
    SCREENS_SCENARIO_TIMEOUT,
  )

  // Other wall and ground screens may be connected as well (e.g. at the game table), so the
  // scenario checks the counts relative to the counts before. On failure each of the three status
  // waits takes WAIT_TIMEOUT and two more browsers start, which exceeds the default testTimeout
  test('I see which screens are connected', ({
    given, and, when, then,
  }) => {
    let before: ScreenCounts = { wall: null, ground: null }
    let wall: WebDriver | null = null
    let ground: WebDriver | null = null

    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    and(
      'I noted how many wall and ground screens the panel Spieltisch shows as connected',
      async () => {
        before = await waitForScreenCounts(driver)
        expect(before.wall).not.toBeNull()
        expect(before.ground).not.toBeNull()
      },
    )

    when('a wall screen and a ground screen are opened', async () => {
      wall = buildDriver()
      ground = buildDriver()
      screenDrivers.push(wall, ground)
      await Promise.all([openScreen(wall, '/wall'), openScreen(ground, '/ground')])
    })

    then(
      'the panel Spieltisch shows one more Wall and one more Ground as connected',
      async () => {
        const expected = { wall: Number(before.wall) + 1, ground: Number(before.ground) + 1 }
        expect(await waitForScreenCounts(driver, expected)).toEqual(expected)
      },
    )

    when('the ground screen is closed', async () => {
      const closing = ground
      ground = null
      screenDrivers = screenDrivers.filter((item) => item !== closing)
      await closing?.quit()
    })

    then('the panel Spieltisch shows one Ground less as connected', async () => {
      const expected = { wall: Number(before.wall) + 1, ground: Number(before.ground) }
      expect(await waitForScreenCounts(driver, expected)).toEqual(expected)
    })
  }, SCREENS_SCENARIO_TIMEOUT)

  test('I open the QR code from the panel Spieltisch', ({ given, when, then }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    then(
      'the row Spieler in the panel Spieltisch shows the connected players and the text Spieler '
        + 'QR-Code',
      async () => {
        const status = await waitForElement(driver, `${panel('table')} ${PLAYERS_STATUS}`)
        await driver.wait(
          async () => /^\d+ Spieler verbunden$/.test(await status.getText()),
          WAIT_TIMEOUT,
        )
        const row = await status.findElement(By.xpath('../..'))
        expect(await row.getText()).toContain('Spieler QR-Code')
      },
    )

    when('I click on the QR code icon in the row Spieler', async () => {
      await clickElement(driver, `${panel('table')} ${JOIN_BUTTON}`)
    })

    then('the dialog with the QR code and the player URL is shown', async () => {
      await waitForElement(driver, JOIN_DIALOG)
      // Depending on the setup the URL is known (QR code) or a hint is shown instead
      await waitForElement(driver, '[data-test-id="join-qr-code"], [data-test-id="join-hint"]')
    })

    when('I press Escape', async () => {
      await driver.actions().sendKeys(Key.ESCAPE).perform()
    })

    then('the dialog is closed and the focus is back on the QR code icon', async () => {
      await waitForElementGone(driver, JOIN_DIALOG)
      const focused = await driver.switchTo().activeElement()
      expect(await focused.getAttribute('data-test-id')).toBe('join-button')
    })
  })

  test('I switch the admin window to full screen', ({ given, when, then }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the full screen icon in the header', async () => {
      await clickElement(driver, FULLSCREEN_TOGGLE)
    })

    then('the admin window is in full screen and the icon is highlighted', async () => {
      expect(await waitForFullscreen(driver, true)).toBe(true)
      expect(await waitForAttribute(driver, FULLSCREEN_TOGGLE, 'aria-pressed', 'true'))
        .toBe('true')
    })

    when('I click on the full screen icon again', async () => {
      await clickElement(driver, FULLSCREEN_TOGGLE)
    })

    then('the admin window is no longer in full screen', async () => {
      expect(await waitForFullscreen(driver, false)).toBe(false)
      expect(await waitForAttribute(driver, FULLSCREEN_TOGGLE, 'aria-pressed', 'false'))
        .toBe('false')
    })
  })
})
