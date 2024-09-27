import { loadFeature, defineFeature } from 'jest-cucumber'
import { Builder, By, WebDriver } from 'selenium-webdriver'

const feature = loadFeature(
  '__tests__/bdd/features/selectNoneFightScene.feature'
)

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

  test('I select a none fight scene to see the correct wall image at the wall screen', ({
    given,
    when,
    then,
    and,
  }) => {
    const noneFightScenes = ['Forest', 'Shop', 'Tavern']
    const randomNoneFightSceneNumber = getRandomNumber(0, 2)
    const noneFightScene = noneFightScenes[randomNoneFightSceneNumber]

    const noneFightSceneImageSource = `https://example.com/${noneFightScene}.png`

    given('I am on the admin screen', async () => {
      await driver.get('http://localhost:5173/admin')
      await sleep(2000)
    })

    when('I click on a none fight scene', async () => {
      const map = await driver.findElement(
        By.css(`[data-test-id="${noneFightSceneImageSource}"]`)
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

    then('I see the correct wall image', async () => {
      const image = await driver.findElement(By.css('[data-test-id="wallImg"]'))
      const imageSrc = await image.getAttribute('src')
      expect(imageSrc).toBe(noneFightSceneImageSource)
    })
  })
})
