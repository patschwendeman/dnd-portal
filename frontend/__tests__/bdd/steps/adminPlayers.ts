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
const PARTY_PANEL = '[data-test-id="dashboard-panel-party"]'
const LEVEL_VALUE = `${PARTY_PANEL} [data-test-id="level-value"]`
const LEVEL_DECREASE = `${PARTY_PANEL} [data-test-id="level-decrease"]`
const LEVEL_INCREASE = `${PARTY_PANEL} [data-test-id="level-increase"]`
const PLAYER_ROWS = `${PARTY_PANEL} li`

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

// The level changes only with the push of the server; returns the last seen text of the stepper
// instead of throwing on timeout, so the step's expect shows expected vs. actual
const waitForLevel = async (driver: WebDriver, level: number): Promise<string | null> => {
  const expected = String(level)
  let actual: string | null = null
  try {
    await driver.wait(async () => {
      const texts = await readTexts(driver, LEVEL_VALUE)
      actual = texts.length > 0 ? texts[0] : null
      return actual === expected
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

  test('The panel Party shows the players of the adventure in one column', ({
    given, then, and,
  }) => {
    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    then(
      'the panel Party shows a row for Aragorn, Legolas, Gimli and Gandalf in this order',
      async () => {
        const expected = SEED_PLAYERS.map((player) => player.characterName)
        let names: string[] = []
        try {
          await driver.wait(async () => {
            names = await readTexts(driver, `${PLAYER_ROWS} [data-test-id="player-character"]`)
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
      'each row shows the initials, the character name and race, class and player name',
      async () => {
        const rows = await driver.findElements(By.css(PLAYER_ROWS))
        const shown = await Promise.all(rows.map(async (row) => {
          const text = async (testId: string) => (
            row.findElement(By.css(`[data-test-id="${testId}"]`)).getText()
          )
          return {
            initials: await text('player-avatar'),
            characterName: await text('player-character'),
            // Race, class and player name share one line
            meta: await row.findElement(By.css('[data-test-id="player-race"]'))
              .findElement(By.xpath('..')).getText(),
          }
        }))
        expect(shown).toEqual(SEED_PLAYERS.map((player) => ({
          initials: player.characterName.charAt(0),
          characterName: player.characterName,
          meta: `${player.race} · ${player.characterClass} · ${player.playerName}`,
        })))
        // The level is shown once, in the head of the panel
        expect(await driver.findElements(By.css(`${PLAYER_ROWS} [data-test-id="player-level"]`)))
          .toHaveLength(0)
      },
    )

    and('each player has a row of its own over the full width of the panel', async () => {
      const rows: { x: number, y: number, bottom: number, width: number }[] = (
        await driver.executeScript(
          `const list = document.querySelector('${PARTY_PANEL} ul').getBoundingClientRect()
          return [...document.querySelectorAll('${PLAYER_ROWS}')].map((row) => {
            const box = row.getBoundingClientRect()
            return {
              x: box.x - list.x, y: box.y, bottom: box.bottom, width: box.width - list.width,
            }
          })`,
        )
      )
      expect(rows).toHaveLength(SEED_PLAYERS.length)
      rows.forEach((row, index) => {
        expect(row.x).toBe(0)
        expect(row.width).toBe(0)
        if (index > 0) {
          expect(row.y).toBeGreaterThan(rows[index - 1].bottom)
        }
      })
    })

    and(
      'the head of the panel shows Party with the number of players and the level of the '
        + 'adventure',
      async () => {
        const adventure = await getAdventure(await waitForActiveAdventureId(driver))
        expect(await waitForLevel(driver, adventure.global_level))
          .toBe(String(adventure.global_level))
        const label = await driver.findElement(By.css(`${PARTY_PANEL} > div:first-child > span`))
        // The label is written in capitals by CSS, getText returns the rendered text
        expect(await label.getText()).toBe(`PARTY · ${SEED_PLAYERS.length}`)
        const labels: string[] = await driver.executeScript(
          `return [...document.querySelectorAll('${DASHBOARD} > section')]
            .map((item) => item.getAttribute('aria-label'))`,
        )
        expect(labels).not.toContain('Level')
        expect(labels[labels.length - 1]).toBe('Party')
      },
    )
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

    then('the head of the panel Party shows level 1 and its minus button is disabled', async () => {
      expect(await waitForLevel(driver, 1)).toBe('1')
      expect(await isEnabled(driver, LEVEL_DECREASE)).toBe(false)
      expect(await isEnabled(driver, LEVEL_INCREASE)).toBe(true)
    })

    when('I click on the plus button in the head of the panel Party', async () => {
      await clickElement(driver, LEVEL_INCREASE)
    })

    then('the head of the panel Party shows level 2 in both windows', async () => {
      expect(await waitForLevel(driver, 2)).toBe('2')
      expect(await waitForLevel(secondDriver as WebDriver, 2)).toBe('2')
      expect((await getAdventure(Number(restore?.adventureId))).global_level).toBe(2)
      expect(await isEnabled(driver, LEVEL_DECREASE)).toBe(true)
    })

    when('I click on the minus button in the head of the panel Party', async () => {
      await clickElement(driver, LEVEL_DECREASE)
    })

    then('the head of the panel Party shows level 1 in both windows', async () => {
      expect(await waitForLevel(driver, 1)).toBe('1')
      expect(await waitForLevel(secondDriver as WebDriver, 1)).toBe('1')
    })
  }, 3 * WAIT_TIMEOUT)

  test('The level does not go above 20', ({
    given, and, then, when,
  }) => {
    given('the level of the active adventure is 20', async () => {
      await setLevel(20)
    })

    and('I am on the admin screen', async () => {
      await driver.navigate().refresh()
      await waitForElement(driver, DASHBOARD)
    })

    then('the head of the panel Party shows level 20 and its plus button is disabled', async () => {
      expect(await waitForLevel(driver, 20)).toBe('20')
      expect(await isEnabled(driver, LEVEL_INCREASE)).toBe(false)
      expect(await isEnabled(driver, LEVEL_DECREASE)).toBe(true)
    })

    when('I click on the plus button in the head of the panel Party', async () => {
      await clickElement(driver, LEVEL_INCREASE)
    })

    then('the level stays 20', async () => {
      // A write would arrive as a push of the server; nothing may arrive
      await driver.sleep(WAIT_TIMEOUT / 10)
      expect(await waitForLevel(driver, 20)).toBe('20')
      expect((await getAdventure(Number(restore?.adventureId))).global_level).toBe(20)
    })

    when('I click on the minus button in the head of the panel Party', async () => {
      await clickElement(driver, LEVEL_DECREASE)
    })

    then('the head of the panel Party shows level 19', async () => {
      expect(await waitForLevel(driver, 19)).toBe('19')
      expect(await isEnabled(driver, LEVEL_INCREASE)).toBe(true)
    })
  })
})
