import { loadFeature, defineFeature } from 'jest-cucumber'
import { By, WebDriver, error } from 'selenium-webdriver'

import {
  BASE_URL,
  WAIT_TIMEOUT,
  buildDriver,
  clickElement,
  openScreen,
  waitForElement,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/adminPlayers.feature')

// Wide enough for rail, panel, notes and dashboard side by side
const WINDOW_RECT = { width: 1600, height: 1000 }

const DASHBOARD = '[data-test-id="dashboard"]'
const LEVEL_PANEL = '[data-test-id="dashboard-panel-level"]'
const PLAYERS_PANEL = '[data-test-id="dashboard-panel-players"]'
const LEVEL_VALUE = `${LEVEL_PANEL} [data-test-id="level-value"]`
const LEVEL_DECREASE = `${LEVEL_PANEL} [data-test-id="level-decrease"]`
const LEVEL_INCREASE = `${LEVEL_PANEL} [data-test-id="level-increase"]`
const PLAYER_CARDS = `${PLAYERS_PANEL} article`
const LEVEL_BADGES = `${PLAYERS_PANEL} [data-test-id="player-level"]`

// Players of the first adventure in ../backend/app/db/data/seed_data.json
const SEED_PLAYERS = [
  {
    playerName: 'Spieler 1', characterName: 'Aragorn', race: 'Mensch', characterClass: 'Waldläufer',
  },
  {
    playerName: 'Spieler 2', characterName: 'Legolas', race: 'Elf', characterClass: 'Kämpfer',
  },
  {
    playerName: 'Spieler 3', characterName: 'Gimli', race: 'Zwerg', characterClass: 'Barbar',
  },
  {
    playerName: 'Spieler 4', characterName: 'Gandalf', race: 'Mensch', characterClass: 'Magier',
  },
]

interface AdventureDetail { id: number, global_level: number }

const openAdmin = async (driver: WebDriver): Promise<void> => {
  await driver.manage().window().setRect(WINDOW_RECT)
  await openScreen(driver, '/admin')
  await waitForElement(driver, DASHBOARD)
}

// After a fresh seed no adventure is active until an Admin activates the first one
const waitForActiveAdventureId = async (driver: WebDriver): Promise<number> => {
  let adventureId: number | null = null
  await driver.wait(async () => {
    const response = await fetch(`${BASE_URL}/api/table`)
    expect(response.ok).toBe(true)
    adventureId = ((await response.json()) as { active_adventure_id: number | null })
      .active_adventure_id
    return adventureId !== null
  }, WAIT_TIMEOUT)
  return Number(adventureId)
}

const getAdventure = async (adventureId: number): Promise<AdventureDetail> => {
  const response = await fetch(`${BASE_URL}/api/adventures/${adventureId}`)
  expect(response.ok).toBe(true)
  return (await response.json()) as AdventureDetail
}

const saveLevel = async (adventureId: number, level: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/api/adventures/${adventureId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ global_level: level }),
  })
  expect(response.ok).toBe(true)
}

const readTexts = async (driver: WebDriver, selector: string): Promise<string[]> => {
  const elements = await driver.findElements(By.css(selector))
  return Promise.all(elements.map((element) => element.getText()))
}

// The level changes only with the push of the server; returns the last seen texts of the panel and
// of all badges instead of throwing on timeout, so the step's expect shows expected vs. actual
const waitForLevel = async (driver: WebDriver, level: number): Promise<string[]> => {
  const expected = String(level)
  let actual: string[] = []
  try {
    await driver.wait(async () => {
      actual = [
        ...(await readTexts(driver, LEVEL_VALUE)),
        ...(await readTexts(driver, LEVEL_BADGES)),
      ]
      return actual.length === 1 + SEED_PLAYERS.length
        && actual.every((text) => text === expected)
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

// Panel and one badge per player
const levelTexts = (level: number): string[] => (
  Array(1 + SEED_PLAYERS.length).fill(String(level))
)

const isEnabled = async (driver: WebDriver, selector: string): Promise<boolean> => (
  (await waitForElement(driver, selector)).isEnabled()
)

defineFeature(feature, (test) => {
  let driver: WebDriver
  let secondDriver: WebDriver | null = null
  // Level before the scenario, restored afterwards: all specs share the one game table
  let restore: { adventureId: number, level: number } | null = null

  const setLevel = async (level: number): Promise<void> => {
    await openAdmin(driver)
    const adventureId = await waitForActiveAdventureId(driver)
    const before = await getAdventure(adventureId)
    restore = restore ?? { adventureId, level: before.global_level }
    await saveLevel(adventureId, level)
  }

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    const drivers = secondDriver === null ? [driver] : [driver, secondDriver]
    secondDriver = null
    await Promise.allSettled(drivers.map((item) => item.quit()))
    if (restore !== null) {
      await saveLevel(restore.adventureId, restore.level)
      restore = null
    }
  })

  test('The panel Spieler shows the players of the adventure', ({ given, then, and }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    then(
      'the panel Spieler shows a hero card for Aragorn, Legolas, Gimli and Gandalf in this order',
      async () => {
        const expected = SEED_PLAYERS.map((player) => player.characterName)
        let names: string[] = []
        try {
          await driver.wait(async () => {
            names = await readTexts(driver, `${PLAYER_CARDS} [data-test-id="player-character"]`)
            return names.length === expected.length
          }, WAIT_TIMEOUT)
        } catch (err) {
          if (!(err instanceof error.TimeoutError)) {
            throw err
          }
        }
        expect(names).toEqual(expected)
      },
    )

    and(
      'each card shows player name, character name, race, class, initials and the level of the '
        + 'adventure',
      async () => {
        const adventure = await getAdventure(await waitForActiveAdventureId(driver))
        const cards = await driver.findElements(By.css(PLAYER_CARDS))
        const shown = await Promise.all(cards.map(async (card) => {
          const text = async (testId: string) => (
            card.findElement(By.css(`[data-test-id="${testId}"]`)).getText()
          )
          return {
            playerName: await text('player-name'),
            characterName: await text('player-character'),
            race: await text('player-race'),
            characterClass: await text('player-class'),
            initials: await text('player-avatar'),
            level: await text('player-level'),
          }
        }))
        // The label is written in capitals by CSS, getText returns the rendered text
        expect(shown).toEqual(SEED_PLAYERS.map((player) => ({
          ...player,
          playerName: player.playerName.toUpperCase(),
          initials: player.characterName.charAt(0),
          level: String(adventure.global_level),
        })))
      },
    )

    and('the panel Level spans the full width directly above the panel Spieler', async () => {
      const level = await (await waitForElement(driver, LEVEL_PANEL)).getRect()
      const players = await (await waitForElement(driver, PLAYERS_PANEL)).getRect()
      const innerWidth: number = await driver.executeScript(
        `return document.querySelector('${DASHBOARD}').clientWidth`,
      )
      expect(level.width).toBe(innerWidth)
      expect(players.width).toBe(innerWidth)
      expect(players.y).toBeGreaterThan(level.y + level.height)
      const labels: string[] = await driver.executeScript(
        `return [...document.querySelectorAll('${DASHBOARD} > section')]
          .map((item) => item.getAttribute('aria-label'))`,
      )
      expect(labels.slice(-2)).toEqual(['Level', 'Spieler'])
    })
  })

  test('I change the level of all players', ({
    given, and, when, then,
  }) => {
    given('the level of the active adventure is 1', async () => {
      await setLevel(1)
    })

    and('I am on the admin screen in two windows', async () => {
      secondDriver = buildDriver()
      await openAdmin(secondDriver)
    })

    then('the panel Level shows 1 and its minus button is disabled', async () => {
      expect(await waitForLevel(driver, 1)).toEqual(levelTexts(1))
      expect(await isEnabled(driver, LEVEL_DECREASE)).toBe(false)
      expect(await isEnabled(driver, LEVEL_INCREASE)).toBe(true)
    })

    when('I click on the plus button in the panel Level', async () => {
      await clickElement(driver, LEVEL_INCREASE)
    })

    then('the panel Level and all level badges show 2 in both windows', async () => {
      expect(await waitForLevel(driver, 2)).toEqual(levelTexts(2))
      expect(await waitForLevel(secondDriver as WebDriver, 2)).toEqual(levelTexts(2))
      expect((await getAdventure(Number(restore?.adventureId))).global_level).toBe(2)
      expect(await isEnabled(driver, LEVEL_DECREASE)).toBe(true)
    })

    when('I click on the minus button in the panel Level', async () => {
      await clickElement(driver, LEVEL_DECREASE)
    })

    then('the panel Level and all level badges show 1 in both windows', async () => {
      expect(await waitForLevel(driver, 1)).toEqual(levelTexts(1))
      expect(await waitForLevel(secondDriver as WebDriver, 1)).toEqual(levelTexts(1))
    })
  }, 3 * WAIT_TIMEOUT)

  test('The level does not go above 20', ({ given, and, then }) => {
    given('the level of the active adventure is 20', async () => {
      await setLevel(20)
    })

    and('I am on the admin screen', async () => {
      await driver.navigate().refresh()
      await waitForElement(driver, DASHBOARD)
    })

    then('the panel Level shows 20 and its plus button is disabled', async () => {
      expect(await waitForLevel(driver, 20)).toEqual(levelTexts(20))
      expect(await isEnabled(driver, LEVEL_INCREASE)).toBe(false)
      expect(await isEnabled(driver, LEVEL_DECREASE)).toBe(true)
    })
  })
})
