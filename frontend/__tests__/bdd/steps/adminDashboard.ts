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

const entry = (index: number): string => `[data-test-id="notes-entry-${index}"]`
const panel = (id: string): string => `[data-test-id="dashboard-panel-${id}"]`

const screenStatus = (screen: string): string => (
  `${panel('screens')} [data-test-id="screen-${screen}-status"]`
)

const waitForText = async (
  driver: WebDriver,
  selector: string,
  expected: string,
): Promise<string> => {
  let actual = ''
  try {
    await driver.wait(async () => {
      actual = await (await waitForElement(driver, selector)).getText()
      return actual === expected
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

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    await driver.quit()
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

  test('I see which screens are connected', ({
    given, and, when, then,
  }) => {
    let wall: WebDriver
    let ground: WebDriver | null

    given('a wall screen and a ground screen are open', async () => {
      wall = buildDriver()
      ground = buildDriver()
      await openScreen(wall, '/wall')
      await openScreen(ground, '/ground')
    })

    and('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    then('the panel Screens shows Wall and Ground as connected', async () => {
      // Other screens may be open as well (e.g. at the game table); then the count is shown
      expect(await waitForText(driver, screenStatus('wall'), 'verbunden')).toMatch(/verbunden$/)
      expect(await waitForText(driver, screenStatus('ground'), 'verbunden')).toMatch(/verbunden$/)
      expect(await (await waitForElement(driver, screenStatus('ground'))).getText())
        .not.toBe('nicht verbunden')
    })

    when('the ground screen is closed', async () => {
      await ground?.quit()
      ground = null
    })

    then('the panel Screens shows Ground as not connected', async () => {
      try {
        expect(await waitForText(driver, screenStatus('ground'), 'nicht verbunden'))
          .toBe('nicht verbunden')
      } finally {
        await wall.quit()
      }
    })
  })

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
