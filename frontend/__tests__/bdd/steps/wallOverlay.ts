import { loadFeature, defineFeature } from 'jest-cucumber'
import {
  By, WebDriver, error, until,
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

const feature = loadFeature('__tests__/bdd/features/wallOverlay.feature')

// Wide enough for rail, panel, notes and dashboard side by side
const WINDOW_RECT = { width: 1600, height: 1000 }

const PANEL = '[data-test-id="dashboard-panel-wall-overlay"]'
const WORLD_BUTTON = `${PANEL} [data-test-id="wall-overlay-world"]`
const OFF_BUTTON = `${PANEL} [data-test-id="wall-overlay-off"]`
const WORLD_MAP = '[data-test-id="wall-world-map"]'
// The control bar of the wall appears only while the pointer is over the screen
const CONTROL_BAR_WORLD = '//button[normalize-space()="WORLD"]'
// Start of two more browsers plus the waits of the scenario
const SCENARIO_TIMEOUT = 6 * WAIT_TIMEOUT
const NO_OVERLAY_WITH_TWO_WALLS = 'no overlay is shown and I am on the admin screen with two wall '
  + 'screens open'

type WallOverlay = 'world' | 'off'

interface TableState {
  active_adventure_id: number | null
  active_scene_id: number | null
  wall_overlay: WallOverlay
}

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}/api/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })
  expect(response.ok).toBe(true)
  return (await response.json()) as T
}

const setWallOverlay = async (wallOverlay: WallOverlay): Promise<void> => {
  const state = await api<TableState>('table', {
    method: 'PATCH',
    body: JSON.stringify({ wall_overlay: wallOverlay }),
  })
  expect(state.wall_overlay).toBe(wallOverlay)
}

// Returns the last seen visibility instead of throwing on timeout, so the step's expect shows it
const waitForWorldMap = async (driver: WebDriver, visible: boolean): Promise<boolean> => {
  const worldMap = await waitForElement(driver, WORLD_MAP)
  let actual = !visible
  try {
    await driver.wait(async () => {
      actual = await worldMap.isDisplayed()
      return actual === visible
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

defineFeature(feature, (test) => {
  let driver: WebDriver
  let walls: WebDriver[] = []

  // The admin and both walls only show what the server pushes, so they all start from the state
  // set here
  const openScreens = async (wallOverlay: WallOverlay): Promise<void> => {
    await setWallOverlay(wallOverlay)
    walls = [buildDriver(), buildDriver()]
    await driver.manage().window().setRect(WINDOW_RECT)
    await Promise.all([
      openScreen(driver, '/admin'),
      ...walls.map((wall) => openScreen(wall, '/wall')),
    ])
    const visible = wallOverlay === 'world'
    await Promise.all(walls.map(async (wall) => {
      expect(await waitForWorldMap(wall, visible)).toBe(visible)
    }))
  }

  const expectOverlay = async (wallOverlay: WallOverlay): Promise<void> => {
    const visible = wallOverlay === 'world'
    await Promise.all(walls.map(async (wall) => {
      expect(await waitForWorldMap(wall, visible)).toBe(visible)
    }))
    const [active, inactive] = visible ? [WORLD_BUTTON, OFF_BUTTON] : [OFF_BUTTON, WORLD_BUTTON]
    expect(await waitForAttribute(driver, active, 'aria-pressed', 'true')).toBe('true')
    expect(await waitForAttribute(driver, inactive, 'aria-pressed', 'false')).toBe('false')
  }

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    const drivers = [driver, ...walls]
    walls = []
    await Promise.allSettled(drivers.map((item) => item.quit()))
    // Leave the game table without overlay for the other features
    await setWallOverlay('off')
  })

  test('I show and hide the world map on all walls from the admin', ({ given, when, then }) => {
    given(NO_OVERLAY_WITH_TWO_WALLS, async () => {
      await openScreens('off')
    })

    when('I click on Weltkarte in the panel Wall-Overlay', async () => {
      await clickElement(driver, WORLD_BUTTON)
    })

    then('both wall screens show the world map and the panel highlights Weltkarte', async () => {
      await expectOverlay('world')
    })

    when('I click on Aus in the panel Wall-Overlay', async () => {
      await clickElement(driver, OFF_BUTTON)
    })

    then('both wall screens hide the world map and the panel highlights Aus', async () => {
      await expectOverlay('off')
    })
  }, SCENARIO_TIMEOUT)

  test('I show the world map from the control bar of a wall', ({ given, when, then }) => {
    given(NO_OVERLAY_WITH_TWO_WALLS, async () => {
      await openScreens('off')
    })

    when('I click on WORLD in the control bar of the first wall screen', async () => {
      const [wall] = walls
      const screen = await waitForElement(wall, 'body')
      await wall.actions().move({ origin: screen }).perform()
      const button = await wall.wait(
        until.elementLocated(By.xpath(CONTROL_BAR_WORLD)),
        WAIT_TIMEOUT,
      )
      await wall.wait(until.elementIsVisible(button), WAIT_TIMEOUT)
      await button.click()
    })

    then('both wall screens show the world map and the panel highlights Weltkarte', async () => {
      await expectOverlay('world')
    })
  }, SCENARIO_TIMEOUT)

  test('A scene change hides the world map', ({ given, when, then }) => {
    given(
      'the world map is shown and I am on the admin screen with two wall screens open',
      async () => {
        await openScreens('world')
        await expectOverlay('world')
      },
    )

    when('the active scene changes', async () => {
      const state = await api<TableState>('table')
      expect(state.active_adventure_id).not.toBeNull()
      const adventureId = state.active_adventure_id as number
      const scenes = await api<{ id: number }[]>(`adventures/${adventureId}/scenes`)
      const next = scenes.find((scene) => scene.id !== state.active_scene_id)
      expect(next).toBeDefined()
      await api(`adventures/${adventureId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active_scene_id: next?.id }),
      })
    })

    then('both wall screens hide the world map and the panel highlights Aus', async () => {
      await expectOverlay('off')
    })
  }, SCENARIO_TIMEOUT)
})
