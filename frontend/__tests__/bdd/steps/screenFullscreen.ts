import { loadFeature, defineFeature } from 'jest-cucumber'
import {
  By, Origin, WebDriver, error,
} from 'selenium-webdriver'

import {
  WAIT_TIMEOUT,
  buildDriver,
  clickElement,
  openScreen,
  waitForAttribute,
  waitForElement,
  waitForElementGone,
  waitForFullscreen,
} from '../support/helpers'

const feature = loadFeature('__tests__/bdd/features/screenFullscreen.feature')

const OVERLAY = '[data-test-id="fullscreen-overlay"]'
const OVERLAY_ICON = `${OVERLAY} svg`
const BACKDROP_COLOR = 'rgba(0, 0, 0, 0.5)'
const MOUSE_POSITION = { x: 100, y: 100 }
// Start of the browser plus the waits of the scenario
const SCENARIO_TIMEOUT = 6 * WAIT_TIMEOUT

interface OverlayBox {
  left: number
  top: number
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
  backgroundColor: string
}

const readOverlayBox = async (driver: WebDriver): Promise<OverlayBox> => driver.executeScript(
  `const overlay = document.querySelector('${OVERLAY}')
  const rect = overlay.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    viewportWidth: document.documentElement.clientWidth,
    viewportHeight: document.documentElement.clientHeight,
    backgroundColor: getComputedStyle(overlay).backgroundColor,
  }`,
)

// Returns the last seen text instead of throwing on timeout, so the step's expect shows it
const waitForOverlayText = async (driver: WebDriver, expected: string): Promise<string | null> => {
  let actual: string | null = null
  try {
    await driver.wait(async () => {
      const overlays = await driver.findElements(By.css(OVERLAY))
      actual = overlays.length > 0 ? await overlays[0].getText() : null
      return actual === expected
    }, WAIT_TIMEOUT)
  } catch (err) {
    if (!(err instanceof error.TimeoutError)) {
      throw err
    }
  }
  return actual
}

const expectOverlay = async (driver: WebDriver, text: string, pressed: boolean): Promise<void> => {
  expect(await waitForOverlayText(driver, text)).toBe(text)
  expect(await waitForAttribute(driver, OVERLAY, 'aria-label', text)).toBe(text)
  expect(await waitForAttribute(driver, OVERLAY, 'aria-pressed', String(pressed)))
    .toBe(String(pressed))
  await waitForElement(driver, OVERLAY_ICON)
}

const expectNoOverlay = async (driver: WebDriver): Promise<void> => {
  await waitForElementGone(driver, OVERLAY)
}

defineFeature(feature, (test) => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = buildDriver()
  })

  afterEach(async () => {
    await driver.quit()
  })

  test('I switch the <screen> screen to full screen with the overlay', ({
    given, when, then,
  }) => {
    given(/^the (\S+) screen is open and the mouse was not over it$/, async (screen: string) => {
      await openScreen(driver, `/${screen}`)
      await waitForElement(driver, '#root > *')
    })

    then('no overlay is shown', async () => {
      await expectNoOverlay(driver)
    })

    when(/^I move the mouse over the (\S+) screen$/, async () => {
      await driver.actions().move({ ...MOUSE_POSITION, origin: Origin.VIEWPORT }).perform()
    })

    then('the overlay darkens the whole screen and shows the text Vollbild', async () => {
      await expectOverlay(driver, 'Vollbild', false)
      const box = await readOverlayBox(driver)
      expect(box).toEqual({
        left: 0,
        top: 0,
        width: box.viewportWidth,
        height: box.viewportHeight,
        viewportWidth: box.viewportWidth,
        viewportHeight: box.viewportHeight,
        backgroundColor: BACKDROP_COLOR,
      })
    })

    when('I click on the overlay', async () => {
      await clickElement(driver, OVERLAY)
    })

    then(
      'the window is in full screen and the overlay shows the text Vollbild beenden',
      async () => {
        expect(await waitForFullscreen(driver, true)).toBe(true)
        await expectOverlay(driver, 'Vollbild beenden', true)
      },
    )

    when('I click on the overlay again', async () => {
      await clickElement(driver, OVERLAY)
    })

    then(
      'the window is no longer in full screen and the overlay shows the text Vollbild',
      async () => {
        expect(await waitForFullscreen(driver, false)).toBe(false)
        await expectOverlay(driver, 'Vollbild', false)
      },
    )

    // WebDriver actions cannot leave the viewport (MoveTargetOutOfBounds); a mouse move outside
    // through the DevTools protocol makes Chrome send pointerleave like a real mouse
    when('the mouse leaves the window', async () => {
      await driver.sendDevToolsCommand(
        'Input.dispatchMouseEvent',
        { type: 'mouseMoved', x: -10, y: -10 },
      )
    })

    then('no overlay is shown', async () => {
      await expectNoOverlay(driver)
    })
  }, SCENARIO_TIMEOUT)
})
