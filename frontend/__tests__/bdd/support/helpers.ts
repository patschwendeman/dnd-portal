import { Builder, By, error, until, WebDriver, WebElement } from 'selenium-webdriver'

// Lives outside steps/ so jest (testMatch: __tests__/bdd/steps/*.ts) does not run it as a test file
const BASE_URL = 'http://localhost:5173'
// Scene media are served by the backend through the proxy of the frontend (VITE_API_URL default /api/). The src
// property of an image is resolved against the page.
const MEDIA_PATH = '/api/media'
const MEDIA_BASE_URL = `${BASE_URL}${MEDIA_PATH}`

// Must stay below the jest testTimeout (10 s), otherwise jest aborts before the wait reports its failure
const WAIT_TIMEOUT = 5000

const getRandomNumber = (min: number, max: number): number => {
  const lower = Math.ceil(min)
  const upper = Math.floor(max)
  return Math.floor(Math.random() * (upper - lower + 1)) + lower
}

const buildDriver = (): WebDriver => new Builder().forBrowser('chrome').build() as WebDriver

const openScreen = async (driver: WebDriver, path: string): Promise<void> => {
  await driver.get(`${BASE_URL}${path}`)
}

const waitForElement = async (driver: WebDriver, selector: string): Promise<WebElement> =>
  driver.wait(until.elementLocated(By.css(selector)), WAIT_TIMEOUT)

const clickElement = async (driver: WebDriver, selector: string): Promise<WebElement> => {
  const element = await waitForElement(driver, selector)
  await driver.wait(until.elementIsVisible(element), WAIT_TIMEOUT)
  await element.click()
  return element
}

const waitForElementGone = async (driver: WebDriver, selector: string): Promise<void> => {
  await driver.wait(async () => (await driver.findElements(By.css(selector))).length === 0, WAIT_TIMEOUT)
}

// The Admin marks the scene entry as active only with the push of the server, so afterwards the scene is saved and
// other screens receive it when they connect
const confirmDialog = async (driver: WebDriver, entrySelector: string): Promise<void> => {
  await clickElement(driver, '[data-test-id="confirm-button"]')
  await driver.wait(async () => {
    const entries = await driver.findElements(By.css(entrySelector))
    return entries.length > 0 && (await entries[0].getAttribute('data-active')) === 'true'
  }, WAIT_TIMEOUT)
}

// Returns the last seen value instead of throwing on timeout, so the step's expect shows expected vs. actual
const waitForAttribute = async (
  driver: WebDriver,
  selector: string,
  attribute: string,
  expected: string
): Promise<string | null> => {
  await waitForElement(driver, selector)
  let actual: string | null = null
  try {
    await driver.wait(async () => {
      // Re-query each time: the screen may replace the element while the scene loads
      const elements = await driver.findElements(By.css(selector))
      actual = elements.length > 0 ? await elements[0].getAttribute(attribute) : null
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

export {
  BASE_URL,
  MEDIA_BASE_URL,
  MEDIA_PATH,
  WAIT_TIMEOUT,
  buildDriver,
  clickElement,
  confirmDialog,
  getRandomNumber,
  openScreen,
  waitForAttribute,
  waitForElement,
  waitForElementGone,
}
