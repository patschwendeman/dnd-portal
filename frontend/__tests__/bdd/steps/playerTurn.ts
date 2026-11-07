import { loadFeature, defineFeature } from 'jest-cucumber'
import { By, WebDriver } from 'selenium-webdriver'

import {
  BASE_URL,
  WAIT_TIMEOUT,
  buildDriver,
  clickElement,
  openAdminScreen,
  openScreen,
  waitForAttribute,
  waitForElement,
  waitForElementGone,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/playerTurn.feature')

// A phone held sideways
const PHONE_RECT = { width: 844, height: 390 }
const ADMIN_RECT = { width: 1600, height: 1000 }
// Start of up to two browsers plus the pushes of the server
const SCENARIO_TIMEOUT = 40000

const HERO = '[data-test-id="player-hero"]'
const HERO_CAPTION = `${HERO} [data-test-id="hero-caption"]`
const HERO_NAME = `${HERO} [data-test-id="hero-name"]`
const HERO_LEVEL = `${HERO} [data-test-id="hero-level"]`
const HERO_MENU = `${HERO} [data-test-id="settings-menu"]`
const ON_TURN = `${HERO} [data-test-id="on-turn"]`
const END_TURN = `${HERO} [data-test-id="player-end-turn"]`
const RESOURCES = '[data-test-id="resources"]'
const SWITCH_CHARACTER = '[data-test-id="switch-character"]'
const ADMIN_HERO_NAME = '[data-test-id="dashboard-panel-turn"] [data-test-id="hero-name"]'

interface Player {
  id: number
  player_name: string
  character_name: string
  race: string
  character_class: string
}
interface Adventure { id: number, global_level: number, players: Player[] }
interface TableState { active_adventure_id: number | null, active_scene_id: number | null }
interface Fight { round: number, active_combatant_id: number | null, combatants: { id: number }[] }

const STEP_FIGHT = 'a fight of the first player, an enemy and the second player is running'
const STEP_HERO_CONTENT = 'the hero card shows player name, character name, race, class, the '
  + 'level and the settings menu'
const STEP_SURFACE = 'hero card and resources have the same surface as the settings button'
const STEP_DOUBLE = 'the first player taps "Zug beenden" while a second phone ends the same turn'
const STEP_ON_TURN = 'the hero card shows frame, badge "Am Zug" and the button "Zug beenden"'
const MAX_LEVEL = 20

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
const ensureActiveScene = async (): Promise<Adventure> => {
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
  const adventure = await readJson<Adventure>(`adventures/${adventureId}`)
  expect(adventure.players.length).toBeGreaterThan(1)
  return adventure
}

// A fight left over by another run would lock scene and adventure for the other suites
const endAnyFight = async (): Promise<void> => {
  const response = await api('DELETE', 'table/fight')
  expect([204, 404, 409]).toContain(response.status)
}

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

const activeCombatantId = async (): Promise<number | null> => (
  (await readJson<Fight>('table/fight')).active_combatant_id
)

interface Surface { background: string, backdrop: string }

const readSurface = async (driver: WebDriver, selector: string): Promise<Surface> => (
  driver.executeScript(
    `const style = getComputedStyle(document.querySelector('${selector}'))
    return { background: style.backgroundColor, backdrop: style.backdropFilter }`,
  )
)

defineFeature(feature, (test) => {
  let phone: WebDriver
  let admin: WebDriver | null
  let adventure: Adventure
  let fight: Fight
  // Level before a scenario changed it, restored afterwards for the other suites
  let changedLevel: { adventureId: number, level: number } | null

  beforeEach(async () => {
    phone = buildDriver()
    admin = null
    changedLevel = null
  })

  // Level first: a failing quit or endAnyFight must not leave the level changed for other suites
  afterEach(async () => {
    try {
      if (changedLevel !== null) {
        const response = await api('PATCH', `adventures/${changedLevel.adventureId}`, {
          global_level: changedLevel.level,
        })
        expect(response.ok).toBe(true)
      }
    } finally {
      await Promise.allSettled([phone.quit(), admin?.quit()])
      await endAnyFight()
    }
  })

  const givenSceneWithoutFight = async () => {
    await endAnyFight()
    adventure = await ensureActiveScene()
  }

  const givenFight = async () => {
    await givenSceneWithoutFight()
    const response = await api('POST', 'table/fight', {
      combatants: [
        { kind: 'player', player_id: adventure.players[0].id },
        { kind: 'enemy', number: 1 },
        { kind: 'player', player_id: adventure.players[1].id },
      ],
    })
    expect(response.status).toBe(201)
    fight = (await response.json()) as Fight
  }

  // The window includes the browser UI; corrected so the page itself has the size of the phone
  const openPlayerScreen = (index: number) => async () => {
    await phone.manage().window().setRect(PHONE_RECT)
    const inner: number = await phone.executeScript('return window.innerHeight')
    await phone.manage().window().setRect({
      ...PHONE_RECT, height: 2 * PHONE_RECT.height - inner,
    })
    await openScreen(phone, `/player/${adventure.players[index].id}`)
    await waitForElement(phone, HERO_NAME)
    await waitForElement(phone, RESOURCES)
  }

  const expectNotOnTurn = async () => {
    expect(await waitForAttribute(phone, HERO, 'data-on-turn', 'false')).toBe('false')
    await waitForElementGone(phone, END_TURN)
    expect(await phone.findElements(By.css(ON_TURN))).toHaveLength(0)
  }

  const expectOnTurn = (index: number) => async () => {
    const combatantId = fight.combatants[index].id
    expect(await waitFor(phone, activeCombatantId, combatantId)).toBe(combatantId)
  }
  const expectEnemyOnTurn = expectOnTurn(1)

  const expectHeroOnTurn = async () => {
    expect(await waitForAttribute(phone, HERO, 'data-on-turn', 'true')).toBe('true')
    expect(await readTexts(phone, ON_TURN)).toEqual(['Am Zug'])
    expect(await readTexts(phone, END_TURN)).toEqual(['Zug beenden'])
    const border: string = await phone.executeScript(
      `const hero = getComputedStyle(document.querySelector('${HERO}'))
      const badge = getComputedStyle(document.querySelector('${ON_TURN}'))
      return hero.borderTopColor === badge.backgroundColor ? 'primary' : hero.borderTopColor`,
    )
    expect(border).toBe('primary')
  }

  const endTurnOf = (index: number) => async () => {
    const response = await api('POST', 'table/fight/turn', {
      from_combatant_id: fight.combatants[index].id,
    })
    expect(response.ok).toBe(true)
  }

  test('The player screen shows the hero card above the resources', ({
    given, when, then, and,
  }) => {
    given('a scene is active and no fight is running', givenSceneWithoutFight)

    when('the first player opens his player screen', openPlayerScreen(0))

    then('the hero card and the resources each take half of the height', async () => {
      const heights: number[] = await phone.executeScript(
        `return ['${HERO}', '${RESOURCES}'].map(
          (selector) => document.querySelector(selector).getBoundingClientRect().height)`,
      )
      expect(heights[0]).toBeGreaterThan(0)
      expect(Math.abs(heights[0] - heights[1])).toBeLessThanOrEqual(1)
      const resourceButtons = await phone.findElements(By.css(`${RESOURCES} > *`))
      expect(resourceButtons).toHaveLength(8)
    })

    and(STEP_HERO_CONTENT, async () => {
      const player = adventure.players[0]
      expect(await readTexts(phone, HERO_CAPTION)).toEqual([player.player_name])
      expect(await readTexts(phone, HERO_NAME)).toEqual([player.character_name])
      const chips: string[] = await phone.executeScript(
        `return Array.from(document.querySelectorAll('${HERO_NAME} + div > span'))
          .map((chip) => chip.textContent)`,
      )
      expect(chips).toEqual([player.race, player.character_class])
      expect(await readTexts(phone, HERO_LEVEL)).toEqual([String(adventure.global_level)])
      await waitForElement(phone, HERO_MENU)
    })

    and('the hero card is not on turn', expectNotOnTurn)

    and(STEP_SURFACE, async () => {
      const button = await readSurface(phone, HERO_MENU)
      expect(await readSurface(phone, HERO)).toEqual(button)
      expect(await readSurface(phone, RESOURCES)).toEqual(button)
    })

    and('the open settings menu lies above the resources', async () => {
      await clickElement(phone, HERO_MENU)
      const item = await waitForElement(phone, SWITCH_CHARACTER)
      expect(await phone.executeScript(
        `const item = arguments[0]
        const resources = document.querySelector('${RESOURCES}').getBoundingClientRect()
        const rect = item.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        return y > resources.top && item.contains(document.elementFromPoint(x, y))`,
        item,
      )).toBe(true)
    })
  }, SCENARIO_TIMEOUT)

  test('The player on turn ends his turn', ({
    given, and, when, then,
  }) => {
    given(STEP_FIGHT, givenFight)

    and('the admin screen is open', async () => {
      admin = buildDriver()
      await admin.manage().window().setRect(ADMIN_RECT)
      await openAdminScreen(admin)
      await waitForElement(admin, ADMIN_HERO_NAME)
    })

    when('the first player opens his player screen', openPlayerScreen(0))

    then(STEP_ON_TURN, expectHeroOnTurn)

    when('the first player taps "Zug beenden"', async () => {
      await clickElement(phone, END_TURN)
    })

    then('the enemy is on turn', expectEnemyOnTurn)

    and('the admin shows the enemy on turn', async () => {
      if (admin === null) {
        throw new Error('The admin screen is not open')
      }
      const adminDriver = admin
      const shown = await waitFor(
        adminDriver,
        () => readTexts(adminDriver, ADMIN_HERO_NAME),
        ['Gegner 1'],
      )
      expect(shown).toEqual(['Gegner 1'])
    })

    and('the hero card is not on turn', expectNotOnTurn)
  }, SCENARIO_TIMEOUT)

  test('A player gets the button only when the turn passes to him', ({
    given, when, then, and,
  }) => {
    given(STEP_FIGHT, givenFight)

    when('the second player opens his player screen', openPlayerScreen(1))

    then('the hero card is not on turn', expectNotOnTurn)

    when('the game master ends the turn of the first player', endTurnOf(0))

    then('the enemy is on turn', expectEnemyOnTurn)

    and('the hero card is not on turn', expectNotOnTurn)

    when('the game master ends the turn of the enemy', endTurnOf(1))

    then('the second player is on turn', expectOnTurn(2))

    and(STEP_ON_TURN, expectHeroOnTurn)
  }, SCENARIO_TIMEOUT)

  test('The turn passes only once', ({
    given, when, and, then,
  }) => {
    given(STEP_FIGHT, givenFight)

    when('the first player opens his player screen', openPlayerScreen(0))

    and(STEP_DOUBLE, async () => {
      // Right after the tap, before the push of the server reaches the second phone
      await clickElement(phone, END_TURN)
      const response = await api('POST', 'table/fight/turn', {
        from_combatant_id: fight.combatants[0].id,
      })
      expect(response.ok).toBe(true)
    })

    then('the enemy is on turn', async () => {
      await expectEnemyOnTurn()
      await waitForElementGone(phone, END_TURN)
      const after = await readJson<Fight>('table/fight')
      expect(after.round).toBe(1)
      expect(after.active_combatant_id).toBe(fight.combatants[1].id)
    })
  }, SCENARIO_TIMEOUT)

  test('The level on the hero card follows the game master', ({
    given, when, and, then,
  }) => {
    let newLevel: number

    given('a scene is active and no fight is running', givenSceneWithoutFight)

    when('the first player opens his player screen', openPlayerScreen(0))

    and('the game master changes the level of the adventure', async () => {
      expect(await readTexts(phone, HERO_LEVEL)).toEqual([String(adventure.global_level)])
      // Marks the page; a reload would remove the mark
      await phone.executeScript('window.levelMark = true')
      newLevel = adventure.global_level === MAX_LEVEL ? MAX_LEVEL - 1 : adventure.global_level + 1
      changedLevel = { adventureId: adventure.id, level: adventure.global_level }
      const response = await api('PATCH', `adventures/${adventure.id}`, {
        global_level: newLevel,
      })
      expect(response.ok).toBe(true)
    })

    then('the hero card shows the new level without a reload', async () => {
      const shown = await waitFor(phone, () => readTexts(phone, HERO_LEVEL), [String(newLevel)])
      expect(shown).toEqual([String(newLevel)])
      expect(await phone.executeScript('return window.levelMark === true')).toBe(true)
    })
  }, SCENARIO_TIMEOUT)
})
