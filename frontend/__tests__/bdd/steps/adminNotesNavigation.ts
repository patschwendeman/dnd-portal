import { loadFeature, defineFeature } from 'jest-cucumber'
import {
  Button, By, Key, WebDriver, error,
} from 'selenium-webdriver'

import {
  BASE_URL,
  WAIT_TIMEOUT,
  buildDriver,
  clickElement,
  openScreen,
  waitForAttribute,
  waitForElement,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/adminNotesNavigation.feature')

// Wide enough for rail, panel, notes and dashboard side by side
const WINDOW_RECT = { width: 1600, height: 1000 }

const ADMIN_URL = `${BASE_URL}/admin`
const HEADER = '[data-test-id="admin-header"]'
const HISTORY_BUTTONS = '[data-test-id="history-buttons"]'
const BACK = '[data-test-id="history-back"]'
const FORWARD = '[data-test-id="history-forward"]'
const NOTES_VIEW = '[data-test-id="notes-view"]'
const NOTES_SCROLL = '[data-test-id="notes-scroll"]'
const REST_LINK = `${NOTES_VIEW} a[href="../mechanics/rest.md#rasten"]`
const SAVE_ROLL_LINK = `${NOTES_VIEW} a[href="#rettungswurf"]`
const REST_HEADING = '#note-mechanics-rest--rasten'
const SAVE_ROLL_HEADING = '#note-mechanics-saveRoll--rettungswurf'
const LEVELING_NOTES = `${NOTES_VIEW} #note-leveling-level_1--level_1`
const MAIN_NOTES = `${NOTES_VIEW} #note-main-shop--smaragdkranz`
const FIGHT_NOTES = `${NOTES_VIEW} #note-fight-room_01--raum_1`
// Small enough that the link "Rast" in the table of contents stays visible
const LEVELING_SCROLL_TOP = 40
const MAIN_SCROLL_TOP = 300
// Rounding of fractional layout positions
const POSITION_TOLERANCE = 1

const entry = (id: string): string => `[data-test-id="notes-entry-${id}"]`

const openAdmin = async (driver: WebDriver): Promise<void> => {
  await driver.manage().window().setRect(WINDOW_RECT)
  await openScreen(driver, '/admin')
}

const selectEntry = async (driver: WebDriver, id: string, notes: string): Promise<void> => {
  await clickElement(driver, entry(id))
  await waitForElement(driver, notes)
}

const getScrollTop = async (driver: WebDriver): Promise<number> => driver.executeScript(
  `return document.querySelector('${NOTES_SCROLL}').scrollTop`,
)

const scrollNotes = async (driver: WebDriver, top: number): Promise<number> => (
  driver.executeScript(
    `const notes = document.querySelector('${NOTES_SCROLL}')
    notes.scrollTo({ top: ${top}, behavior: 'instant' })
    return notes.scrollTop`,
  )
)

// Distance of the heading from the top of the scroll area
const headingOffset = async (driver: WebDriver, heading: string): Promise<number | null> => (
  driver.executeScript(
    `const heading = document.querySelector('${heading}')
    if (heading === null) return null
    const notes = document.querySelector('${NOTES_SCROLL}')
    return heading.getBoundingClientRect().top - notes.getBoundingClientRect().top`,
  )
)

// Waits for a smooth scroll to end; returns the last offset, so the expect shows it
const waitForHeadingAtTop = async (driver: WebDriver, heading: string): Promise<number | null> => {
  let offset: number | null = null
  try {
    await driver.wait(async () => {
      offset = await headingOffset(driver, heading)
      return offset !== null && Math.abs(offset) <= POSITION_TOLERANCE
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return offset
}

const waitForScrollTop = async (driver: WebDriver, expected: number): Promise<number> => {
  let actual = -1
  try {
    await driver.wait(async () => {
      actual = await getScrollTop(driver)
      return Math.abs(actual - expected) <= POSITION_TOLERANCE
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

const isEnabled = async (driver: WebDriver, selector: string): Promise<boolean> => (
  (await waitForElement(driver, selector)).isEnabled()
)

const waitForEnabled = async (
  driver: WebDriver,
  selector: string,
  expected: boolean,
): Promise<boolean> => {
  let actual = !expected
  try {
    await driver.wait(async () => {
      actual = await isEnabled(driver, selector)
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

const expectRestAtTop = async (driver: WebDriver): Promise<void> => {
  expect(await waitForAttribute(driver, entry('mechanics'), 'data-active', 'true')).toBe('true')
  expect(Math.abs(await waitForHeadingAtTop(driver, REST_HEADING) ?? Infinity))
    .toBeLessThanOrEqual(POSITION_TOLERANCE)
}

const expectLevelingRestored = async (driver: WebDriver, scrollTop: number): Promise<void> => {
  expect(await waitForAttribute(driver, entry('leveling'), 'data-active', 'true')).toBe('true')
  await waitForElement(driver, LEVELING_NOTES)
  expect(await waitForScrollTop(driver, scrollTop)).toBeCloseTo(scrollTop, 0)
}

// Leveling scrolled a bit, then the cross reference "Rast"; returns the position before the link
const followRestFromLeveling = async (driver: WebDriver): Promise<number> => {
  await openAdmin(driver)
  await selectEntry(driver, 'leveling', LEVELING_NOTES)
  const scrollTop = await scrollNotes(driver, LEVELING_SCROLL_TOP)
  expect(scrollTop).toBe(LEVELING_SCROLL_TOP)
  await clickElement(driver, REST_LINK)
  await expectRestAtTop(driver)
  return scrollTop
}

defineFeature(feature, (test) => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    await driver.quit()
  })

  test('The history buttons when the admin screen is loaded', ({ given, then, and }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    then(
      'the header shows Zurück and Vor in their own tile at the far left, both disabled',
      async () => {
        const header = await waitForElement(driver, HEADER)
        const tiles = await header.findElements(By.css(':scope > *'))
        expect(await tiles[0].getAttribute('data-test-id')).toBe('history-buttons')
        const buttons = await tiles[0].findElements(By.css('button'))
        expect(buttons).toHaveLength(2)
        expect(await buttons[0].getAttribute('data-test-id')).toBe('history-back')
        expect(await buttons[0].getAttribute('title')).toBe('Zurück')
        expect(await buttons[0].getAttribute('aria-label')).toBe('Zurück')
        expect(await buttons[1].getAttribute('data-test-id')).toBe('history-forward')
        expect(await buttons[1].getAttribute('title')).toBe('Vor')
        expect(await buttons[1].getAttribute('aria-label')).toBe('Vor')
        expect(await isEnabled(driver, BACK)).toBe(false)
        expect(await isEnabled(driver, FORWARD)).toBe(false)
        const tile = await (await waitForElement(driver, HISTORY_BUTTONS)).getRect()
        const name = await (await waitForElement(driver, '[data-test-id="adventure-name"]'))
          .getRect()
        expect(tile.height).toBe(name.height)
      },
    )

    and('Main is the selected notes entry', async () => {
      expect(await waitForAttribute(driver, entry('main'), 'data-active', 'true')).toBe('true')
      await waitForElement(driver, MAIN_NOTES)
    })
  })

  test('I follow a cross reference into another folder', ({
    given, when, then, and,
  }) => {
    given('I am on the admin screen showing the notes Leveling', async () => {
      await openAdmin(driver)
      await selectEntry(driver, 'leveling', LEVELING_NOTES)
    })

    when('I click on the link Rast', async () => {
      await clickElement(driver, REST_LINK)
    })

    then('Mechaniken is selected and the heading Rasten is at the top of the notes', async () => {
      await expectRestAtTop(driver)
    })

    and('the URL of the admin screen is unchanged', async () => {
      expect(await driver.getCurrentUrl()).toBe(ADMIN_URL)
    })
  })

  test('I follow an anchor in the same folder', ({
    given, when, then, and,
  }) => {
    given('I am on the admin screen showing the notes Mechaniken', async () => {
      await openAdmin(driver)
      await selectEntry(driver, 'mechanics', REST_HEADING)
    })

    when('I click on Rettungswurf in the table of contents', async () => {
      await clickElement(driver, SAVE_ROLL_LINK)
    })

    then('the notes scroll to the heading Rettungswurf', async () => {
      expect(Math.abs(await waitForHeadingAtTop(driver, SAVE_ROLL_HEADING) ?? Infinity))
        .toBeLessThanOrEqual(POSITION_TOLERANCE)
    })

    and('Zurück is enabled', async () => {
      expect(await waitForEnabled(driver, BACK, true)).toBe(true)
    })
  })

  test('I go back and forward', ({
    given, when, then, and,
  }) => {
    let scrollTop = 0

    given('I scrolled down the notes Leveling and followed the link Rast', async () => {
      scrollTop = await followRestFromLeveling(driver)
    })

    when('I click on Zurück', async () => {
      await clickElement(driver, BACK)
    })

    then('Leveling is selected at the same scroll position as before the link', async () => {
      await expectLevelingRestored(driver, scrollTop)
    })

    and('Vor is enabled', async () => {
      expect(await waitForEnabled(driver, FORWARD, true)).toBe(true)
    })

    when('I click on Vor', async () => {
      await clickElement(driver, FORWARD)
    })

    then('Mechaniken is selected and the heading Rasten is at the top of the notes', async () => {
      await expectRestAtTop(driver)
    })

    and('Vor is disabled', async () => {
      expect(await waitForEnabled(driver, FORWARD, false)).toBe(false)
    })
  })

  test('I go back after selecting another entry in the panel', ({ given, when, then }) => {
    let scrollTop = 0

    given('I scrolled down the notes Main', async () => {
      await openAdmin(driver)
      await waitForElement(driver, MAIN_NOTES)
      scrollTop = await scrollNotes(driver, MAIN_SCROLL_TOP)
      expect(scrollTop).toBe(MAIN_SCROLL_TOP)
    })

    when('I select the notes entry Fight and click on Zurück', async () => {
      await selectEntry(driver, 'fight', FIGHT_NOTES)
      await clickElement(driver, BACK)
    })

    then('Main is selected at the same scroll position as before', async () => {
      expect(await waitForAttribute(driver, entry('main'), 'data-active', 'true')).toBe('true')
      await waitForElement(driver, MAIN_NOTES)
      expect(await waitForScrollTop(driver, scrollTop)).toBeCloseTo(scrollTop, 0)
    })
  })

  test('A new move after going back drops Vor', ({ given, when, then }) => {
    given('I followed the link Rast and went back', async () => {
      await followRestFromLeveling(driver)
      await clickElement(driver, BACK)
      expect(await waitForEnabled(driver, FORWARD, true)).toBe(true)
    })

    when('I select the notes entry Fight', async () => {
      await selectEntry(driver, 'fight', FIGHT_NOTES)
    })

    then('Vor is disabled', async () => {
      expect(await waitForEnabled(driver, FORWARD, false)).toBe(false)
    })
  })

  test('I go back and forward with the keyboard and the mouse', ({
    given, when, then, and,
  }) => {
    let scrollTop = 0

    given('I scrolled down the notes Leveling and followed the link Rast', async () => {
      scrollTop = await followRestFromLeveling(driver)
    })

    when('I press Alt+Left', async () => {
      await driver.actions().keyDown(Key.ALT).sendKeys(Key.ARROW_LEFT).keyUp(Key.ALT)
        .perform()
    })

    then('Leveling is selected at the same scroll position as before the link', async () => {
      await expectLevelingRestored(driver, scrollTop)
    })

    when('I press Alt+Right', async () => {
      await driver.actions().keyDown(Key.ALT).sendKeys(Key.ARROW_RIGHT).keyUp(Key.ALT)
        .perform()
    })

    then('Mechaniken is selected and the heading Rasten is at the top of the notes', async () => {
      await expectRestAtTop(driver)
    })

    when('I press the back button of the mouse', async () => {
      await driver.actions().press(Button.BACK).release(Button.BACK).perform()
    })

    then('Leveling is selected at the same scroll position as before the link', async () => {
      await expectLevelingRestored(driver, scrollTop)
    })

    when('I press the forward button of the mouse', async () => {
      await driver.actions().press(Button.FORWARD).release(Button.FORWARD).perform()
    })

    then('Mechaniken is selected and the heading Rasten is at the top of the notes', async () => {
      await expectRestAtTop(driver)
    })

    and('the browser is still on the admin screen', async () => {
      expect(await driver.getCurrentUrl()).toBe(ADMIN_URL)
    })
  })
})
