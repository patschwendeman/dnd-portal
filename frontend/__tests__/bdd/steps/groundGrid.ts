import { loadFeature, defineFeature } from 'jest-cucumber'
import { WebDriver, error } from 'selenium-webdriver'

import {
  BASE_URL,
  WAIT_TIMEOUT,
  buildDriver,
  clickElement,
  openScreen,
  waitForAttribute,
  waitForElement,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/groundGrid.feature')

// Wide enough for rail, panel, notes and dashboard side by side
const WINDOW_RECT = { width: 1600, height: 1000 }

const PANEL = '[data-test-id="dashboard-panel-ground-grid"]'
const button = (grid: GroundGrid): string => `${PANEL} [data-test-id="ground-grid-${grid}"]`
const CELL_SIZE_INPUT = `${PANEL} [data-test-id="ground-grid-cell-size"] input`
const CELL_SIZE_THUMB = `${PANEL} [data-test-id="ground-grid-cell-size"] .MuiSlider-thumb`
const CELL_SIZE_RAIL = `${PANEL} [data-test-id="ground-grid-cell-size"] .MuiSlider-rail`
const CELL_SIZE_VALUE = `${PANEL} [data-test-id="ground-grid-cell-size-value"]`
const GRID = '[data-test-id="ground-grid"]'
const GROUND_IMAGE = '[data-test-id="groundImg"]'
const GRIDS: GroundGrid[] = ['black', 'white', 'off']
// Start of three more browsers plus the waits of the scenario
const SCENARIO_TIMEOUT = 12 * WAIT_TIMEOUT

type GroundGrid = 'black' | 'white' | 'off'

interface TableState {
  active_adventure_id: number | null
  active_scene_id: number | null
  ground_grid: GroundGrid
  ground_grid_cell_size: number
}

interface SceneSummary {
  id: number
  ground_image: { source: string }
}

// What a ground screen shows: colour of the lines and distance between them in CSS pixels (the
// screen scales the cell size by the device pixel ratio), null without a grid
interface ShownGrid { color: string, cellSize: number }

const LINE_COLORS: Record<Exclude<GroundGrid, 'off'>, string> = {
  black: 'rgb(0, 0, 0)',
  white: 'rgb(255, 255, 255)',
}

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}/api/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })
  expect(response.ok).toBe(true)
  return (await response.json()) as T
}

const setGroundGrid = async (grid: GroundGrid, cellSize: number): Promise<void> => {
  const state = await api<TableState>('table', {
    method: 'PATCH',
    body: JSON.stringify({ ground_grid: grid, ground_grid_cell_size: cellSize }),
  })
  expect(state.ground_grid).toBe(grid)
}

// In one script, so the grid cannot disappear between finding its lines and reading them
const readGrid = async (driver: WebDriver): Promise<ShownGrid | null> => driver.executeScript(
  `const lines = document.querySelectorAll('${GRID} > div')
  if (lines.length < 2) {
    return null
  }
  const [first, second] = [lines[0], lines[1]].map((line) => line.getBoundingClientRect().x)
  return {
    color: getComputedStyle(lines[0]).backgroundColor,
    cellSize: Math.round((second - first) / window.devicePixelRatio),
  }`,
)

const expectedGrid = (grid: GroundGrid, cellSize: number): ShownGrid | null => (
  grid === 'off' ? null : { color: LINE_COLORS[grid], cellSize }
)

// Returns the last seen grid instead of throwing on timeout, so the step's expect shows it
const waitForGrid = async (
  driver: WebDriver,
  expected: ShownGrid | null,
): Promise<ShownGrid | null> => {
  await waitForElement(driver, 'body')
  let actual: ShownGrid | null = null
  try {
    await driver.wait(async () => {
      actual = await readGrid(driver)
      return JSON.stringify(actual) === JSON.stringify(expected)
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
  let grounds: WebDriver[] = []

  const expectGrounds = async (grid: GroundGrid, cellSize: number): Promise<void> => {
    const expected = expectedGrid(grid, cellSize)
    await Promise.all(grounds.map(async (ground) => {
      expect(await waitForGrid(ground, expected)).toEqual(expected)
    }))
  }

  const expectPanel = async (grid: GroundGrid, cellSize: number): Promise<void> => {
    await Promise.all(GRIDS.map(async (item) => {
      const pressed = String(item === grid)
      expect(await waitForAttribute(driver, button(item), 'aria-pressed', pressed)).toBe(pressed)
    }))
    expect(await waitForAttribute(driver, CELL_SIZE_INPUT, 'value', String(cellSize)))
      .toBe(String(cellSize))
    expect(await (await waitForElement(driver, CELL_SIZE_VALUE)).getText()).toBe(String(cellSize))
  }

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    const drivers = [driver, ...grounds]
    grounds = []
    await Promise.allSettled(drivers.map((item) => item.quit()))
    // Leave the game table without grid for the other features
    await setGroundGrid('off', 100)
  })

  test('I set the grid of all grounds from the admin', ({
    given, when, then, and,
  }) => {
    given(
      'no grid is shown and I am on the admin screen with two ground screens open',
      async () => {
        // The admin and both grounds only show what the server pushes
        await setGroundGrid('off', 100)
        grounds = [buildDriver(), buildDriver()]
        await driver.manage().window().setRect(WINDOW_RECT)
        await Promise.all([
          openScreen(driver, '/admin'),
          ...grounds.map((ground) => openScreen(ground, '/ground')),
        ])
        await expectGrounds('off', 100)
        await expectPanel('off', 100)
      },
    )

    when('I click on Weiß in the panel Ground-Raster', async () => {
      await clickElement(driver, button('white'))
    })

    then(
      'both ground screens show a white grid with cell size 100 and the panel highlights Weiß',
      async () => {
        await expectGrounds('white', 100)
        await expectPanel('white', 100)
      },
    )

    when('I move the slider Zellgröße to 150 and release it', async () => {
      // Drag the thumb from 100 (left end) to the middle of the rail (150) and release it there
      const thumb = await waitForElement(driver, CELL_SIZE_THUMB)
      const rail = await waitForElement(driver, CELL_SIZE_RAIL)
      const { width } = await rail.getRect()
      await driver.actions()
        .move({ origin: thumb })
        .press()
        .move({ origin: rail, x: -Math.round(width / 4) })
        .move({ origin: rail })
        .release()
        .perform()
    })

    then(
      'both ground screens show a white grid with cell size 150 and the panel shows 150',
      async () => {
        await expectGrounds('white', 150)
        await expectPanel('white', 150)
        const state = await api<TableState>('table')
        expect(state.ground_grid_cell_size).toBe(150)
      },
    )

    and('a ground screen opened afterwards shows a white grid with cell size 150', async () => {
      const late = buildDriver()
      grounds.push(late)
      await openScreen(late, '/ground')
      const expected = expectedGrid('white', 150)
      expect(await waitForGrid(late, expected)).toEqual(expected)
    })

    when('the active scene changes', async () => {
      const state = await api<TableState>('table')
      expect(state.active_adventure_id).not.toBeNull()
      const adventureId = state.active_adventure_id as number
      const scenes = await api<SceneSummary[]>(`adventures/${adventureId}/scenes`)
      const next = scenes.find((scene) => scene.id !== state.active_scene_id)
      expect(next).toBeDefined()
      const scene = next as SceneSummary
      await api(`adventures/${adventureId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active_scene_id: scene.id }),
      })
      // Only once the grounds show the new scene the grid is checked again
      const src = `${BASE_URL}/api${scene.ground_image.source}`
      await Promise.all(grounds.map(async (ground) => {
        expect(await waitForAttribute(ground, GROUND_IMAGE, 'src', src)).toBe(src)
      }))
    })

    then('both ground screens still show a white grid with cell size 150', async () => {
      await expectGrounds('white', 150)
      await expectPanel('white', 150)
    })

    when('I click on Aus in the panel Ground-Raster', async () => {
      await clickElement(driver, button('off'))
    })

    then('both ground screens show no grid and the panel highlights Aus', async () => {
      await expectGrounds('off', 150)
      await expectPanel('off', 150)
    })
  }, SCENARIO_TIMEOUT)
})
