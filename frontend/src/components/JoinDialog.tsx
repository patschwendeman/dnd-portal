import { QRCodeSVG } from 'qrcode.react'
import {
  MouseEvent, ReactElement, useEffect, useRef, useState,
} from 'react'
import styled, { useTheme } from 'styled-components'

import { TextButton } from './TextButton'
import { getJoinInfo } from '../service/adminScreen'
import { textStyle } from '../style/tokens'
import { loadLatest } from '../utils/loadSafely'
import selectPlayerUrl from '../utils/playerUrl'

const JOIN_DIALOG_WIDTH = '360px'
const QR_CODE_SIZE = 240
// Quiet zone around the code in modules: cameras need it to find the code
const QR_CODE_MARGIN = 4
// Non-breaking space: the command must not be split across lines
const UNKNOWN_URL_MESSAGE = 'Player-URL unbekannt – Spieltisch mit „dnd\u00a0prod“ starten '
  + 'oder den Admin über die IP des Rechners öffnen'

const LayoutContainer = styled.div`
  display: flex;
  position: fixed;
  inset: 0;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.colors.overlay};
  z-index: ${(props) => props.theme.layer.dialog};
`

const DialogContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.space[4]};
  width: ${JOIN_DIALOG_WIDTH};
  padding: ${(props) => props.theme.space[5]};
  border-radius: ${(props) => props.theme.radius.lg};
  background-color: ${(props) => props.theme.colors.secondary};
  color: ${(props) => props.theme.colors.text.color};
`

const Title = styled.h2`
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  margin: 0;
`

const QrCode = styled.div`
  svg {
    display: block;
  }
`

const Url = styled.p`
  ${textStyle('sm')}
  margin: 0;
  overflow-wrap: anywhere;
  text-align: center;
  user-select: all;
`

const Hint = styled.p`
  ${textStyle('sm')}
  margin: 0;
  text-align: center;
`

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-self: stretch;
`

// undefined while loading, null if the URL is unknown
type PlayerUrl = string | null | undefined

interface JoinDialogProps {
  onClose: () => void
}

// Shows the URL of the Player Screen as QR code, so the players scan it instead of typing the IP.
// The URL is loaded every time the dialog opens (it is mounted on open).
function JoinDialog({ onClose }: JoinDialogProps): ReactElement {
  const theme = useTheme()
  const [playerUrl, setPlayerUrl] = useState<PlayerUrl>(undefined)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const closeOnOutsideClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <LayoutContainer onClick={closeOnOutsideClick}>
      <DialogContainer
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-dialog-title"
        data-test-id="join-dialog"
      >
        <Title id="join-dialog-title">Spieler verbinden</Title>
        {typeof playerUrl === 'string' && (
          <>
            <QrCode data-test-id="join-qr-code">
              <QRCodeSVG
                value={playerUrl}
                size={QR_CODE_SIZE}
                marginSize={QR_CODE_MARGIN}
                fgColor={theme.colors.qr.foreground}
                bgColor={theme.colors.qr.background}
                title={playerUrl}
              />
            </QrCode>
            <Url data-test-id="join-url">{playerUrl}</Url>
          </>
        )}
        {playerUrl === null && <Hint data-test-id="join-hint">{UNKNOWN_URL_MESSAGE}</Hint>}
        <ButtonContainer>
          <TextButton
            ref={closeButtonRef}
            $variant="cancel"
            data-test-id="join-close"
            onClick={onClose}
          >
            Schließen
          </TextButton>
        </ButtonContainer>
      </DialogContainer>
    </LayoutContainer>
  )
}

export default JoinDialog
