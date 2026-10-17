import { loadFeature, defineFeature } from 'jest-cucumber'
import { WebDriver } from 'selenium-webdriver'

import {
  MEDIA_BASE_URL,
  MEDIA_PATH,
  buildDriver,
  clickElement,
  confirmDialog,
  getRandomNumber,
  openScreen,
  waitForAttribute,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/selectSideScene.feature')

defineFeature(feature, (test) => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    await driver.quit()
  })

  test('I select a side scene to see the correct wall image at the wall screen', ({
    given,
    when,
    then,
    and,
  }) => {
    const sideScenes = ['forest', 'shop', 'tavern']
    const sideScene = sideScenes[getRandomNumber(0, sideScenes.length - 1)]

    const sideSceneTile = `[data-test-id="${MEDIA_PATH}/images/wall_screen/${sideScene}.jpg"]`
    const sideSceneImageSource = `${MEDIA_BASE_URL}/images/wall_screen/${sideScene}.jpg`

    given('I am on the admin screen', async () => {
      await openScreen(driver, '/admin')
    })

    when('I click on a side scene', async () => {
      await clickElement(driver, sideSceneTile)
    })

    and('I click the Confirm button', async () => {
      await confirmDialog(driver, sideSceneTile)
    })

    and('I go to wall screen', async () => {
      await openScreen(driver, '/wall')
    })

    then('I see the correct wall image', async () => {
      const expectedSrc = sideSceneImageSource
      const imageSrc = await waitForAttribute(driver, '[data-test-id="wallImg"]', 'src', expectedSrc)
      expect(imageSrc).toBe(expectedSrc)
    })
  })
})
