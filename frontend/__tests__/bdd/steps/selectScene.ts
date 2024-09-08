import { loadFeature, defineFeature } from 'jest-cucumber'
import { Builder, By, WebDriver } from 'selenium-webdriver'

const feature = loadFeature('__tests__/bdd/features/selectScene.feature')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

defineFeature(feature, (test) => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = await new Builder().forBrowser('firefox').build()
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
    given('I am on the admin screen', async () => {
      await driver.get('http://localhost:5173')

      await sleep(2000)
    })

    when('I click on a fight scene', async () => {
      const map = await driver.findElements(By.css('div.sc-blHHSb.gNTpti'))
      map[1].click()
    })

    and('I click the Confirm button', async () => {
      const confirmButton = await driver.findElement(
        By.css('.sc-ghWlax.cttZKM')
      )
      await confirmButton.click()
    })

    and('I go to ground screen', async () => {
      await driver.get('http://localhost:5173/ground')
    })

    then('I see the correct battle map', async () => {
      const pElement = await driver.findElement(By.tagName('p'))
      const pText = await pElement.getText()
      expect(pText).toBe('2')
    })
  })
})
