import { loadFeature, defineFeature } from 'jest-cucumber'
import { By, WebDriver } from 'selenium-webdriver'

import {
  BASE_URL,
  MEDIA_BASE_URL,
  WAIT_TIMEOUT,
  buildDriver,
  clickElement,
  confirmDialog,
  openScreen,
  waitForAttribute,
  waitForElement,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/selectScene.feature')

// Wide enough for rail, panel, notes and right column side by side
const WINDOW_RECT = { width: 1600, height: 1000 }

const SCENES_ITEM = '[data-test-id="nav-item-scenes"]'
const SCENE_NAVIGATION = '[data-test-id="nav-panel"] [data-test-id="scene-navigation"]'
const SCENE_ENTRIES = `${SCENE_NAVIGATION} button`
const ACTIVE_SCENE_PANEL = '[data-test-id="dashboard-panel-scene"]'
const ACTIVE_SCENE_WALL = `${ACTIVE_SCENE_PANEL} [data-test-id="active-scene-wall"]`
const ACTIVE_SCENE_GROUND = `${ACTIVE_SCENE_PANEL} [data-test-id="active-scene-ground"]`
const ACTIVE_SCENE_NAME = `${ACTIVE_SCENE_PANEL} [data-test-id="active-scene-name"]`

// Seed data (backend/app/db/data/seed_data.json): 29 scenes, created in this order
const SEED_SCENE_COUNT = 29
const SEED_FIRST_SCENE_NAMES = ['Default', 'Shop', 'Tavern', 'Level Up']

interface SeedScene {
  name: string
  wallImage: string
  groundImage: string
}

// Scenes of the seed with their media paths; former battle and non-battle scenes alike
const SEED_SCENES: SeedScene[] = [
  {
    name: 'Shop',
    wallImage: '/images/wall_screen/shop.jpg',
    groundImage: '/images/ground_screen/shop.jpg',
  },
  {
    name: 'Tavern',
    wallImage: '/images/wall_screen/tavern.jpg',
    groundImage: '/images/ground_screen/tavern.jpg',
  },
  {
    name: 'Fight 1 [lvl. 6]',
    wallImage: '/images/wall_screen/fight.jpg',
    groundImage: '/images/ground_screen/main_1.jpg',
  },
  {
    name: 'Fight 2 [lvl. 5]',
    wallImage: '/images/wall_screen/fight.jpg',
    groundImage: '/images/ground_screen/main_2.jpg',
  },
]

// The entry carries the full name as title (the visible text may be cut off)
const sceneEntry = (name: string): string => `${SCENE_NAVIGATION} button[title="${name}"]`

const openAdmin = async (driver: WebDriver): Promise<void> => {
  await driver.manage().window().setRect(WINDOW_RECT)
  await openScreen(driver, '/admin')
}

// Checks the candidates one after another and stops at the first inactive scene
const findInactiveScene = async (
  driver: WebDriver,
  candidates: SeedScene[],
): Promise<SeedScene> => {
  if (candidates.length === 0) {
    throw new Error('No inactive scene found')
  }
  const [scene, ...rest] = candidates
  const entry = await waitForElement(driver, sceneEntry(scene.name))
  if ((await entry.getAttribute('data-active')) === 'false') {
    return scene
  }
  return findInactiveScene(driver, rest)
}

// Clicking the active scene does nothing, so the test picks a random scene that is not active
const pickInactiveScene = async (driver: WebDriver): Promise<SeedScene> => (
  findInactiveScene(driver, [...SEED_SCENES].sort(() => Math.random() - 0.5))
)

// After a fresh seed no scene is active. The scenario reads the game table state from the server
// (the Admin learns it only with the push, so the panel alone cannot tell "none active" from "not
// yet received") and activates a scene through the panel if needed.
const ensureActiveScene = async (driver: WebDriver): Promise<void> => {
  const response = await fetch(`${BASE_URL}/api/table`)
  expect(response.ok).toBe(true)
  const state = (await response.json()) as { active_scene_id: number | null }
  if (state.active_scene_id !== null) {
    return
  }
  const scene = SEED_SCENES[0]
  await openAdmin(driver)
  await clickElement(driver, SCENES_ITEM)
  await clickElement(driver, sceneEntry(scene.name))
  await confirmDialog(driver, sceneEntry(scene.name))
}

defineFeature(feature, (test) => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    await driver.quit()
  })

  test('The scenes panel lists all scenes of the adventure', ({
    given, when, then, and,
  }) => {
    given('a scene is active', async () => {
      await ensureActiveScene(driver)
    })

    and('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the menu item Szenen', async () => {
      await clickElement(driver, SCENES_ITEM)
    })

    then('the panel shows all scenes of the adventure in the order they were created', async () => {
      await waitForElement(driver, SCENE_NAVIGATION)
      await driver.wait(
        async () => (await driver.findElements(By.css(SCENE_ENTRIES))).length === SEED_SCENE_COUNT,
        WAIT_TIMEOUT,
      )
      const entries = await driver.findElements(By.css(SCENE_ENTRIES))
      const names = await Promise.all(entries.map((entry) => entry.getAttribute('title')))
      expect(names).toHaveLength(SEED_SCENE_COUNT)
      expect(names.slice(0, SEED_FIRST_SCENE_NAMES.length)).toEqual(SEED_FIRST_SCENE_NAMES)
      names.slice(SEED_FIRST_SCENE_NAMES.length).forEach((name, index) => {
        expect(name.startsWith(`Fight ${index + 1} `)).toBe(true)
      })
    })

    and('the active scene is highlighted', async () => {
      const entries = await driver.findElements(By.css(SCENE_ENTRIES))
      const current = await Promise.all(entries.map((entry) => entry.getAttribute('aria-current')))
      expect(current.filter((value) => value === 'true')).toHaveLength(1)
    })
  })

  test('I select a scene to see its images at the wall and ground screen', ({
    given, when, then, and,
  }) => {
    let scene: SeedScene

    given('I am on the admin screen', async () => {
      await openAdmin(driver)
    })

    when('I click on the menu item Szenen', async () => {
      await clickElement(driver, SCENES_ITEM)
    })

    and('I click on a scene that is not active', async () => {
      scene = await pickInactiveScene(driver)
      await clickElement(driver, sceneEntry(scene.name))
    })

    and('I click the Confirm button', async () => {
      await confirmDialog(driver, sceneEntry(scene.name))
    })

    then('the scene is highlighted as active', async () => {
      expect(await waitForAttribute(driver, sceneEntry(scene.name), 'aria-current', 'true'))
        .toBe('true')
    })

    and('the dashboard panel Aktive Szene shows its name and images', async () => {
      const wallSrc = `${MEDIA_BASE_URL}${scene.wallImage}`
      const groundSrc = `${MEDIA_BASE_URL}${scene.groundImage}`
      expect(await waitForAttribute(driver, ACTIVE_SCENE_WALL, 'src', wallSrc)).toBe(wallSrc)
      expect(await waitForAttribute(driver, ACTIVE_SCENE_GROUND, 'src', groundSrc))
        .toBe(groundSrc)
      const name = await waitForElement(driver, ACTIVE_SCENE_NAME)
      await driver.wait(async () => (await name.getText()) === scene.name, WAIT_TIMEOUT)
    })

    when('I go to wall screen', async () => {
      await openScreen(driver, '/wall')
    })

    then('I see the wall image of the scene', async () => {
      const expectedSrc = `${MEDIA_BASE_URL}${scene.wallImage}`
      expect(await waitForAttribute(driver, '[data-test-id="wallImg"]', 'src', expectedSrc))
        .toBe(expectedSrc)
    })

    when('I go to ground screen', async () => {
      await openScreen(driver, '/ground')
    })

    then('I see the ground image of the scene', async () => {
      const expectedSrc = `${MEDIA_BASE_URL}${scene.groundImage}`
      expect(await waitForAttribute(driver, '[data-test-id="groundImg"]', 'src', expectedSrc))
        .toBe(expectedSrc)
    })
  })
})
