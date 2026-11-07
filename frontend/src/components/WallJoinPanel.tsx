import { QRCodeSVG } from 'qrcode.react'
import { ReactElement, useEffect, useState } from 'react'
import styled, { css, useTheme } from 'styled-components'

import { OverlayPanel, PanelHeader, PanelTitle } from './WallOverlay'
import { getJoinInfo } from '../service/WallScreen'
import { textStyle } from '../style/tokens'
import { loadLatest } from '../utils/loadSafely'
import selectPlayerUrl from '../utils/playerUrl'

const QR_CODE_MAX_SIZE = 480
// Quiet zone around the code in modules: cameras need it to find the code
const QR_CODE_MARGIN = 4
// Non-breaking space: the command must not be split across lines
const UNKNOWN_URL_MESSAGE = 'Player-URL unbekannt – Spieltisch mit „dnd prod“ starten '
  + 'oder die Wall über die IP des Rechners öffnen'

// Edge length of the QR code: smallest of the upper limit, the viewport width minus the side
// margins and the available height (below the same margin as above) minus title and URL, so the
// code is never cut off
const qrCodeSize = css`
  min(
    ${QR_CODE_MAX_SIZE}px,
    calc(100vw - 2 * ${(props) => props.theme.space[8]} - 2 * ${(props) => props.theme.space[6]}),
    calc(
      100vh - 2 * ${(props) => props.theme.space[7]} - 2 * ${(props) => props.theme.space[6]}
        - ${(props) => props.theme.text.xl.lineHeight} - ${(props) => props.theme.space[5]}
        - ${(props) => props.theme.space[5]} - ${(props) => props.theme.text.lg.lineHeight}
    )
  )
`

const JoinPanel = styled(OverlayPanel)`
  align-items: center;
  width: calc(${qrCodeSize} + 2 * ${(props) => props.theme.space[6]});
`

const QrCode = styled.div`
  svg {
    display: block;
    width: ${qrCodeSize};
    height: ${qrCodeSize};
  }
`

const Url = styled.p`
  ${textStyle('lg')}
  margin: ${(props) => props.theme.space[5]} 0 0;
  overflow-wrap: anywhere;
  text-align: center;
`

const Hint = styled.p`
  ${textStyle('lg')}
  margin: 0;
  text-align: center;
`

// undefined while loading, null if the URL is unknown
type PlayerUrl = string | null | undefined

/**
 * Shows the URL of the Player Screen as QR code for all players at the table. Mounted while the
 * overlay is `join`, so the URL is loaded every time the overlay opens.
 */
function WallJoinPanel(): ReactElement {
  const theme = useTheme()
  const [playerUrl, setPlayerUrl] = useState<PlayerUrl>(undefined)

  useEffect(() => {
    let stale = false

    loadLatest(
      getJoinInfo,
      (joinInfo) => setPlayerUrl(selectPlayerUrl(joinInfo.player_url, window.location)),
      (err) => {
        console.error('Error fetching join info:', err)
        setPlayerUrl(null)
      },
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [])

  return (
    <JoinPanel $isTranslucent data-test-id="wall-join">
      <PanelHeader>
        <PanelTitle>Spieler verbinden</PanelTitle>
      </PanelHeader>
      {typeof playerUrl === 'string' && (
        <>
          <QrCode data-test-id="wall-join-qr-code">
            <QRCodeSVG
              value={playerUrl}
              size={QR_CODE_MAX_SIZE}
              marginSize={QR_CODE_MARGIN}
              fgColor={theme.colors.qr.foreground}
              bgColor={theme.colors.qr.background}
              title={playerUrl}
            />
          </QrCode>
          <Url data-test-id="wall-join-url">{playerUrl}</Url>
        </>
      )}
      {playerUrl === null && <Hint data-test-id="wall-join-hint">{UNKNOWN_URL_MESSAGE}</Hint>}
    </JoinPanel>
  )
}

export default WallJoinPanel
