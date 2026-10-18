import { Fragment, FunctionComponent, ReactElement, useCallback, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { ReactSVG } from 'react-svg'

import { AdventureSelect } from './AdventureSelect'
import { JoinDialog } from './JoinDialog'
import { SOUND_GROUPS } from '../audio/sounds'
import { AdventureSummary, SoundName } from '../models/models'

import phoneIcon from '/assets/icons/phone.svg'
import settingsIcon from '/assets/icons/settings.svg'

const OUTER_COLUMN_WIDTH = '240px'

const Bar = styled.div`
    display: grid;
    grid-template-columns: ${OUTER_COLUMN_WIDTH} 1fr ${OUTER_COLUMN_WIDTH};
    align-items: center;
    padding: 0 ${(props) => props.theme.space[5]};
    background-color: ${(props) => props.theme.colors.background};
    border-bottom: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.secondary};
`

const Sounds = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${(props) => props.theme.space[4]};
`

const SoundGroup = styled.div`
    display: flex;
    gap: ${(props) => props.theme.space[1]};
`

const Separator = styled.div`
    width: ${(props) => props.theme.borderWidth.thin};
    height: ${(props) => props.theme.size.icon};
    background-color: ${(props) => props.theme.colors.border};
`

const AtmoButton = styled.div`
    display: grid;
    place-items: center;
    width: ${(props) => props.theme.size.control.md};
    height: ${(props) => props.theme.size.control.md};
    color: ${(props) => props.theme.colors.text.color};
    border-radius: ${(props) => props.theme.radius.md};
    cursor: pointer;

    svg {
      display: block;
      width: ${(props) => props.theme.size.icon};
      height: ${(props) => props.theme.size.icon};
    }
`

const Actions = styled.div`
    display: flex;
    justify-self: end;
    gap: ${(props) => props.theme.space[1]};
`

const IconButton = styled.button`
    display: grid;
    place-items: center;
    width: ${(props) => props.theme.size.control.md};
    height: ${(props) => props.theme.size.control.md};
    padding: 0;
    background-color: transparent;
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    border-radius: ${(props) => props.theme.radius.md};
    cursor: pointer;

    svg {
        display: block;
        width: ${(props) => props.theme.size.icon};
        height: ${(props) => props.theme.size.icon};
    }
`

interface TopBarProps {
  // Switches the theme of the game table (Admin, Wall and Ground)
  onToggleTheme: () => void
  adventures: AdventureSummary[]
  activeAdventureId: number | null
  onSelectAdventure: (adventureId: number) => void
  onPlaySound: (name: SoundName) => void
}

const TopBar: FunctionComponent<TopBarProps> = ({
  onToggleTheme,
  adventures,
  activeAdventureId,
  onSelectAdventure,
  onPlaySound,
}): ReactElement => {
  const theme = useTheme()
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const joinButtonRef = useRef<HTMLButtonElement>(null)

  const closeJoinDialog = useCallback(() => {
    setIsJoinDialogOpen(false)
    joinButtonRef.current?.focus()
  }, [])

  return (
    <Bar>
      <AdventureSelect
        adventures={adventures}
        activeAdventureId={activeAdventureId}
        onSelectAdventure={onSelectAdventure}
      />
      <Sounds>
        {SOUND_GROUPS.map((sounds, groupIndex) => (
          <Fragment key={groupIndex}>
            {groupIndex > 0 && <Separator />}
            <SoundGroup>
              {sounds.map((sound) => (
                <AtmoButton onClick={() => onPlaySound(sound.name)} key={sound.name}>
                  <ReactSVG
                    src={sound.icon}
                    beforeInjection={(svg) => {
                      svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
                    }}
                  />
                </AtmoButton>
              ))}
            </SoundGroup>
          </Fragment>
        ))}
      </Sounds>
      <Actions>
        <IconButton
          ref={joinButtonRef}
          type='button'
          title='Spieler verbinden'
          aria-label='Spieler verbinden'
          aria-haspopup='dialog'
          data-test-id='join-button'
          onClick={() => setIsJoinDialogOpen(true)}
        >
          <ReactSVG
            src={phoneIcon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </IconButton>
        <IconButton onClick={onToggleTheme}>
          <ReactSVG
            src={settingsIcon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </IconButton>
      </Actions>
      {isJoinDialogOpen && <JoinDialog onClose={closeJoinDialog} />}
    </Bar>
  )
}

export { TopBar }
