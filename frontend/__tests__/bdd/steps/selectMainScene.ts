import { loadFeature, defineFeature } from 'jest-cucumber'
import { WebDriver } from 'selenium-webdriver'

import {
  BASE_URL,
  buildDriver,
  clickElement,
  confirmDialog,
  getRandomNumber,
  openScreen,
  waitForAttribute,
  waitForElement,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/selectMainScene.feature')

// The seed data contains 25 main scenes (main_1.jpg … main_25.jpg)
const MAIN_SCENE_COUNT = 25

const getRandomMainScene = (): string =>
  `/assets/images/ground_screen/main_${getRandomNumber(1, MAIN_SCENE_COUNT)}.jpg`

defineFeature(feature, (test) => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    await driver.quit()
  })

  test('I select a main scene to see the main map at the ground screen', ({
    given,
    when,
    then,
    and,
  }) => {
    const mainScene = getRandomMainScene()

    given('I am on the admin screen', async () => {
      await openScreen(driver, '/admin')
    })

    when('I click on a main scene', async () => {
      await clickElement(driver, `[data-test-id="${mainScene}"]`)
    })

    and('I click the Confirm button', async () => {
      await confirmDialog(driver)
    })

    and('I go to ground screen', async () => {
      await openScreen(driver, '/ground')
    })

    then('I see the correct main map', async () => {
      const expectedSrc = `${BASE_URL}${mainScene}`
      const imageSrc = await waitForAttribute(driver, '[data-test-id="groundImg"]', 'src', expectedSrc)
      expect(imageSrc).toBe(expectedSrc)
    })
  })

  test('I select a main scene to see the updated map overview at the wall screen', ({
    given,
    when,
    then,
    and,
  }) => {
    const mainScene = getRandomMainScene()

    given('I am on the admin screen', async () => {
      await openScreen(driver, '/admin')
    })

    when('I click on a main scene', async () => {
      await clickElement(driver, `[data-test-id="${mainScene}"]`)
    })

    and('I click the Confirm button', async () => {
      await confirmDialog(driver)
    })

    and('I go to wall screen', async () => {
      await openScreen(driver, '/wall')
    })

    then('I see the updated map overview', async () => {
      const map = await waitForElement(driver, `[data-test-id="${mainScene}"]`)
      expect(map).toBeDefined()
    })
  })

  test('I select a main scene to see the correct wall image at the wall screen', ({
    given,
    when,
    then,
    and,
  }) => {
    const mainScene = getRandomMainScene()
    // All main scenes share this wall image (legacy file name kept in the asset path)
    const mainWallImage = `${BASE_URL}/assets/images/wall_screen/fight.jpg`

    given('I am on the admin screen', async () => {
      await openScreen(driver, '/admin')
    })

    when('I click on a main scene', async () => {
      await clickElement(driver, `[data-test-id="${mainScene}"]`)
    })

    and('I click the Confirm button', async () => {
      await confirmDialog(driver)
    })

    and('I go to wall screen', async () => {
      await openScreen(driver, '/wall')
    })

    then('I see the correct wall image', async () => {
      const imageSrc = await waitForAttribute(driver, '[data-test-id="wallImg"]', 'src', mainWallImage)
      expect(imageSrc).toBe(mainWallImage)
    })
  })
})
