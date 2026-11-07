import { loadFeature, defineFeature } from 'jest-cucumber'
import { By, WebDriver, error } from 'selenium-webdriver'
import { Driver as ChromeDriver } from 'selenium-webdriver/chrome'

import {
  WAIT_TIMEOUT,
  ActiveScene,
  api,
  buildDriver,
  clickElement,
  ensureActiveAdventure,
  ensureActiveScene,
  entrancePhasesUntil,
  openAdminScreen,
  openScreen,
  readJson,
  recordEntrancePhases,
  restoreActiveScene,
  waitForAttribute,
  waitForElement,
  waitForElementGone,
} from '../support/helpers'
import cyberTheme from '../../../src/style/cyberTheme'
import tavernTheme from '../../../src/style/tavernTheme'

const feature = loadFeature('__tests__/bdd/features/adminAdventureSelect.feature')

// Wide enough for rail, panel, notes and dashboard side by side
const WINDOW_RECT = { width: 1600, height: 1000 }
// Start of further browsers plus the waits of the scenario
const SCENARIO_TIMEOUT = 8 * WAIT_TIMEOUT

const SELECT_PATH = '/admin'
const PLAY_PATH = '/admin/play'
const SELECTION = '[data-test-id="adventure-select"]'
const CARDS = `${SELECTION} [data-test-id^="adventure-card-"][data-active]`
const card = (id: number): string => `${SELECTION} [data-test-id="adventure-card-${id}"]`
const ACTIVE_CARDS = `${SELECTION} [data-active="true"]`
const FIGHT_NOTICE = '[data-test-id="adventure-select-fight"]'
const SELECT_STATE = '[data-test-id="adventure-select-state"]'
const RETRY = '[data-test-id="adventure-select-retry"]'
const ADVENTURE_BACKGROUND = '[data-test-id="adventure-background"]'
const ADMIN_ADVENTURE_NAME = '[data-test-id="admin-header"] [data-test-id="adventure-name"]'
const ADMIN_SCREEN = '[data-test-id="admin-screen"]'
const SETTINGS_ITEM = '[data-test-id="nav-item-settings"]'
const END_ADVENTURE = '[data-test-id="nav-panel"] [data-test-id="end-adventure"]'
const END_ADVENTURE_DIALOG = '[data-test-id="end-adventure-dialog"]'
const WALL_IMAGE = '[data-test-id="wallImg"]'
const PLAYER_SELECT = '[data-test-id="player-select"]'
const PLAYER_CHARACTERS = `${PLAYER_SELECT} [data-test-id="player-character"]`
const ADVENTURES_URL = '*/api/adventures'
// Answers the list of adventures with an empty list, before the page loads its scripts
const EMPTY_ADVENTURES_SCRIPT = `
  const open = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    const isList = new URL(url, location.href).pathname === '/api/adventures'
    return open.call(this, method, isList ? 'data:application/json,[]' : url, ...rest)
  }
`

// Long step texts, kept apart so the step definitions stay readable
const STEP_CARD = 'the card shows image, name, level, description and the party of the adventure'
const STEP_UNCHANGED = 'the admin screen shows Erstes Abenteuer '
  + 'and the active adventure is unchanged'
const STEP_BUILD_UP = 'the admin screen builds up its tiles until all of them stand'
const STEP_AT_ONCE = 'the admin screen stands at once without building up its tiles'

interface Player { id: number, player_name: string, character_name: string }
interface Adventure {
  id: number
  name: string
  description: string | null
  global_level: number
  players: Player[]
  image: { source: string } | null
}
type Theme = 'cyber' | 'tavern'
interface TableState { active_adventure_id: number | null, theme: Theme }

const THEME_COLORS: Record<Theme, typeof cyberTheme.colors> = {
  cyber: cyberTheme.colors,
  tavern: tavernTheme.colors,
}

// Selenium reports computed colors as rgba(), the themes define them as #rrggbb
const hexToRgba = (hex: string): string => {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16))
  return `rgba(${red}, ${green}, ${blue}, 1)`
}

const activeAdventureId = async (): Promise<number | null> => (
  (await readJson<TableState>('table')).active_adventure_id
)

const endAnyFight = async (): Promise<void> => {
  const response = await api('DELETE', 'table/fight')
  expect([204, 404, 409]).toContain(response.status)
}

const endAdventure = async (): Promise<void> => {
  await endAnyFight()
  expect((await api('PATCH', 'table', { active_adventure_id: null })).ok).toBe(true)
}

const firstAdventure = async (): Promise<Adventure> => (
  (await readJson<Adventure[]>('adventures'))[0]
)

const pathOf = async (driver: WebDriver): Promise<string> => (
  new URL(await driver.getCurrentUrl()).pathname
)

// Returns the last seen path instead of throwing on timeout, so the step's expect shows it
const waitForPath = async (driver: WebDriver, expected: string): Promise<string> => {
  let actual = ''
  try {
    await driver.wait(async () => {
      actual = await pathOf(driver)
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

// Returns the last seen value instead of throwing on timeout, so the step's expect shows it
const waitForActiveAdventure = async (
  driver: WebDriver,
  expected: number | null,
): Promise<number | null> => {
  let actual: number | null = null
  try {
    await driver.wait(async () => {
      actual = await activeAdventureId()
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

// Returns the last seen text instead of throwing on timeout
const waitForAdminAdventure = async (driver: WebDriver, expected: string): Promise<string> => {
  const element = await waitForElement(driver, ADMIN_ADVENTURE_NAME)
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

// Returns the last seen color instead of throwing on timeout, so the step's expect shows it
const waitForSelectionColor = async (driver: WebDriver, expected: string): Promise<string> => {
  const selection = await waitForElement(driver, SELECTION)
  let actual = ''
  try {
    await driver.wait(async () => {
      actual = await selection.getCssValue('background-color')
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

const expectPlainBackground = async (driver: WebDriver): Promise<void> => {
  const { theme } = await readJson<TableState>('table')
  const expected = hexToRgba(THEME_COLORS[theme].background)
  expect(await waitForSelectionColor(driver, expected)).toBe(expected)
  expect(await driver.findElements(By.css(ADVENTURE_BACKGROUND))).toHaveLength(0)
}

const openSelection = async (driver: WebDriver): Promise<void> => {
  await driver.manage().window().setRect(WINDOW_RECT)
  await openScreen(driver, SELECT_PATH)
  await waitForElement(driver, SELECTION)
}

defineFeature(feature, (test) => {
  let driver: WebDriver
  let others: WebDriver[] = []
  let activeScene: ActiveScene | null = null

  beforeEach(async () => {
    driver = buildDriver()
  })

  // The other suites expect an active adventure without a fight
  afterEach(async () => {
    const drivers = [driver, ...others]
    others = []
    await Promise.allSettled(drivers.map((item) => item.quit()))
    await endAnyFight()
    await ensureActiveAdventure()
    if (activeScene !== null) {
      await restoreActiveScene(activeScene)
      activeScene = null
    }
  })

  const givenActive = async () => {
    await endAnyFight()
    await ensureActiveAdventure()
  }

  const thenAllCards = async () => {
    const adventures = await readJson<Adventure[]>('adventures')
    await waitForElement(driver, CARDS)
    const ids = await Promise.all((await driver.findElements(By.css(CARDS)))
      .map((element) => element.getAttribute('data-test-id')))
    expect(ids).toEqual(adventures.map((adventure) => `adventure-card-${adventure.id}`))
  }

  test('The selection shows the adventures with the active one marked', ({
    given, when, then, and,
  }) => {
    let adventure: Adventure

    given('the adventure Erstes Abenteuer is active', async () => {
      await givenActive()
      adventure = await firstAdventure()
      expect(adventure.name).toBe('Erstes Abenteuer')
      expect(await activeAdventureId()).toBe(adventure.id)
    })

    when('I open the adventure selection', async () => {
      await openSelection(driver)
    })

    then('I see a card for every adventure', thenAllCards)

    and('the card of Erstes Abenteuer is marked as active', async () => {
      expect(await waitForAttribute(driver, card(adventure.id), 'data-active', 'true'))
        .toBe('true')
      const label = `${card(adventure.id)} [data-test-id="adventure-card-active"]`
      expect(await (await waitForElement(driver, label)).getText()).toMatch(/aktiv/i)
      expect(await driver.findElements(By.css(ACTIVE_CARDS))).toHaveLength(1)
    })

    and(STEP_CARD, async () => {
      const root = card(adventure.id)
      const text = async (testId: string): Promise<string> => (
        (await waitForElement(driver, `${root} [data-test-id="${testId}"]`)).getText()
      )
      const image = await waitForElement(driver, `${root} [data-test-id="adventure-card-image"]`)
      expect(await image.getAttribute('src')).toContain(adventure.image?.source ?? 'no image')
      expect(await text('adventure-card-name')).toBe(adventure.name)
      expect(await text('adventure-card-level')).toBe(String(adventure.global_level))
      expect(await text('adventure-card-description')).toBe(adventure.description)
      expect((await text('adventure-card-party')).toUpperCase())
        .toBe(`PARTY · ${adventure.players.length}`)
      const characters = await Promise.all(
        (await driver.findElements(By.css(`${root} [data-test-id="member-character"]`)))
          .map((element) => element.getText()),
      )
      const players = await Promise.all(
        (await driver.findElements(By.css(`${root} [data-test-id="member-player"]`)))
          .map((element) => element.getText()),
      )
      expect(characters).toEqual(adventure.players.map((player) => player.character_name))
      expect(players).toEqual(adventure.players.map((player) => player.player_name))
    })

    and('the background is plain', async () => {
      await expectPlainBackground(driver)
    })
  }, SCENARIO_TIMEOUT)

  test('I start an adventure while none is active', ({
    given, when, then, and,
  }) => {
    let adventure: Adventure
    let player: WebDriver

    given('no adventure is active and a player screen is open', async () => {
      await endAdventure()
      adventure = await firstAdventure()
      player = buildDriver()
      others = [player]
      await openScreen(player, '/')
      expect(await waitForAttribute(player, PLAYER_SELECT, 'data-status', 'noAdventure'))
        .toBe('noAdventure')
    })

    when('I open the adventure selection', async () => {
      await openSelection(driver)
    })

    then('no card is marked as active and the background is plain', async () => {
      await waitForElement(driver, card(adventure.id))
      expect(await driver.findElements(By.css(ACTIVE_CARDS))).toHaveLength(0)
      await expectPlainBackground(driver)
    })

    and('still no adventure is active on the server', async () => {
      // Long enough for an automatic activation, which the Admin did before
      await driver.sleep(1000)
      expect(await activeAdventureId()).toBeNull()
    })

    when('I click on the card of Erstes Abenteuer', async () => {
      await clickElement(driver, card(adventure.id))
    })

    then('Erstes Abenteuer is active on the server and the admin screen shows it', async () => {
      expect(await waitForPath(driver, PLAY_PATH)).toBe(PLAY_PATH)
      expect(await activeAdventureId()).toBe(adventure.id)
      expect(await waitForAdminAdventure(driver, adventure.name)).toBe(adventure.name)
    })

    and('the player screen shows the characters of Erstes Abenteuer', async () => {
      expect(await waitForAttribute(player, PLAYER_SELECT, 'data-status', 'list')).toBe('list')
      const names = await Promise.all((await player.findElements(By.css(PLAYER_CHARACTERS)))
        .map((element) => element.getText()))
      expect(names).toEqual(adventure.players.map((item) => item.character_name))
    })
  }, SCENARIO_TIMEOUT)

  test('I continue the active adventure', ({
    given, when, then, and,
  }) => {
    let adventure: Adventure

    given('the adventure Erstes Abenteuer is active', async () => {
      await givenActive()
      adventure = await firstAdventure()
    })

    when('I open the adventure selection', async () => {
      await openSelection(driver)
    })

    and('I click on the card of Erstes Abenteuer', async () => {
      expect(await waitForAttribute(driver, card(adventure.id), 'data-active', 'true'))
        .toBe('true')
      await clickElement(driver, card(adventure.id))
    })

    then(STEP_UNCHANGED, async () => {
      expect(await waitForPath(driver, PLAY_PATH)).toBe(PLAY_PATH)
      expect(await waitForAdminAdventure(driver, adventure.name)).toBe(adventure.name)
      expect(await activeAdventureId()).toBe(adventure.id)
    })
  }, SCENARIO_TIMEOUT)

  test('The admin screen builds up after entering from the selection, not after a reload', ({
    given, when, then, and,
  }) => {
    let adventure: Adventure

    given('the adventure Erstes Abenteuer is active', async () => {
      await givenActive()
      adventure = await firstAdventure()
    })

    when('I open the adventure selection', async () => {
      await openSelection(driver)
      await recordEntrancePhases(driver)
    })

    and('I click on the card of Erstes Abenteuer', async () => {
      await clickElement(driver, card(adventure.id))
    })

    then(STEP_BUILD_UP, async () => {
      expect(await waitForPath(driver, PLAY_PATH)).toBe(PLAY_PATH)
      const phases = await entrancePhasesUntil(driver, 'done')
      expect(phases.slice(-2)).toEqual(['building', 'done'])
      expect(await waitForAdminAdventure(driver, adventure.name)).toBe(adventure.name)
    })

    when('I reload the admin screen', async () => {
      await driver.navigate().refresh()
    })

    then(STEP_AT_ONCE, async () => {
      await waitForElement(driver, ADMIN_SCREEN)
      expect(await waitForAdminAdventure(driver, adventure.name)).toBe(adventure.name)
      expect(await entrancePhasesUntil(driver, 'done')).toEqual(['done'])
    })
  }, SCENARIO_TIMEOUT)

  test('I end the adventure', ({
    given, when, then, and,
  }) => {
    let wall: WebDriver
    let otherAdmin: WebDriver

    given(
      'an adventure with an active scene is active, a wall and a second admin screen are open',
      async () => {
        await endAnyFight()
        activeScene = await ensureActiveScene()
        wall = buildDriver()
        otherAdmin = buildDriver()
        others = [wall, otherAdmin]
        await Promise.all([openScreen(wall, '/wall'), openAdminScreen(otherAdmin)])
        await waitForElement(wall, WALL_IMAGE)
        await waitForElement(otherAdmin, ADMIN_ADVENTURE_NAME)
      },
    )

    and('I am on the admin screen with the settings open', async () => {
      await driver.manage().window().setRect(WINDOW_RECT)
      await openAdminScreen(driver)
      await clickElement(driver, SETTINGS_ITEM)
    })

    when('I click on Abenteuer beenden and confirm the dialog', async () => {
      await clickElement(driver, END_ADVENTURE)
      await clickElement(driver, `${END_ADVENTURE_DIALOG} [data-test-id="confirm-button"]`)
    })

    then('no adventure is active on the server and the wall shows no scene image', async () => {
      expect(await waitForActiveAdventure(driver, null)).toBeNull()
      await waitForElementGone(wall, WALL_IMAGE)
    })

    and('both admin screens show the adventure selection', async () => {
      expect(await waitForPath(driver, SELECT_PATH)).toBe(SELECT_PATH)
      expect(await waitForPath(otherAdmin, SELECT_PATH)).toBe(SELECT_PATH)
      await waitForElement(driver, SELECTION)
      await waitForElement(otherAdmin, SELECTION)
      expect(await driver.findElements(By.css(ACTIVE_CARDS))).toHaveLength(0)
    })
  }, SCENARIO_TIMEOUT)

  test('A fight locks the change of the adventure', ({
    given, when, then, and,
  }) => {
    let adventureId: number

    given('a fight is running in the active adventure', async () => {
      await endAnyFight()
      activeScene = await ensureActiveScene()
      adventureId = activeScene.adventureId
      const response = await api('POST', 'table/fight', {
        combatants: [{ kind: 'enemy', number: 1 }],
      })
      expect(response.status).toBe(201)
    })

    when('I open the adventure selection', async () => {
      await openSelection(driver)
    })

    then('the selection says that a fight is running', async () => {
      expect(await (await waitForElement(driver, FIGHT_NOTICE)).getText())
        .toContain('läuft ein Kampf')
    })

    and('the card of the active adventure is not locked', async () => {
      expect(await waitForAttribute(driver, card(adventureId), 'data-locked', 'false'))
        .toBe('false')
      expect(await (await waitForElement(driver, card(adventureId))).getAttribute('aria-disabled'))
        .toBeNull()
    })

    when('I click on the card of the active adventure', async () => {
      await clickElement(driver, card(adventureId))
    })

    then('the admin screen opens', async () => {
      expect(await waitForPath(driver, PLAY_PATH)).toBe(PLAY_PATH)
      await waitForElement(driver, ADMIN_ADVENTURE_NAME)
      expect(await activeAdventureId()).toBe(adventureId)
    })
  }, SCENARIO_TIMEOUT)

  test('The admin screen without an active adventure leads to the selection', ({
    given, when, then,
  }) => {
    given('no adventure is active', async () => {
      await endAdventure()
    })

    when('I open the admin screen directly', async () => {
      await driver.manage().window().setRect(WINDOW_RECT)
      await openScreen(driver, PLAY_PATH)
    })

    then('I am on the adventure selection', async () => {
      expect(await waitForPath(driver, SELECT_PATH)).toBe(SELECT_PATH)
      await waitForElement(driver, SELECTION)
      expect(await activeAdventureId()).toBeNull()
    })
  }, SCENARIO_TIMEOUT)

  test('The selection reports that the adventures cannot be loaded', ({
    given, when, then,
  }) => {
    given('the adventures cannot be loaded', async () => {
      await givenActive()
      const chrome = driver as ChromeDriver
      await chrome.sendDevToolsCommand('Network.enable', {})
      await chrome.sendDevToolsCommand('Network.setBlockedURLs', { urls: [ADVENTURES_URL] })
    })

    when('I open the adventure selection', async () => {
      await openSelection(driver)
    })

    then('the selection says Keine Verbindung zum Server with Erneut versuchen', async () => {
      expect(await waitForAttribute(driver, SELECTION, 'data-status', 'offline')).toBe('offline')
      expect(await (await waitForElement(driver, SELECT_STATE)).getText())
        .toContain('Keine Verbindung zum Server')
      expect(await (await waitForElement(driver, RETRY)).getText()).toContain('Erneut versuchen')
    })

    when('the adventures can be loaded again and I click on Erneut versuchen', async () => {
      await (driver as ChromeDriver).sendDevToolsCommand('Network.setBlockedURLs', { urls: [] })
      await clickElement(driver, RETRY)
    })

    then('I see a card for every adventure', thenAllCards)
  }, SCENARIO_TIMEOUT)

  test('The selection without adventures', ({ given, when, then }) => {
    given('the server has no adventures', async () => {
      await givenActive()
      await (driver as ChromeDriver).sendDevToolsCommand(
        'Page.addScriptToEvaluateOnNewDocument',
        { source: EMPTY_ADVENTURES_SCRIPT },
      )
    })

    when('I open the adventure selection', async () => {
      await openSelection(driver)
    })

    then('the selection says Noch keine Abenteuer', async () => {
      expect(await waitForAttribute(driver, SELECTION, 'data-status', 'empty')).toBe('empty')
      expect(await (await waitForElement(driver, SELECT_STATE)).getText())
        .toContain('Noch keine Abenteuer')
    })
  }, SCENARIO_TIMEOUT)
})
