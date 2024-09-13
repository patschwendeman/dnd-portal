import { loadFeature, defineFeature } from 'jest-cucumber'
import { Builder, By, WebDriver } from 'selenium-webdriver'

const feature = loadFeature('__tests__/bdd/features/selectFightScene.feature')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getRandomNumber(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

defineFeature(feature, (test) => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = new Builder().forBrowser('chrome').build() as WebDriver
  })

  afterEach(async () => {
    await driver.quit()
  })

  test('I select a fight scene to see the battle map at the ground screen', ({
    given,
    when,
    then,
    and,
  }) => {
    const randomFightSceneNumber = getRandomNumber(1, 16)
    const fightScene = `https://example.com/battle${randomFightSceneNumber}.png`

    given('I am on the admin screen', async () => {
      await driver.get('http://localhost:5173')
      await sleep(2000)
    })

    when('I click on a fight scene', async () => {
      const map = await driver.findElement(
        By.css(`[data-test-id="${fightScene}"]`)
      )
      map.click()
    })

    and('I click the Confirm button', async () => {
      const confirmButton = await driver.findElement(
        By.css('[data-test-id="confirm-button"]')
      )
      confirmButton.click()
      await sleep(1000)
    })

    and('I go to ground screen', async () => {
      await driver.get('http://localhost:5173/ground')
      await sleep(1000)
    })

    then('I see the correct battle map', async () => {
      const image = await driver.findElement(
        By.css('[data-test-id="groundImg"]')
      )
      const imageSrc = await image.getAttribute('src')
      expect(imageSrc).toBe(fightScene)
    })
  })

  test('I select a fight scene to see the updated map overview at the wall screen', ({
    given,
    when,
    then,
    and,
  }) => {
    const randomFightSceneNumber = getRandomNumber(1, 16)
    const fightScene = `https://example.com/battle${randomFightSceneNumber}.png`

    given('I am on the admin screen', async () => {
      await driver.get('http://localhost:5173')
      await sleep(2000)
    })

    when('I click on a fight scene', async () => {
      const map = await driver.findElement(
        By.css(`[data-test-id="${fightScene}"]`)
      )
      map.click()
    })

    and('I click the Confirm button', async () => {
      const confirmButton = await driver.findElement(
        By.css('[data-test-id="confirm-button"]')
      )
      confirmButton.click()
      await sleep(1000)
    })

    and('I go to wall screen', async () => {
      await driver.get('http://localhost:5173/wall')
      await sleep(1000)
    })

    then('I see the updated map overview', async () => {
      await sleep(1000)
      const map = await driver.findElement(
        By.css(`[data-test-id="${fightScene}"]`)
      )
      expect(map).toBeDefined()
    })
  })
})
