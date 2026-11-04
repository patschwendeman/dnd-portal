import { loadFeature, defineFeature } from 'jest-cucumber'
import { By, WebDriver } from 'selenium-webdriver'

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

const feature = loadFeature('__tests__/bdd/features/adminFight.feature')

// Wide enough for rail, panel, notes and dashboard side by side
const WINDOW_RECT = { width: 1600, height: 1000 }
// The scenarios click through several pushes of the server
const SCENARIO_TIMEOUT = 30000

const DASHBOARD = '[data-test-id="dashboard"]'
const FIGHT_ITEM = '[data-test-id="nav-item-fight"]'
const SCENES_ITEM = '[data-test-id="nav-item-scenes"]'
const FIGHT_PANEL = '[data-test-id="nav-panel"] [data-test-id="fight-panel"]'
const FIGHT_ROWS = `${FIGHT_PANEL} [data-test-id="fight-row"]`
const FIGHT_ROW_NAMES = `${FIGHT_ROWS} [data-test-id="combatant-name"]`
const ADD_NUMBER = `${FIGHT_PANEL} [data-test-id="add-number"]`
const ADD_LABEL = `${FIGHT_PANEL} [data-test-id="add-label"]`
const ADD_NPC = `${FIGHT_PANEL} [data-test-id="add-npc"]`
const ADD_ERROR = `${FIGHT_PANEL} [data-test-id="add-error"]`
const START_FIGHT = `${FIGHT_PANEL} [data-test-id="start-fight"]`
const END_FIGHT = `${FIGHT_PANEL} [data-test-id="end-fight"]`
const END_FIGHT_DIALOG = '[data-test-id="end-fight-dialog"]'
const TURN_PANEL = '[data-test-id="dashboard-panel-turn"]'
const HERO_NAME = `${TURN_PANEL} [data-test-id="hero-name"]`
const TURN_ROUND = `${TURN_PANEL} [data-test-id="turn-round"]`
const END_TURN = `${TURN_PANEL} [data-test-id="end-turn"]`
const INITIATIVE_ROWS = '[data-test-id="dashboard-panel-initiative"] li'
const INITIATIVE_NAMES = `${INITIATIVE_ROWS} [data-test-id="combatant-name"]`
const ADVENTURE_SELECT = '[data-test-id="nav-panel"] [data-test-id="adventure-select"]'
const LOCKED_TITLE = 'Während des Kampfes nicht wechselbar'
const SCENE_ENTRIES = '[data-test-id="nav-panel"] [data-test-id="scene-navigation"] button'

interface Player { id: number, character_name: string }
interface TableState { active_adventure_id: number | null, active_scene_id: number | null }

// Long step texts, kept apart so the step definitions stay readable
const STEP_ADDED_ENEMY = 'Gegner 1 with Ghul is last and the number field suggests 2'
const STEP_NUMBER_TAKEN = 'the panel says the number 1 is taken and the list stays the same'
const STEP_STARTED = 'Am Zug shows the first combatant in round 1, '
  + 'then Initiative, Audio, Spieltisch'
const STEP_ENDED = 'the stage, the party and the panel Kampf vorbereiten are back'

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

// After a fresh seed neither an adventure nor a scene is active; both are set over the API, so
// the scenario does not depend on another suite
const ensureActiveScene = async (): Promise<number> => {
  let table = await readJson<TableState>('table')
  if (table.active_adventure_id === null) {
    const [first] = await readJson<{ id: number }[]>('adventures')
    expect((await api('PATCH', 'table', { active_adventure_id: first.id })).ok).toBe(true)
    table = await readJson('table')
  }
  const adventureId = Number(table.active_adventure_id)
  if (table.active_scene_id === null) {
    const [scene] = await readJson<{ id: number }[]>(`adventures/${adventureId}/scenes`)
    expect((await api('PATCH', `adventures/${adventureId}`, { active_scene_id: scene.id })).ok)
      .toBe(true)
  }
  return adventureId
}

// A fight left over by another run would lock scene and adventure for the other suites
const endAnyFight = async (): Promise<void> => {
  const response = await api('DELETE', 'table/fight')
  expect([204, 404, 409]).toContain(response.status)
}

const readPlayers = async (adventureId: number): Promise<Player[]> => (
  (await readJson<{ players: Player[] }>(`adventures/${adventureId}`)).players
)

const startFightOfTwoPlayersAndAnEnemy = async (): Promise<Player[]> => {
  await endAnyFight()
  const players = await readPlayers(await ensureActiveScene())
  const response = await api('POST', 'table/fight', {
    combatants: [
      { kind: 'player', player_id: players[0].id },
      { kind: 'enemy', number: 1 },
      { kind: 'player', player_id: players[1].id },
    ],
  })
  expect(response.status).toBe(201)
  return players
}

const openAdmin = async (driver: WebDriver): Promise<void> => {
  await driver.manage().window().setRect(WINDOW_RECT)
  await openScreen(driver, '/admin')
  await waitForElement(driver, DASHBOARD)
}

const readTexts = async (driver: WebDriver, selector: string): Promise<string[]> => {
  const elements = await driver.findElements(By.css(selector))
  return Promise.all(elements.map((element) => element.getAttribute('textContent')))
}

// Returns the last seen texts instead of throwing on timeout, so the expect shows them
const waitForTexts = async (
  driver: WebDriver,
  selector: string,
  expected: string[],
): Promise<string[]> => {
  let actual: string[] = []
  await driver.wait(async () => {
    actual = await readTexts(driver, selector)
    return JSON.stringify(actual) === JSON.stringify(expected)
  }, WAIT_TIMEOUT).catch(() => undefined)
  return actual
}

const waitForText = async (
  driver: WebDriver,
  selector: string,
  expected: string,
): Promise<string> => (await waitForTexts(driver, selector, [expected]))[0] ?? ''

const clickNth = async (driver: WebDriver, selector: string, index: number): Promise<void> => {
  await waitForElement(driver, selector)
  const elements = await driver.findElements(By.css(selector))
  await elements[index].click()
}

defineFeature(feature, (test) => {
  let driver: WebDriver
  let players: Player[]

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    await driver.quit()
    await endAnyFight()
  })

  const givenSceneWithoutFight = async () => {
    await endAnyFight()
    players = await readPlayers(await ensureActiveScene())
  }

  test('I prepare a fight', ({
    given, when, then, and,
  }) => {
    let namesBefore: string[]

    given('a scene is active and no fight is running', givenSceneWithoutFight)

    and('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the menu item Kampf', async () => {
      await clickElement(driver, FIGHT_ITEM)
    })

    then('the panel Kampf vorbereiten lists all players of the party', async () => {
      const expected = players.map((player) => player.character_name)
      expect(await waitForTexts(driver, FIGHT_ROW_NAMES, expected)).toEqual(expected)
      expect(await waitForElement(driver, START_FIGHT)).toBeTruthy()
    })

    when('I add an enemy with the label Ghul', async () => {
      await (await waitForElement(driver, ADD_LABEL)).sendKeys('Ghul')
      await clickElement(driver, ADD_NPC)
    })

    then(STEP_ADDED_ENEMY, async () => {
      const names = await readTexts(driver, FIGHT_ROW_NAMES)
      expect(names[names.length - 1]).toBe('Gegner 1')
      const details = await readTexts(
        driver,
        `${FIGHT_ROWS}:last-child [data-test-id="combatant-details"]`,
      )
      expect(details).toEqual(['Ghul'])
      expect(await waitForAttribute(driver, ADD_NUMBER, 'value', '2')).toBe('2')
    })

    when('I add the number 1 once more', async () => {
      namesBefore = await readTexts(driver, FIGHT_ROW_NAMES)
      const field = await waitForElement(driver, ADD_NUMBER)
      await field.clear()
      await field.sendKeys('1')
      await clickElement(driver, ADD_NPC)
    })

    then(STEP_NUMBER_TAKEN, async () => {
      expect(await waitForText(driver, ADD_ERROR, 'Nummer 1 ist schon vergeben.'))
        .toBe('Nummer 1 ist schon vergeben.')
      expect(await readTexts(driver, FIGHT_ROW_NAMES)).toEqual(namesBefore)
    })

    when('I remove the first player', async () => {
      await clickNth(driver, `${FIGHT_ROWS} [data-test-id="remove"]`, 0)
    })

    then('the player is missing from the list and can be added again', async () => {
      const [first, ...rest] = players.map((player) => player.character_name)
      expect(await waitForTexts(driver, FIGHT_ROW_NAMES, [...rest, 'Gegner 1']))
        .toEqual([...rest, 'Gegner 1'])
      await clickElement(driver, `${FIGHT_PANEL} [data-test-id="add-player-${players[0].id}"]`)
      expect(await waitForTexts(driver, FIGHT_ROW_NAMES, [...rest, 'Gegner 1', first]))
        .toEqual([...rest, 'Gegner 1', first])
    })
  }, SCENARIO_TIMEOUT)

  test('I start a fight and end turns until the next round', ({
    given, when, then, and,
  }) => {
    given('a scene is active and no fight is running', givenSceneWithoutFight)

    and('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the menu item Kampf', async () => {
      await clickElement(driver, FIGHT_ITEM)
    })

    and('I prepare two players and one enemy', async () => {
      const expected = players.slice(0, 2).map((player) => player.character_name)
      await waitForTexts(driver, FIGHT_ROW_NAMES, players.map((player) => player.character_name))
      for (let remaining = players.length; remaining > 2; remaining -= 1) {
        // eslint-disable-next-line no-await-in-loop -- one removal after the other
        await clickNth(driver, `${FIGHT_ROWS} [data-test-id="remove"]`, remaining - 1)
      }
      await clickElement(driver, ADD_NPC)
      expect(await waitForTexts(driver, FIGHT_ROW_NAMES, [...expected, 'Gegner 1']))
        .toEqual([...expected, 'Gegner 1'])
    })

    and('I click Kampf starten', async () => {
      await clickElement(driver, START_FIGHT)
    })

    then(STEP_STARTED, async () => {
      expect(await waitForText(driver, HERO_NAME, players[0].character_name))
        .toBe(players[0].character_name)
      expect(await waitForText(driver, TURN_ROUND, 'Runde 1')).toBe('Runde 1')
      const panels = await driver.findElements(By.css(`${DASHBOARD} > section`))
      const ids = await Promise.all(panels.map((panel) => panel.getAttribute('data-test-id')))
      expect(ids).toEqual([
        'dashboard-panel-turn',
        'dashboard-panel-initiative',
        'dashboard-panel-audio',
        'dashboard-panel-table',
      ])
      expect(await readTexts(driver, INITIATIVE_NAMES))
        .toEqual([players[0].character_name, players[1].character_name, 'Gegner 1'])
    })

    when('I click Zug beenden three times', async () => {
      const order = [players[1].character_name, 'Gegner 1', players[0].character_name]
      // Each turn waits for the push of the previous one
      await order.reduce(async (previous, next) => {
        await previous
        await clickElement(driver, END_TURN)
        expect(await waitForText(driver, HERO_NAME, next)).toBe(next)
      }, Promise.resolve())
    })

    then('the first combatant is on turn in round 2', async () => {
      expect(await waitForText(driver, HERO_NAME, players[0].character_name))
        .toBe(players[0].character_name)
      expect(await waitForText(driver, TURN_ROUND, 'Runde 2')).toBe('Runde 2')
    })
  }, SCENARIO_TIMEOUT)

  test('Scene and adventure are locked during a fight', ({
    given, when, then, and,
  }) => {
    let activeSceneBefore: number | null

    given('a fight is running', async () => {
      players = await startFightOfTwoPlayersAndAnEnemy()
      activeSceneBefore = (await readJson<{ active_scene_id: number | null }>('table'))
        .active_scene_id
    })

    and('I am on the admin screen', async () => {
      await openAdmin(driver)
      await waitForElement(driver, TURN_PANEL)
    })

    when('I click on the menu item Szenen', async () => {
      await clickElement(driver, SCENES_ITEM)
    })

    and('I click on a scene that is not active', async () => {
      await waitForElement(driver, SCENE_ENTRIES)
      const entries = await driver.findElements(By.css(SCENE_ENTRIES))
      const states = await Promise.all(entries.map((entry) => entry.getAttribute('data-active')))
      await entries[states.indexOf('false')].click()
    })

    then('no dialog opens and the panel says that the fight is running', async () => {
      expect(await (await waitForElement(driver, '[data-test-id="scenes-locked"]')).getText())
        .toContain('Kampf läuft.')
      const confirm = await driver.findElement(By.css('[data-test-id="confirm-button"]'))
      expect(await confirm.isDisplayed()).toBe(false)
      expect((await readJson<{ active_scene_id: number | null }>('table')).active_scene_id)
        .toBe(activeSceneBefore)
    })

    when('I click on the menu item Einstellungen and on the adventure select', async () => {
      await clickElement(driver, '[data-test-id="nav-item-settings"]')
      await clickElement(driver, ADVENTURE_SELECT)
    })

    then('the adventure select is locked and no list opens', async () => {
      expect(await waitForAttribute(driver, ADVENTURE_SELECT, 'aria-disabled', 'true'))
        .toBe('true')
      expect(await waitForAttribute(driver, ADVENTURE_SELECT, 'title', LOCKED_TITLE))
        .toBe(LOCKED_TITLE)
      expect(await waitForElement(driver, '[data-test-id="adventure-select-lock"]')).toBeTruthy()
      expect(await driver.findElements(By.css('[role="listbox"]'))).toHaveLength(0)
    })
  }, SCENARIO_TIMEOUT)

  test('I end the fight', ({
    given, when, then, and,
  }) => {
    given('a fight is running', async () => {
      players = await startFightOfTwoPlayersAndAnEnemy()
    })

    and('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the menu item Kampf', async () => {
      await clickElement(driver, FIGHT_ITEM)
    })

    and('I click Kampf beenden and Decline', async () => {
      await clickElement(driver, END_FIGHT)
      await clickElement(driver, `${END_FIGHT_DIALOG} [data-test-id="decline-button"]`)
      await waitForElementGone(driver, END_FIGHT_DIALOG)
    })

    then('the fight is still running', async () => {
      expect(await waitForElement(driver, TURN_PANEL)).toBeTruthy()
      expect(await readJson('table/fight')).not.toBeNull()
    })

    when('I click Kampf beenden and Confirm', async () => {
      await clickElement(driver, END_FIGHT)
      await clickElement(driver, `${END_FIGHT_DIALOG} [data-test-id="confirm-button"]`)
    })

    then(STEP_ENDED, async () => {
      await waitForElement(driver, '[data-test-id="dashboard-panel-stage"]')
      await waitForElement(driver, '[data-test-id="dashboard-panel-party"]')
      await waitForElementGone(driver, TURN_PANEL)
      await waitForElement(driver, START_FIGHT)
      const expected = players.map((player) => player.character_name)
      expect(await waitForTexts(driver, FIGHT_ROW_NAMES, expected)).toEqual(expected)
    })
  }, SCENARIO_TIMEOUT)

  test('Defeated combatants are skipped', ({
    given, when, then, and,
  }) => {
    given('a fight of the first player, enemy 1 and the second player is running', async () => {
      players = await startFightOfTwoPlayersAndAnEnemy()
    })

    and('I am on the admin screen', async () => {
      await openAdmin(driver)
      expect(await waitForText(driver, HERO_NAME, players[0].character_name))
        .toBe(players[0].character_name)
    })

    when('I mark Gegner 1 as defeated and click Zug beenden', async () => {
      await clickNth(driver, `${INITIATIVE_ROWS} [data-test-id="defeated-toggle"]`, 1)
      await driver.wait(async () => {
        const toggles = await driver.findElements(
          By.css(`${INITIATIVE_ROWS} [data-test-id="defeated-toggle"]`),
        )
        return (await toggles[1].getAttribute('aria-pressed')) === 'true'
      }, WAIT_TIMEOUT)
      await clickElement(driver, END_TURN)
    })

    then('Gegner 1 shows Besiegt and the second player is on turn', async () => {
      expect(await waitForText(driver, HERO_NAME, players[1].character_name))
        .toBe(players[1].character_name)
      const details = await readTexts(
        driver,
        `${INITIATIVE_ROWS}:nth-child(2) [data-test-id="combatant-details"]`,
      )
      expect(details).toEqual(['Besiegt'])
    })
  }, SCENARIO_TIMEOUT)

  test('Reinforcement and removing the combatant on turn', ({
    given, when, then, and,
  }) => {
    given('a fight of the first player, enemy 1 and the second player is running', async () => {
      players = await startFightOfTwoPlayersAndAnEnemy()
    })

    and('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the menu item Kampf', async () => {
      await clickElement(driver, FIGHT_ITEM)
    })

    and('I add an enemy as reinforcement', async () => {
      await waitForElement(driver, END_FIGHT)
      await clickElement(driver, ADD_NPC)
    })

    then('Gegner 2 is at the end of the initiative', async () => {
      const expected = [
        players[0].character_name, 'Gegner 1', players[1].character_name, 'Gegner 2',
      ]
      expect(await waitForTexts(driver, INITIATIVE_NAMES, expected)).toEqual(expected)
    })

    when('I remove the combatant on turn', async () => {
      await clickNth(driver, `${FIGHT_ROWS} [data-test-id="remove"]`, 0)
    })

    then('enemy 1 is on turn and the round stays 1', async () => {
      expect(await waitForText(driver, HERO_NAME, 'Gegner 1')).toBe('Gegner 1')
      expect(await waitForText(driver, TURN_ROUND, 'Runde 1')).toBe('Runde 1')
    })
  }, SCENARIO_TIMEOUT)
})
