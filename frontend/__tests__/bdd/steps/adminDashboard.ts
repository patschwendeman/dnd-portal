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
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/adminDashboard.feature')

// Wide enough for rail, panel, notes and dashboard side by side
const WINDOW_RECT = { width: 1600, height: 1000 }

const TOP_BAR = '[data-test-id="top-bar"]'
const DASHBOARD = '[data-test-id="dashboard"]'
const DASHBOARD_TOGGLE = '[data-test-id="dashboard-toggle"]'
const DASHBOARD_PANELS = `${DASHBOARD} > section`
const NOTES_VIEW = '[data-test-id="notes-view"]'
const NOTES_SCROLL = '[data-test-id="notes-scroll"]'
const MUSIC_TOGGLE = '[data-test-id="dashboard-panel-music"] [data-test-id="music-toggle"]'
const SOUND_BUTTON = '[data-test-id="dashboard-panel-sounds"] [data-test-id="sound-heal"]'
const JOIN_BUTTON = '[data-test-id="join-button"]'
const JOIN_DIALOG = '[data-test-id="join-dialog"]'
const PANEL_LABELS = ['Aktive Szene', 'Musik', 'Sounds', 'Screens']
const LEVELING_INDEX = 3
const SCROLL_TOP = 400
// Three status waits plus the start of two more browsers, see the scenario
const SCREENS_SCENARIO_TIMEOUT = 6 * WAIT_TIMEOUT

const entry = (index: number): string => `[data-test-id="notes-entry-${index}"]`
const panel = (id: string): string => `[data-test-id="dashboard-panel-${id}"]`

const screenStatus = (screen: string): string => (
  `${panel('screens')} [data-test-id="screen-${screen}-status"]`
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
  await waitForElement(driver, panel('screens'))
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

const isMusicPlaying = async (): Promise<boolean> => {
  const response = await fetch(`${BASE_URL}/api/table/audio`)
  expect(response.ok).toBe(true)
  return ((await response.json()) as { playing: boolean }).playing
}

// The button changes only with the push of the server, so it shows the state the server keeps
const waitForMusicState = async (driver: WebDriver, playing: boolean): Promise<void> => {
  expect(await waitForAttribute(driver, MUSIC_TOGGLE, 'data-playing', String(playing)))
    .toBe(String(playing))
  expect(await isMusicPlaying()).toBe(playing)
}

defineFeature(feature, (test) => {
  let driver: WebDriver
  // Wall and ground screens a scenario opens in addition; quit after each scenario, also on failure
  let screenDrivers: WebDriver[] = []

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    const drivers = [driver, ...screenDrivers]
    screenDrivers = []
    await Promise.allSettled(drivers.map((item) => item.quit()))
  })

  test('The dashboard shows its panels next to the notes', ({ given, then, and }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    then('I see the dashboard with the panels Aktive Szene, Musik, Sounds, Screens', async () => {
      await waitForElement(driver, DASHBOARD)
      const panels = await driver.findElements(By.css(DASHBOARD_PANELS))
      const labels = await Promise.all(panels.map((item) => item.getAttribute('aria-label')))
      expect(labels).toEqual(PANEL_LABELS)
      const dashboard = await (await waitForElement(driver, DASHBOARD)).getRect()
      const notes = await getNotesWidth(driver)
      // About a third of the content next to the notes
      expect(dashboard.width).toBeLessThan(notes)
      expect(dashboard.width).toBeGreaterThan(notes / 3)
    })

    and(
      'Aktive Szene and Musik span the full width, below them Sounds and Screens side by side',
      async () => {
        const dashboard = await (await waitForElement(driver, DASHBOARD)).getRect()
        const scene = await (await waitForElement(driver, panel('scene'))).getRect()
        const music = await (await waitForElement(driver, panel('music'))).getRect()
        const sounds = await (await waitForElement(driver, panel('sounds'))).getRect()
        const screens = await (await waitForElement(driver, panel('screens'))).getRect()
        // Without the scroll bar the dashboard gets once it is higher than the main area
        const innerWidth: number = await driver.executeScript(
          `return document.querySelector('${DASHBOARD}').clientWidth`,
        )
        expect(dashboard.width).toBeGreaterThanOrEqual(innerWidth)
        expect(scene.width).toBe(innerWidth)
        expect(music.width).toBe(innerWidth)
        expect(music.y).toBeGreaterThan(scene.y + scene.height)
        expect(sounds.y).toBeGreaterThan(music.y + music.height)
        expect(sounds.width).toBeLessThan(innerWidth / 2)
        expect(screens.y).toBe(sounds.y)
        expect(screens.x).toBeGreaterThan(sounds.x + sounds.width)
        expect(screens.height).toBe(sounds.height)
      },
    )

    and('there is no bottom bar, no sound button and no join button in the top bar', async () => {
      const topBar = await waitForElement(driver, TOP_BAR)
      expect(await topBar.findElements(By.css('[data-test-id^="sound-"]'))).toHaveLength(0)
      expect(await topBar.findElements(By.css(JOIN_BUTTON))).toHaveLength(0)
      // The main area reaches the bottom of the window
      const notes = await (await waitForElement(driver, NOTES_VIEW)).getRect()
      const windowHeight: number = await driver.executeScript('return window.innerHeight')
      const main = await (await waitForElement(driver, '[data-test-id="nav-rail"]')).getRect()
      expect(main.y + main.height).toBe(windowHeight)
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
      await clickElement(driver, entry(LEVELING_INDEX))
      await waitForElement(driver, `${NOTES_VIEW} h1#level_1`)
      scrollTop = await driver.executeScript(
        `const notes = document.querySelector('${NOTES_SCROLL}')
        notes.scrollTo({ top: ${SCROLL_TOP}, behavior: 'instant' })
        return notes.scrollTop`,
      )
      expect(scrollTop).toBe(SCROLL_TOP)
      notesWidth = await getNotesWidth(driver)
    })

    when('I click on the dashboard icon in the top bar', async () => {
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
      expect(await waitForAttribute(driver, entry(LEVELING_INDEX), 'data-active', 'true'))
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
    let wasPlaying = false

    given('I am on the admin screen', async () => {
      wasPlaying = await isMusicPlaying()
      await openAdmin(driver)
      await waitForAttribute(driver, MUSIC_TOGGLE, 'data-playing', String(wasPlaying))
    })

    when('I click on the play button in the panel Musik', async () => {
      await clickElement(driver, MUSIC_TOGGLE)
    })

    then('the music state on the server switches and the panel shows it', async () => {
      await waitForMusicState(driver, !wasPlaying)
    })

    when('I click on the play button again', async () => {
      await clickElement(driver, MUSIC_TOGGLE)
    })

    then('the music state on the server switches back', async () => {
      await waitForMusicState(driver, wasPlaying)
    })

    when('I click on a sound button in the panel Sounds', async () => {
      await clickElement(driver, SOUND_BUTTON)
    })

    then('no error bar is shown', async () => {
      // Without an audio output the server drops the sound; the Admin shows no error for it
      await driver.sleep(WAIT_TIMEOUT / 10)
      expect(await driver.findElements(By.css('[role="alert"]'))).toHaveLength(0)
    })
  })

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
      'I noted how many wall and ground screens the panel Screens shows as connected',
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
      'the panel Screens shows one more Wall and one more Ground as connected',
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

    then('the panel Screens shows one Ground less as connected', async () => {
      // The wall screen stays connected
      const expected = { wall: Number(before.wall) + 1, ground: Number(before.ground) }
      expect(await waitForScreenCounts(driver, expected)).toEqual(expected)
    })
  }, SCREENS_SCENARIO_TIMEOUT)

  test('I open the QR code from the panel Screens', ({ given, when, then }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the button QR-Code in the panel Screens', async () => {
      await clickElement(driver, `${panel('screens')} ${JOIN_BUTTON}`)
    })

    then('the dialog with the QR code and the player URL is shown', async () => {
      await waitForElement(driver, JOIN_DIALOG)
      // Depending on the setup the URL is known (QR code) or a hint is shown instead
      await waitForElement(driver, '[data-test-id="join-qr-code"], [data-test-id="join-hint"]')
    })

    when('I press Escape', async () => {
      await driver.actions().sendKeys(Key.ESCAPE).perform()
    })

    then('the dialog is closed and the focus is back on the button QR-Code', async () => {
      await waitForElementGone(driver, JOIN_DIALOG)
      const focused = await driver.switchTo().activeElement()
      expect(await focused.getAttribute('data-test-id')).toBe('join-button')
    })
  })
})
