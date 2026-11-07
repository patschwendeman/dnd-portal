import {
  Builder, By, error, until, WebDriver, WebElement,
} from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'

// Lives outside steps/ so jest (testMatch: __tests__/bdd/steps/*.ts) does not run it as a test file
const BASE_URL = 'http://localhost:5173'
// Scene media are served by the backend through the proxy of the frontend (VITE_API_URL default
// /api/). The src property of an image is resolved against the page.
const MEDIA_PATH = '/api/media'
const MEDIA_BASE_URL = `${BASE_URL}${MEDIA_PATH}`

// Must stay below the jest testTimeout (10 s), otherwise jest aborts before the wait reports its
// failure
const WAIT_TIMEOUT = 5000

const getRandomNumber = (min: number, max: number): number => {
  const lower = Math.ceil(min)
  const upper = Math.floor(max)
  return Math.floor(Math.random() * (upper - lower + 1)) + lower
}

// Headless by default; HEADED=1 shows the browser window for debugging. The fixed window size keeps
// the layout of the screens the same as on a desktop monitor.
const buildDriver = (): WebDriver => {
  const options = new Options().addArguments('--window-size=1920,1080')
  if (process.env.HEADED !== '1') {
    options.addArguments('--headless=new')
  }
  return new Builder().forBrowser('chrome').setChromeOptions(options).build() as WebDriver
}

const openScreen = async (driver: WebDriver, path: string): Promise<void> => {
  await driver.get(`${BASE_URL}${path}`)
}

const waitForElement = async (driver: WebDriver, selector: string): Promise<WebElement> => (
  driver.wait(until.elementLocated(By.css(selector)), WAIT_TIMEOUT)
)

const clickElement = async (driver: WebDriver, selector: string): Promise<WebElement> => {
  const element = await waitForElement(driver, selector)
  await driver.wait(until.elementIsVisible(element), WAIT_TIMEOUT)
  await element.click()
  return element
}

const waitForElementGone = async (driver: WebDriver, selector: string): Promise<void> => {
  await driver.wait(
    async () => (await driver.findElements(By.css(selector))).length === 0,
    WAIT_TIMEOUT,
  )
}

// The Admin marks the scene entry as active only with the push of the server, so afterwards the
// scene is saved and other screens receive it when they connect
const confirmDialog = async (driver: WebDriver, entrySelector: string): Promise<void> => {
  await clickElement(driver, '[data-test-id="confirm-button"]')
  await driver.wait(async () => {
    const entries = await driver.findElements(By.css(entrySelector))
    return entries.length > 0 && (await entries[0].getAttribute('data-active')) === 'true'
  }, WAIT_TIMEOUT)
}

// Returns the last seen value instead of throwing on timeout, so the step's expect shows expected
// vs. actual
const waitForAttribute = async (
  driver: WebDriver,
  selector: string,
  attribute: string,
  expected: string,
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

const isFullscreen = async (driver: WebDriver): Promise<boolean> => driver.executeScript(
  'return document.fullscreenElement !== null',
)

// Returns the last seen state instead of throwing on timeout, so the step's expect shows it
const waitForFullscreen = async (driver: WebDriver, expected: boolean): Promise<boolean> => {
  let actual = !expected
  try {
    await driver.wait(async () => {
      actual = await isFullscreen(driver)
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

const api = async (method: string, path: string, body?: object): Promise<Response> => fetch(
  `${BASE_URL}/api/${path}`,
  {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  },
)

const readJson = async <T>(path: string): Promise<T> => {
  const response = await api('GET', path)
  expect(response.ok).toBe(true)
  return (await response.json()) as T
}

interface TableState { active_adventure_id: number | null, active_scene_id: number | null }

interface ActiveScene {
  adventureId: number
  // Active scene of the adventure before the call, to restore the seed state afterwards
  previousSceneId: number | null
}

// After a fresh seed neither an adventure nor a scene is active; both are set over the API, so
// the scenario does not depend on another suite
const ensureActiveScene = async (): Promise<ActiveScene> => {
  let table = await readJson<TableState>('table')
  if (table.active_adventure_id === null) {
    const [first] = await readJson<{ id: number }[]>('adventures')
    expect((await api('PATCH', 'table', { active_adventure_id: first.id })).ok).toBe(true)
    table = await readJson('table')
  }
  const adventureId = Number(table.active_adventure_id)
  const previousSceneId = table.active_scene_id
  if (previousSceneId === null) {
    const [scene] = await readJson<{ id: number }[]>(`adventures/${adventureId}/scenes`)
    expect((await api('PATCH', `adventures/${adventureId}`, { active_scene_id: scene.id })).ok)
      .toBe(true)
  }
  return { adventureId, previousSceneId }
}

const restoreActiveScene = async ({ adventureId, previousSceneId }: ActiveScene): Promise<void> => {
  const response = await api('PATCH', `adventures/${adventureId}`, {
    active_scene_id: previousSceneId,
  })
  expect(response.ok).toBe(true)
}

export type { ActiveScene }

export {
  BASE_URL,
  MEDIA_BASE_URL,
  MEDIA_PATH,
  WAIT_TIMEOUT,
  api,
  buildDriver,
  clickElement,
  confirmDialog,
  ensureActiveScene,
  getRandomNumber,
  openScreen,
  readJson,
  restoreActiveScene,
  waitForAttribute,
  waitForElement,
  waitForElementGone,
  waitForFullscreen,
}
