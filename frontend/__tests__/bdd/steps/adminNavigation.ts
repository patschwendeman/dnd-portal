import { loadFeature, defineFeature } from 'jest-cucumber'
import { WebDriver } from 'selenium-webdriver'

import {
  buildDriver,
  clickElement,
  openScreen,
  waitForAttribute,
  waitForElement,
  waitForElementGone,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/adminNavigation.feature')

// Wide enough for rail, panel, notes and right column side by side
const WINDOW_RECT = { width: 1600, height: 1000 }

const RAIL = '[data-test-id="nav-rail"]'
const NOTES_ITEM = '[data-test-id="nav-item-docs"]'
const PANEL = '[data-test-id="nav-panel"]'
const NOTES_VIEW = '[data-test-id="notes-view"]'
const NOTES_SCROLL = '[data-test-id="notes-scroll"]'
const NOTES_ENTRIES = [
  { id: 'main', name: 'Main' },
  { id: 'fight', name: 'Fight' },
  { id: 'leveling', name: 'Leveling' },
  { id: 'mechanics', name: 'Mechaniken' },
]
const SCROLL_TOP = 400

const entry = (id: string): string => `[data-test-id="notes-entry-${id}"]`
// Headings carry folder, file and anchor as id (HeadingRenderer); one heading of each folder
const MAIN_NOTES = `${NOTES_VIEW} h1#note-main-shop--smaragdkranz`
const LEVELING_NOTES = `${NOTES_VIEW} h1#note-leveling-level_1--level_1`

const openAdmin = async (driver: WebDriver): Promise<void> => {
  await driver.manage().window().setRect(WINDOW_RECT)
  await openScreen(driver, '/admin')
}

const getScrollTop = async (driver: WebDriver): Promise<number> => driver.executeScript(
  `return document.querySelector('${NOTES_SCROLL}').scrollTop`,
)

defineFeature(feature, (test) => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    await driver.quit()
  })

  test('The notes panel is open when the admin screen is loaded', ({ given, then, and }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    then('I see the navigation rail with the active menu item Notizen', async () => {
      const rail = await waitForElement(driver, RAIL)
      const buttons = await rail.findElements({ css: 'button' })
      expect(buttons).toHaveLength(4)
      expect(await buttons[0].getAttribute('data-test-id')).toBe('nav-item-docs')
      expect(await buttons[1].getAttribute('data-test-id')).toBe('nav-item-scenes')
      expect(await buttons[2].getAttribute('data-test-id')).toBe('nav-item-fight')
      expect(await buttons[3].getAttribute('data-test-id')).toBe('nav-item-settings')
      const item = await waitForElement(driver, NOTES_ITEM)
      expect(await item.getAttribute('title')).toBe('Notizen')
      expect(await item.getAttribute('aria-label')).toBe('Notizen')
      expect(await item.getAttribute('aria-pressed')).toBe('true')
    })

    and('the panel shows the notes entries Main, Fight, Leveling, Mechaniken', async () => {
      const panel = await waitForElement(driver, PANEL)
      const names = await Promise.all(
        NOTES_ENTRIES.map(async ({ id }) => (
          (await waitForElement(driver, `${PANEL} ${entry(id)}`)).getText()
        )),
      )
      expect(names).toEqual(NOTES_ENTRIES.map(({ name }) => name))
      expect(await panel.findElements({ css: '[data-test-id^="notes-entry-"]' }))
        .toHaveLength(NOTES_ENTRIES.length)
    })

    and('Main is selected and the main notes are shown', async () => {
      expect(await waitForAttribute(driver, entry('main'), 'data-active', 'true')).toBe('true')
      await waitForElement(driver, MAIN_NOTES)
    })
  })

  test('I select notes in the panel', ({ given, when, then }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the notes entry Leveling', async () => {
      await clickElement(driver, entry('leveling'))
    })

    then('Leveling is selected and the leveling notes are shown', async () => {
      expect(await waitForAttribute(driver, entry('leveling'), 'data-active', 'true'))
        .toBe('true')
      expect(await waitForAttribute(driver, entry('main'), 'data-active', 'false')).toBe('false')
      await waitForElement(driver, LEVELING_NOTES)
    })
  })

  test('I collapse and expand the panel', ({
    given, and, when, then,
  }) => {
    let notesWidth = 0
    let scrollTop = 0

    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    and('I selected the notes entry Leveling and scrolled down the notes', async () => {
      await clickElement(driver, entry('leveling'))
      await waitForElement(driver, LEVELING_NOTES)
      scrollTop = await driver.executeScript(
        `const notes = document.querySelector('${NOTES_SCROLL}')
        notes.scrollTo({ top: ${SCROLL_TOP}, behavior: 'instant' })
        return notes.scrollTop`,
      )
      expect(scrollTop).toBe(SCROLL_TOP)
      notesWidth = (await (await waitForElement(driver, NOTES_VIEW)).getRect()).width
    })

    when('I click on the menu item Notizen', async () => {
      await clickElement(driver, NOTES_ITEM)
    })

    then('the panel is hidden, the notes are wider and the menu item is not active', async () => {
      await waitForElementGone(driver, PANEL)
      const widerWidth = (await (await waitForElement(driver, NOTES_VIEW)).getRect()).width
      expect(widerWidth).toBeGreaterThan(notesWidth)
      expect(await waitForAttribute(driver, NOTES_ITEM, 'aria-pressed', 'false')).toBe('false')
    })

    when('I click on the menu item Notizen again', async () => {
      await clickElement(driver, NOTES_ITEM)
    })

    then(
      'the panel is shown again with Leveling selected and the notes at the same scroll position',
      async () => {
        await waitForElement(driver, PANEL)
        expect(await waitForAttribute(driver, NOTES_ITEM, 'aria-pressed', 'true')).toBe('true')
        expect(await waitForAttribute(driver, entry('leveling'), 'data-active', 'true'))
          .toBe('true')
        await waitForElement(driver, LEVELING_NOTES)
        expect(await getScrollTop(driver)).toBe(scrollTop)
      },
    )
  })
})
