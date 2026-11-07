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

const feature = loadFeature('__tests__/bdd/features/adminSettings.feature')

// Wide enough for rail, panel, notes and dashboard side by side
const WINDOW_RECT = { width: 1600, height: 1000 }
// Start of a second browser plus the waits of the scenario
const SCENARIO_TIMEOUT = 6 * WAIT_TIMEOUT

const HEADER = '[data-test-id="admin-header"]'
const ADVENTURE_NAME = `${HEADER} [data-test-id="adventure-name"]`
const RAIL = '[data-test-id="nav-rail"]'
const SETTINGS_ITEM = '[data-test-id="nav-item-settings"]'
const SCENES_ITEM = '[data-test-id="nav-item-scenes"]'
const PANEL = '[data-test-id="nav-panel"]'
const SECTION_IDS = ['settings-adventure', 'settings-theme', 'settings-ground-grid']
const NOTES_VIEW = '[data-test-id="notes-view"]'
const ADVENTURE_SELECT = `${PANEL} [data-test-id="adventure-select"]`
const THEME_SELECT = `${PANEL} [data-test-id="theme-select"]`
const LISTBOX = `${PANEL} [role="listbox"]`
const themeOption = (theme: Theme): string => (
  `${PANEL} [data-test-id="theme-select-option-${theme}"]`
)
const WALL_SCREEN = '[data-test-id="wall-world-map-layer"]'
const ADVENTURE_IMAGES = '[data-test-id="adventure-background"] img'
// Adventure image of the seed adventure; the URL path depends on the API base URL
const ADVENTURE_IMAGE = '/media/images/wall_screen/forest.jpg'
const isAdventureImage = (sources: string[]): boolean => (
  sources.length === 1 && sources[0].includes(ADVENTURE_IMAGE)
)
const ONLY_THE_ADVENTURE_IMAGE = [expect.stringContaining(ADVENTURE_IMAGE)]

type Theme = 'cyber' | 'tavern'

const THEME_LABELS: Record<Theme, string> = { cyber: 'Cyber', tavern: 'Taverne' }
// Surface `secondary` of the Wall in each theme
const WALL_COLORS: Record<Theme, string> = {
  cyber: 'rgb(22, 27, 35)',
  tavern: 'rgb(61, 39, 28)',
}

interface TableState {
  active_adventure_id: number | null
  theme: Theme
}

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}/api/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })
  expect(response.ok).toBe(true)
  return (await response.json()) as T
}

const setTheme = async (theme: Theme): Promise<void> => {
  await api('table', { method: 'PATCH', body: JSON.stringify({ theme }) })
}

// Without an adventure on the game table the Admin activates the first one of the list
const activeAdventureName = async (): Promise<string> => {
  const adventures = await api<{ id: number, name: string }[]>('adventures')
  const { active_adventure_id: activeId } = await api<TableState>('table')
  return (adventures.find((adventure) => adventure.id === activeId) ?? adventures[0]).name
}

const openAdmin = async (driver: WebDriver): Promise<void> => {
  await driver.manage().window().setRect(WINDOW_RECT)
  await openScreen(driver, '/admin')
}

const openSettings = async (driver: WebDriver): Promise<void> => {
  await clickElement(driver, SETTINGS_ITEM)
  await waitForElement(driver, `${PANEL} [data-test-id="settings-panel"]`)
}

const wallColor = async (driver: WebDriver): Promise<string> => driver.executeScript(
  `return getComputedStyle(document.querySelector('${WALL_SCREEN}').parentElement)
    .backgroundColor`,
)

// Returns the last seen colour instead of throwing on timeout, so the step's expect shows it
const waitForWallColor = async (driver: WebDriver, expected: string): Promise<string> => {
  await waitForElement(driver, WALL_SCREEN)
  let actual = ''
  try {
    await driver.wait(async () => {
      actual = await wallColor(driver)
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

const waitForText = async (
  driver: WebDriver,
  selector: string,
  expected: string,
): Promise<string> => {
  const element = await waitForElement(driver, selector)
  let actual = ''
  try {
    await driver.wait(async () => {
      actual = await element.getText()
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

// Exactly one image layer: a theme change neither replaces the image nor fades to another one
const adventureImageSources = async (driver: WebDriver): Promise<string[]> => driver.executeScript(
  `return [...document.querySelectorAll('${ADVENTURE_IMAGES}')]
    .map((image) => image.complete && image.naturalWidth > 0 ? new URL(image.src).pathname : '')`,
)

const waitForAdventureImage = async (driver: WebDriver): Promise<string[]> => {
  let actual: string[] = []
  try {
    await driver.wait(async () => {
      actual = await adventureImageSources(driver)
      return isAdventureImage(actual)
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

const focusedTestId = async (driver: WebDriver): Promise<string | null> => (
  driver.switchTo().activeElement().getAttribute('data-test-id')
)

defineFeature(feature, (test) => {
  let driver: WebDriver
  let wall: WebDriver | null = null

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    const drivers = wall === null ? [driver] : [driver, wall]
    wall = null
    await Promise.allSettled(drivers.map((item) => item.quit()))
    await setTheme('cyber')
  })

  test('The header shows the active adventure and no settings button', ({ given, then, and }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    then('the header shows the name of the active adventure, not clickable', async () => {
      const name = await activeAdventureName()
      expect(await waitForText(driver, ADVENTURE_NAME, name)).toBe(name)
      const tag = await (await waitForElement(driver, ADVENTURE_NAME)).getTagName()
      expect(tag).not.toBe('button')
      expect(await driver.findElements(By.css(`${HEADER} [data-test-id="adventure-select"]`)))
        .toHaveLength(0)
    })

    and('the header has only the buttons Zurück, Vor, Vollbild and Dashboard', async () => {
      const header = await waitForElement(driver, HEADER)
      const buttons = await header.findElements(By.css('button'))
      const ids = await Promise.all(buttons.map((button) => button.getAttribute('data-test-id')))
      expect(ids).toEqual([
        'history-back', 'history-forward', 'fullscreen-toggle', 'dashboard-toggle',
      ])
    })
  })

  test('I open the settings from the lower end of the navigation rail', ({
    given, when, then, and,
  }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the menu item Einstellungen', async () => {
      await clickElement(driver, SETTINGS_ITEM)
    })

    then('Einstellungen is highlighted at the lower end of the rail', async () => {
      expect(await waitForAttribute(driver, SETTINGS_ITEM, 'aria-pressed', 'true')).toBe('true')
      const item = await waitForElement(driver, SETTINGS_ITEM)
      expect(await item.getAttribute('aria-label')).toBe('Einstellungen')
      const rail = await (await waitForElement(driver, RAIL)).getRect()
      const itemRect = await item.getRect()
      const fight = await (await waitForElement(driver, '[data-test-id="nav-item-fight"]'))
        .getRect()
      // Apart from the other items: closer to the bottom of the rail than to the fight item
      expect(rail.y + rail.height - (itemRect.y + itemRect.height))
        .toBeLessThan(itemRect.y - (fight.y + fight.height))
    })

    and('the panel shows the sections Abenteuer, Darstellung and Ground-Raster', async () => {
      expect(await waitForAttribute(driver, PANEL, 'aria-label', 'Einstellungen'))
        .toBe('Einstellungen')
      const labels = await Promise.all(SECTION_IDS.map(async (id) => (
        (await waitForElement(driver, `${PANEL} [data-test-id="${id}"] > span`)).getText()
      )))
      expect(labels.map((label) => label.toUpperCase()))
        .toEqual(['ABENTEUER', 'DARSTELLUNG', 'GROUND-RASTER'])
    })

    and('the notes are still shown', async () => {
      expect(await (await waitForElement(driver, NOTES_VIEW)).isDisplayed()).toBe(true)
    })

    when('I click on the menu item Einstellungen again', async () => {
      await clickElement(driver, SETTINGS_ITEM)
    })

    then('the panel is hidden', async () => {
      await waitForElementGone(driver, PANEL)
      expect(await waitForAttribute(driver, SETTINGS_ITEM, 'aria-pressed', 'false'))
        .toBe('false')
    })

    when('I click on the menu item Einstellungen and then on the menu item Szenen', async () => {
      await clickElement(driver, SETTINGS_ITEM)
      await waitForElement(driver, `${PANEL} [data-test-id="settings-panel"]`)
      await clickElement(driver, SCENES_ITEM)
    })

    then('the panel shows the scenes', async () => {
      await waitForElement(driver, `${PANEL} [data-test-id="scene-navigation"]`)
      await waitForElementGone(driver, `${PANEL} [data-test-id="settings-panel"]`)
      expect(await waitForAttribute(driver, SETTINGS_ITEM, 'aria-pressed', 'false'))
        .toBe('false')
    })
  })

  test('I open the adventure select in the settings', ({ given, when, then }) => {
    given('I am on the admin screen with the settings open', async () => {
      await openAdmin(driver)
      await openSettings(driver)
    })

    when('I click on the adventure select', async () => {
      await clickElement(driver, ADVENTURE_SELECT)
    })

    then('the list shows the active adventure as selected', async () => {
      const name = await activeAdventureName()
      await waitForElement(driver, LISTBOX)
      const selected = await waitForElement(driver, `${LISTBOX} [aria-selected="true"]`)
      expect(await selected.getText()).toBe(name)
      expect(await waitForText(driver, ADVENTURE_SELECT, name)).toBe(name)
    })

    when('I press Escape', async () => {
      await driver.actions().sendKeys(Key.ESCAPE).perform()
    })

    then('the list is closed and the focus is back on the adventure select', async () => {
      await waitForElementGone(driver, LISTBOX)
      expect(await focusedTestId(driver)).toBe('adventure-select')
    })
  })

  test('I switch the theme with the keyboard and the mouse', ({
    given, and, then, when,
  }) => {
    const expectTheme = async (theme: Theme): Promise<void> => {
      await driver.wait(async () => (await api<TableState>('table')).theme === theme, WAIT_TIMEOUT)
      expect((await api<TableState>('table')).theme).toBe(theme)
      expect(await waitForWallColor(wall as WebDriver, WALL_COLORS[theme])).toBe(WALL_COLORS[theme])
      expect(await waitForText(driver, THEME_SELECT, THEME_LABELS[theme]))
        .toBe(THEME_LABELS[theme])
    }

    given('the theme is Cyber and a wall screen is open', async () => {
      await setTheme('cyber')
      wall = buildDriver()
      await openScreen(wall, '/wall')
      expect(await waitForWallColor(wall, WALL_COLORS.cyber)).toBe(WALL_COLORS.cyber)
    })

    and('I am on the admin screen with the settings open', async () => {
      await openAdmin(driver)
      await openSettings(driver)
    })

    then('the theme select shows Cyber', async () => {
      expect(await waitForText(driver, THEME_SELECT, 'Cyber')).toBe('Cyber')
    })

    and('the admin shows the adventure image', async () => {
      expect(await waitForAdventureImage(driver)).toEqual(ONLY_THE_ADVENTURE_IMAGE)
    })

    when('I focus the theme select and press the arrow down', async () => {
      await driver.executeScript(`document.querySelector('${THEME_SELECT}').focus()`)
      await driver.actions().sendKeys(Key.ARROW_DOWN).perform()
    })

    then('the list opens with Cyber selected and focused', async () => {
      expect(await waitForAttribute(driver, themeOption('cyber'), 'aria-selected', 'true'))
        .toBe('true')
      expect(await waitForAttribute(driver, THEME_SELECT, 'aria-expanded', 'true')).toBe('true')
      expect(await focusedTestId(driver)).toBe('theme-select-option-cyber')
    })

    when('I press the arrow down and Enter', async () => {
      await driver.actions().sendKeys(Key.ARROW_DOWN).perform()
      await driver.wait(
        async () => (await focusedTestId(driver)) === 'theme-select-option-tavern',
        WAIT_TIMEOUT,
      )
      await driver.actions().sendKeys(Key.ENTER).perform()
    })

    then(
      'the theme on the server is Taverne, the wall shows Taverne and the select shows Taverne',
      async () => {
        await waitForElementGone(driver, LISTBOX)
        await expectTheme('tavern')
      },
    )

    and('the admin still shows the adventure image', async () => {
      expect(await adventureImageSources(driver)).toEqual(ONLY_THE_ADVENTURE_IMAGE)
    })

    when('I open the theme select and click on Cyber', async () => {
      await clickElement(driver, THEME_SELECT)
      expect(await waitForAttribute(driver, themeOption('tavern'), 'aria-selected', 'true'))
        .toBe('true')
      await clickElement(driver, themeOption('cyber'))
    })

    then(
      'the theme on the server is Cyber, the wall shows Cyber and the select shows Cyber',
      async () => {
        await waitForElementGone(driver, LISTBOX)
        await expectTheme('cyber')
      },
    )

    and('the admin still shows the adventure image', async () => {
      expect(await adventureImageSources(driver)).toEqual(ONLY_THE_ADVENTURE_IMAGE)
    })
  }, SCENARIO_TIMEOUT)
})
