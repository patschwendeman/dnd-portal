import { loadFeature, defineFeature } from 'jest-cucumber'
import { By, WebDriver, error } from 'selenium-webdriver'

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

const PANEL = '[data-test-id="dashboard-panel-table"]'
const WORLD_BUTTON = `${PANEL} [data-test-id="wall-overlay-world"]`
const JOIN_BUTTON = `${PANEL} [data-test-id="wall-overlay-join"]`
const OFF_BUTTON = `${PANEL} [data-test-id="wall-overlay-off"]`
const WORLD_MAP = '[data-test-id="wall-world-map"]'
const JOIN_LAYER = '[data-test-id="wall-join-layer"]'
const JOIN_PANEL = '[data-test-id="wall-join"]'
const JOIN_QR_CODE = '[data-test-id="wall-join-qr-code"]'
const JOIN_URL = '[data-test-id="wall-join-url"]'
const JOIN_HINT = '[data-test-id="wall-join-hint"]'
const BUTTONS: Record<WallOverlay, string> = {
  world: WORLD_BUTTON,
  join: JOIN_BUTTON,
  off: OFF_BUTTON,
}
// getText() returns the non-breaking space of the hint as a normal space
const UNKNOWN_URL_HINT = 'Player-URL unbekannt – Spieltisch mit „dnd prod“ starten oder die '
  + 'Wall über die IP des Rechners öffnen'
const QR_CODE_MAX_SIZE = 480
// Start of two more browsers plus the waits of the scenario
const SCENARIO_TIMEOUT = 6 * WAIT_TIMEOUT
const NO_OVERLAY_WITH_TWO_WALLS = 'no overlay is shown and I am on the admin screen with two wall '
  + 'screens open'

type WallOverlay = 'world' | 'join' | 'off'

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

const expectedPlayerUrl = async (): Promise<string | null> => (
  (await api<{ player_url: string | null }>('table/join')).player_url
)

// Returns the last seen visibility instead of throwing on timeout, so the step's expect shows it
const waitForDisplayed = async (
  driver: WebDriver,
  selector: string,
  visible: boolean,
): Promise<boolean> => {
  const element = await waitForElement(driver, selector)
  let actual = !visible
  try {
    await driver.wait(async () => {
      actual = await element.isDisplayed()
      return actual === visible
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

const expectWallOverlay = async (wall: WebDriver, wallOverlay: WallOverlay): Promise<void> => {
  expect(await waitForDisplayed(wall, WORLD_MAP, wallOverlay === 'world'))
    .toBe(wallOverlay === 'world')
  expect(await waitForDisplayed(wall, JOIN_LAYER, wallOverlay === 'join'))
    .toBe(wallOverlay === 'join')
}

const expectJoinHint = async (wall: WebDriver): Promise<void> => {
  const hint = await waitForElement(wall, `${JOIN_PANEL} ${JOIN_HINT}`)
  expect(await hint.getText()).toBe(UNKNOWN_URL_HINT)
  expect(await wall.findElements(By.css(JOIN_QR_CODE))).toHaveLength(0)
}

// Depending on the setup the API knows the player URL (QR code) or not (hint, as the walls run
// under localhost)
const expectJoinPanel = async (wall: WebDriver, playerUrl: string | null): Promise<void> => {
  const panel = await waitForElement(wall, JOIN_PANEL)
  expect(await panel.getText()).toContain('Spieler verbinden')
  if (playerUrl === null) {
    await expectJoinHint(wall)
    return
  }
  await waitForElement(wall, `${JOIN_PANEL} ${JOIN_QR_CODE} svg`)
  const url = await waitForElement(wall, `${JOIN_PANEL} ${JOIN_URL}`)
  expect(await url.getText()).toBe(playerUrl)
  const title = await wall.findElement(By.css(`${JOIN_QR_CODE} svg title`))
  expect(await title.getAttribute('textContent')).toBe(playerUrl)
  expect(await wall.findElements(By.css(JOIN_HINT))).toHaveLength(0)
}

const expectDimmedAndVisible = async (wall: WebDriver): Promise<void> => {
  const layer = await waitForElement(wall, JOIN_LAYER)
  const viewport: { width: number, height: number } = await wall.executeScript(
    'return { width: window.innerWidth, height: window.innerHeight }',
  )
  expect(await layer.getRect()).toMatchObject({ x: 0, y: 0, ...viewport })
  expect(await layer.getCssValue('background-color')).not.toBe('rgba(0, 0, 0, 0)')
  const elements = await wall.findElements(By.css(`${JOIN_QR_CODE} svg`))
  // Without a player URL there is no code to measure
  if (elements.length === 0) {
    return
  }
  const code = await elements[0].getRect()
  expect(code.width).toBe(code.height)
  expect(code.width).toBeGreaterThan(0)
  expect(code.width).toBeLessThanOrEqual(QR_CODE_MAX_SIZE)
  const panel = await (await waitForElement(wall, JOIN_PANEL)).getRect()
  expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height)
}

const changeActiveScene = async (): Promise<void> => {
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
    await Promise.all(walls.map((wall) => expectWallOverlay(wall, wallOverlay)))
  }

  const expectOverlay = async (wallOverlay: WallOverlay): Promise<void> => {
    await Promise.all(walls.map((wall) => expectWallOverlay(wall, wallOverlay)))
    await Promise.all(Object.entries(BUTTONS).map(async ([value, button]) => {
      const pressed = String(value === wallOverlay)
      expect(await waitForAttribute(driver, button, 'aria-pressed', pressed)).toBe(pressed)
    }))
  }

  const expectJoinPanelOnWalls = async (): Promise<void> => {
    await expectOverlay('join')
    const playerUrl = await expectedPlayerUrl()
    await Promise.all(walls.map((wall) => expectJoinPanel(wall, playerUrl)))
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

    when('I click on Weltkarte in the row Wall of the panel Spieltisch', async () => {
      await clickElement(driver, WORLD_BUTTON)
    })

    then('both wall screens show the world map and the panel highlights Weltkarte', async () => {
      await expectOverlay('world')
    })

    when('I click on Aus in the row Wall of the panel Spieltisch', async () => {
      await clickElement(driver, OFF_BUTTON)
    })

    then('both wall screens hide the world map and the panel highlights Aus', async () => {
      await expectOverlay('off')
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
      await changeActiveScene()
    })

    then('both wall screens hide the world map and the panel highlights Aus', async () => {
      await expectOverlay('off')
    })
  }, SCENARIO_TIMEOUT)

  const JOIN_PANEL_SHOWN = 'both wall screens show the panel Spieler verbinden with the QR code '
    + 'and the URL of the player screen and the panel highlights QR-Code'
  const QR_CODE_WITH_TWO_WALLS = 'the QR code is shown and I am on the admin screen with two wall '
    + 'screens open'

  test(
    'I show the QR code for the players on all walls and switch between the overlays',
    ({
      given, when, then, and,
    }) => {
      given(NO_OVERLAY_WITH_TWO_WALLS, async () => {
        await openScreens('off')
      })

      when('I click on QR-Code in the row Wall of the panel Spieltisch', async () => {
        await clickElement(driver, JOIN_BUTTON)
      })

      then(JOIN_PANEL_SHOWN, async () => {
        await expectJoinPanelOnWalls()
      })

      and(
        'the screen below the panel is dimmed and the QR code is completely visible',
        async () => {
          await Promise.all(walls.map(expectDimmedAndVisible))
        },
      )

      when('I click on Weltkarte in the row Wall of the panel Spieltisch', async () => {
        await clickElement(driver, WORLD_BUTTON)
      })

      then(
        'both wall screens show the world map without the QR code and the panel highlights '
          + 'Weltkarte',
        async () => {
          await expectOverlay('world')
          await Promise.all(walls.map(async (wall) => {
            expect(await wall.findElements(By.css(JOIN_PANEL))).toHaveLength(0)
          }))
        },
      )

      when('I click on QR-Code in the row Wall of the panel Spieltisch', async () => {
        await clickElement(driver, JOIN_BUTTON)
      })

      then(JOIN_PANEL_SHOWN, async () => {
        await expectJoinPanelOnWalls()
      })

      when('I click on Aus in the row Wall of the panel Spieltisch', async () => {
        await clickElement(driver, OFF_BUTTON)
      })

      then('both wall screens show no overlay and the panel highlights Aus', async () => {
        await expectOverlay('off')
      })
    },
    SCENARIO_TIMEOUT,
  )

  test('The walls show a hint if the player URL is unknown', ({
    given, and, when, then,
  }) => {
    given(NO_OVERLAY_WITH_TWO_WALLS, async () => {
      await openScreens('off')
    })

    // Forces the error path independent of the setup, in which the API may know the player URL
    and('the player URL cannot be loaded on the wall screens', async () => {
      await Promise.all(walls.map(async (wall) => {
        await wall.sendDevToolsCommand('Network.enable', {})
        await wall.sendDevToolsCommand('Network.setBlockedURLs', { urls: ['*/table/join'] })
      }))
    })

    when('I click on QR-Code in the row Wall of the panel Spieltisch', async () => {
      await clickElement(driver, JOIN_BUTTON)
    })

    then(
      'both wall screens show the panel Spieler verbinden with the hint and no QR code',
      async () => {
        await expectOverlay('join')
        await Promise.all(walls.map(async (wall) => {
          const panel = await waitForElement(wall, JOIN_PANEL)
          expect(await panel.getText()).toContain('Spieler verbinden')
          await expectJoinHint(wall)
        }))
      },
    )
  }, SCENARIO_TIMEOUT)

  test('A wall opened later shows the QR code at once', ({ given, when, then }) => {
    let lateWall: WebDriver

    given(QR_CODE_WITH_TWO_WALLS, async () => {
      await openScreens('join')
      await expectJoinPanelOnWalls()
    })

    when('another wall screen is opened', async () => {
      lateWall = buildDriver()
      walls.push(lateWall)
      await openScreen(lateWall, '/wall')
    })

    then(
      'it shows the panel Spieler verbinden with the QR code and the URL of the player screen',
      async () => {
        await expectWallOverlay(lateWall, 'join')
        await expectJoinPanel(lateWall, await expectedPlayerUrl())
      },
    )
  }, SCENARIO_TIMEOUT)

  test('A scene change hides the QR code', ({ given, when, then }) => {
    given(QR_CODE_WITH_TWO_WALLS, async () => {
      await openScreens('join')
      await expectJoinPanelOnWalls()
    })

    when('the active scene changes', async () => {
      await changeActiveScene()
    })

    then('both wall screens show no overlay and the panel highlights Aus', async () => {
      await expectOverlay('off')
    })
  }, SCENARIO_TIMEOUT)
})
