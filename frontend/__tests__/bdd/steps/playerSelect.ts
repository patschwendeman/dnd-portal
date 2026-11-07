import { loadFeature, defineFeature } from 'jest-cucumber'
import { By, WebDriver } from 'selenium-webdriver'

import {
  BASE_URL,
  WAIT_TIMEOUT,
  buildDriver,
  clickElement,
  openScreen,
  waitForElement,
  waitForElementGone,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/playerSelect.feature')

// Start of the browser plus the waits of the scenario
const SCENARIO_TIMEOUT = 30000

const SELECT = '[data-test-id="player-select"]'
const CHARACTER_NAMES = `${SELECT} [data-test-id="player-character"]`
const ADVENTURE_NAME = '[data-test-id="select-adventure"]'
const NOTICE = '[data-test-id="select-notice"]'
const PLAYER_SCREEN = '[data-test-id="player-screen"]'
const SETTINGS_MENU = '[data-test-id="settings-menu"]'
const SWITCH_CHARACTER = '[data-test-id="switch-character"]'
const MENU_ITEMS = '[role="menu"] [role^="menuitem"]'

const INVALID_IDS: Record<string, string> = {
  'an unknown id': '999999',
  'an invalid id': 'abc',
}

interface Player { id: number, character_name: string }
interface Adventure { id: number, name: string, players: Player[] }
interface TableState { active_adventure_id: number | null }

const api = async (method: string, path: string, body?: object): Promise<Response> => fetch(
  `${BASE_URL}/api/${path}`,
  {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  },
)

const readJson = async <T>(path: string): Promise<T> => {
  const response = await api('GET', path)
  expect(response.ok).toBe(true)
  return (await response.json()) as T
}

// After a fresh seed no adventure is active; the first one (with the seed players) is activated
// over the API, so the scenario does not depend on another suite
const ensureActiveAdventure = async (): Promise<Adventure> => {
  const table = await readJson<TableState>('table')
  if (table.active_adventure_id === null) {
    const [first] = await readJson<{ id: number }[]>('adventures')
    expect((await api('PATCH', 'table', { active_adventure_id: first.id })).ok).toBe(true)
  }
  const { active_adventure_id: adventureId } = await readJson<TableState>('table')
  const adventure = await readJson<Adventure>(`adventures/${adventureId}`)
  expect(adventure.players.length).toBeGreaterThan(0)
  return adventure
}

// Trimmed: the injected icon of "Charakter wechseln" brings whitespace along
const readTexts = async (driver: WebDriver, selector: string): Promise<string[]> => {
  const elements = await driver.findElements(By.css(selector))
  const texts = await Promise.all(elements.map((element) => element.getAttribute('textContent')))
  return texts.map((text) => text.trim())
}

// Returns the last seen value instead of throwing on timeout, so the expect shows it
const waitFor = async <T>(
  driver: WebDriver,
  read: () => Promise<T>,
  expected: T,
): Promise<T> => {
  let actual = await read()
  await driver.wait(async () => {
    actual = await read()
    return JSON.stringify(actual) === JSON.stringify(expected)
  }, WAIT_TIMEOUT).catch(() => undefined)
  return actual
}

const currentPath = async (driver: WebDriver): Promise<string> => (
  new URL(await driver.getCurrentUrl()).pathname
)

defineFeature(feature, (test) => {
  let phone: WebDriver
  let adventure: Adventure

  beforeEach(async () => {
    phone = buildDriver()
  })

  afterEach(async () => {
    await phone.quit()
  })

  const givenActiveAdventure = async () => {
    adventure = await ensureActiveAdventure()
  }

  const openSelection = async () => {
    await openScreen(phone, '/')
  }

  const expectSelectionWithoutNotice = async () => {
    expect(await waitFor(phone, () => currentPath(phone), '/')).toBe('/')
    const names = adventure.players.map((player) => player.character_name)
    expect(await waitFor(phone, () => readTexts(phone, CHARACTER_NAMES), names)).toEqual(names)
    expect(await phone.findElements(By.css(NOTICE))).toHaveLength(0)
  }

  test('The selection lists the characters of the active adventure', ({ given, when, then }) => {
    given('an adventure with players is active', givenActiveAdventure)

    when('a player opens the selection', openSelection)

    then(
      'the selection shows the name of the adventure and one row per character in the order of '
        + 'the API',
      async () => {
        const names = adventure.players.map((player) => player.character_name)
        expect(await waitFor(phone, () => readTexts(phone, CHARACTER_NAMES), names))
          .toEqual(names)
        expect(await readTexts(phone, ADVENTURE_NAME)).toEqual([adventure.name])
        const label = await waitForElement(phone, '[data-test-id="select-party-label"]')
        expect(await label.getAttribute('textContent')).toBe(`Party · ${names.length}`)
      },
    )

    then('the selection has no link to admin, wall or ground', async () => {
      const links: string[] = await phone.executeScript(
        'return Array.from(document.querySelectorAll("a")).map((link) => link.href)',
      )
      expect(links.filter((href) => /\/(admin|wall|ground)/.test(href))).toEqual([])
    })
  }, SCENARIO_TIMEOUT)

  test('A player chooses a character and switches back', ({
    given, and, when, then,
  }) => {
    given('an adventure with players is active', givenActiveAdventure)

    and('a player opens the selection', openSelection)

    when('the player taps the first character', async () => {
      await clickElement(phone, `[data-test-id="character-${adventure.players[0].id}"]`)
    })

    then('the player screen of the first character is open', async () => {
      await waitForElement(phone, PLAYER_SCREEN)
      const path = `/player/${adventure.players[0].id}`
      expect(await waitFor(phone, () => currentPath(phone), path)).toBe(path)
      await waitForElement(phone, '[data-test-id="resources"]')
    })

    when('the player opens the settings menu', async () => {
      await clickElement(phone, SETTINGS_MENU)
    })

    then('the menu offers the themes and "Charakter wechseln"', async () => {
      await waitForElement(phone, SWITCH_CHARACTER)
      expect(await readTexts(phone, MENU_ITEMS))
        .toEqual(['Wie Spieltisch', 'Cyber', 'Taverne', 'Charakter wechseln'])
      // At the center of the last entry nothing lies above the list
      const onTop: boolean = await phone.executeScript(
        `const item = document.querySelector('${SWITCH_CHARACTER}')
        const rect = item.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        return item.contains(document.elementFromPoint(x, rect.top + rect.height / 2))`,
      )
      expect(onTop).toBe(true)
    })

    when('the player chooses "Charakter wechseln"', async () => {
      await clickElement(phone, SWITCH_CHARACTER)
    })

    then('the selection is open without a hint', expectSelectionWithoutNotice)

    and('the settings menu of the selection has no entry "Charakter wechseln"', async () => {
      await clickElement(phone, SETTINGS_MENU)
      await waitForElement(phone, MENU_ITEMS)
      expect(await readTexts(phone, MENU_ITEMS)).toEqual(['Wie Spieltisch', 'Cyber', 'Taverne'])
      await waitForElementGone(phone, SWITCH_CHARACTER)
    })
  }, SCENARIO_TIMEOUT)

  test('An invalid link leads to the selection', ({ given, when, then }) => {
    given('an adventure with players is active', givenActiveAdventure)

    when(/^a player opens the player screen of (.+)$/, async (kind: string) => {
      await openScreen(phone, `/player/${INVALID_IDS[kind]}`)
    })

    then('the selection is open without a hint', expectSelectionWithoutNotice)
  }, SCENARIO_TIMEOUT)
})
