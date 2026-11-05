import { loadFeature, defineFeature } from 'jest-cucumber'
import { By, WebDriver } from 'selenium-webdriver'

import {
  BASE_URL,
  WAIT_TIMEOUT,
  buildDriver,
  openScreen,
  waitForElement,
  waitForElementGone,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/wallParty.feature')

const WINDOW_RECT = { width: 1600, height: 1000 }
// Start of the browser plus the waits of the scenario
const SCENARIO_TIMEOUT = 30000

const PARTY_LEFT_NAMES = '[data-test-id="wall-party-left"] [data-test-id="wall-name"]'
const PARTY_RIGHT_NAMES = '[data-test-id="wall-party-right"] [data-test-id="wall-name"]'
const PARTY_TILES = '[data-test-id="wall-party-tile"]'
const WORLD_MAP = '[data-test-id="wall-world-map"]'
const INITIATIVE = '[data-test-id="wall-initiative"]'
// Tiles of the strip in their order
const STRIP_ENTRIES = `${INITIATIVE} > [data-key]`
const TURN_ROUND = `${INITIATIVE} [data-test-id="wall-turn-round"]`

const STEP_START = 'the game master starts a fight of the first player, enemy 1 with a label '
  + 'and the second player'
const STEP_STARTED = 'the wall shows the first player large in round 1, then Gegner 1 and the '
  + 'second player, and no party tiles'
const STEP_TURN_ENDED = 'the wall shows Gegner 1 large, then the second player, the divider '
  + 'Runde 2 and the first player'
const STEP_GIVEN = 'a scene is active, no fight is running and no overlay is shown'

interface Player { id: number, character_name: string }
interface TableState { active_adventure_id: number | null, active_scene_id: number | null }
interface FightState { active_combatant_id: number | null }

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

const setWallOverlay = async (wallOverlay: 'world' | 'off'): Promise<void> => {
  expect((await api('PATCH', 'table', { wall_overlay: wallOverlay })).ok).toBe(true)
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

const firstName = (player: Player): string => player.character_name.split(' ')[0]

// The names of the combatant tiles, the number of the divider and of "+N weitere", read in one go
// because the strip re-renders while the pushes arrive
const readStrip = async (driver: WebDriver): Promise<string[]> => driver.executeScript(
  `return Array.from(document.querySelectorAll('${STRIP_ENTRIES}')).map((entry) => (
    entry.querySelector('[data-test-id="wall-name"]')?.textContent
      ?? entry.querySelector('strong').textContent
  ))`,
)

const readTexts = async (driver: WebDriver, selector: string): Promise<string[]> => {
  const elements = await driver.findElements(By.css(selector))
  return Promise.all(elements.map((element) => element.getAttribute('textContent')))
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

defineFeature(feature, (test) => {
  let wall: WebDriver
  let players: Player[]
  let fight: FightState

  beforeEach(async () => {
    wall = buildDriver()
  })

  afterEach(async () => {
    await wall.quit()
    await endAnyFight()
    await setWallOverlay('off')
  })

  const givenSceneWithoutFight = async () => {
    await endAnyFight()
    await setWallOverlay('off')
    const adventureId = await ensureActiveScene()
    players = (await readJson<{ players: Player[] }>(`adventures/${adventureId}`)).players
    expect(players.length).toBeGreaterThanOrEqual(2)
  }

  const openWall = async () => {
    await wall.manage().window().setRect(WINDOW_RECT)
    await openScreen(wall, '/wall')
  }

  const expectPartySplit = async () => {
    const names = players.map(firstName)
    const leftCount = Math.ceil(names.length / 2)
    const left = names.slice(0, leftCount)
    const right = names.slice(leftCount)
    expect(await waitFor(wall, () => readTexts(wall, PARTY_LEFT_NAMES), left)).toEqual(left)
    expect(await waitFor(wall, () => readTexts(wall, PARTY_RIGHT_NAMES), right)).toEqual(right)
  }

  test('The wall shows the players left and right, the world map lies above them', ({
    given, and, then, when,
  }) => {
    given(STEP_GIVEN, givenSceneWithoutFight)

    and('the wall screen is open', openWall)

    then('the wall shows the first half of the players left and the rest right', expectPartySplit)

    when('the world map is shown on the walls', async () => {
      await setWallOverlay('world')
    })

    then('the world map lies above the players', async () => {
      const worldMap = await waitForElement(wall, WORLD_MAP)
      await wall.wait(async () => worldMap.isDisplayed(), WAIT_TIMEOUT)
      // At the center of a party tile the dimming layer of the world map lies above the tile (the
      // full screen overlay may lie above both if the mouse is over the window)
      const coveredByMap: boolean = await wall.executeScript(
        `const tile = document.querySelector('${PARTY_TILES}')
        const layer = document.querySelector('[data-test-id="wall-world-map-layer"]')
        const rect = tile.getBoundingClientRect()
        const stack = document.elementsFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        )
        return stack.includes(layer) && stack.indexOf(layer) < stack.indexOf(tile)`,
      )
      expect(coveredByMap).toBe(true)
    })
  }, SCENARIO_TIMEOUT)

  test('The wall follows the fight', ({
    given, and, when, then,
  }) => {
    given(STEP_GIVEN, givenSceneWithoutFight)

    and('the wall screen is open', async () => {
      await openWall()
      await expectPartySplit()
    })

    when(STEP_START, async () => {
      const response = await api('POST', 'table/fight', {
        combatants: [
          { kind: 'player', player_id: players[0].id },
          { kind: 'enemy', number: 1, label: 'Ghul' },
          { kind: 'player', player_id: players[1].id },
        ],
      })
      expect(response.status).toBe(201)
      fight = (await response.json()) as FightState
    })

    then(STEP_STARTED, async () => {
      const expected = [
        players[0].character_name, 'Gegner 1', firstName(players[1]), '2',
      ]
      expect(await waitFor(wall, () => readStrip(wall), expected)).toEqual(expected)
      expect(await waitFor(wall, () => readTexts(wall, TURN_ROUND), ['Runde 1']))
        .toEqual(['Runde 1'])
      expect(await wall.findElements(By.css(PARTY_TILES))).toHaveLength(0)
      const texts = await readTexts(wall, INITIATIVE)
      expect(texts.join(' ')).not.toContain('Ghul')
    })

    when('the game master ends the turn', async () => {
      const response = await api('POST', 'table/fight/turn', {
        from_combatant_id: fight.active_combatant_id,
      })
      expect(response.ok).toBe(true)
    })

    then(STEP_TURN_ENDED, async () => {
      const expected = ['Gegner 1', firstName(players[1]), '2', firstName(players[0])]
      expect(await waitFor(wall, () => readStrip(wall), expected)).toEqual(expected)
    })

    when('the game master ends the fight', async () => {
      expect((await api('DELETE', 'table/fight')).status).toBe(204)
    })

    then('the wall shows the players left and right again', async () => {
      await waitForElementGone(wall, INITIATIVE)
      await expectPartySplit()
    })
  }, SCENARIO_TIMEOUT)
})
