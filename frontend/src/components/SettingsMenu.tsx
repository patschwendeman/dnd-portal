import { ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import settingsIcon from '/assets/icons/settings.svg'
import swapIcon from '/assets/icons/swap.svg'

import { Theme } from '../models/models'
import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import useListbox from '../utils/useListbox'

interface ThemeOption {
  // null = follows the game table
  value: Theme | null
  label: string
}

const OPTIONS: ThemeOption[] = [
  { value: null, label: 'Wie Spieltisch' },
  { value: 'dark', label: 'Dunkel' },
  { value: 'tavern', label: 'Taverne' },
]

type MenuPlacement = 'start' | 'end'

const Wrapper = styled.div`
  position: relative;
  flex: none;
  align-self: flex-start;
`

const Trigger = styled.button<TileSurfaceProps>`
  width: ${(props) => props.theme.size.control.lg};
  height: ${(props) => props.theme.size.control.lg};
  padding: 0;
  display: grid;
  place-items: center;
  ${tileSurface}
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;
  div {
    display: grid;
    place-items: center;
  }
  svg {
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
    color: ${(props) => props.theme.colors.text.color};
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }
`

// Above all other elements, also above the translucent cards (their blur makes each of them a
// stacking context of its own); only the overlay "Handy drehen" lies above it. Opaque, like the
// lists in the Admin.
const List = styled.div<{ $placement: MenuPlacement }>`
  position: absolute;
  top: calc(100% + ${(props) => props.theme.space[1]});
  ${(props) => (props.$placement === 'start' ? 'left' : 'right')}: 0;
  z-index: ${(props) => props.theme.layer.popover};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[1]};
  width: max-content;
  padding: ${(props) => props.theme.space[1]};
  background-color: ${(props) => props.theme.colors.secondary};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.lg};
`

const Separator = styled.div`
  height: ${(props) => props.theme.borderWidth.thin};
  margin: 0 ${(props) => props.theme.space[2]};
  background-color: ${(props) => props.theme.colors.border};
`

const Option = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
  height: ${(props) => props.theme.size.control.lg};
  padding: 0 ${(props) => props.theme.space[4]};
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
  white-space: nowrap;
  background-color: ${(props) => (props.$isSelected ? props.theme.colors.primary : 'transparent')};
  color: ${(props) => (
    props.$isSelected ? props.theme.colors.onPrimary : props.theme.colors.text.color
  )};
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:hover,
  &:focus {
    background-color: ${(props) => (
      props.$isSelected ? props.theme.colors.primary : props.theme.colors.background
    )};
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => (props.$isSelected ? props.theme.colors.onPrimary : props.theme.colors.primary)};
    outline-offset: -${(props) => props.theme.borderWidth.thick};
  }

  div {
    display: grid;
    place-items: center;
  }
  svg {
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
  }
`

interface SettingsMenuProps {
  themeOverride: Theme | null
  onChangeThemeOverride: (override: Theme | null) => void
  // Adds the entry "Charakter wechseln" after the themes
  onSwitchCharacter?: (() => void) | null
  // Side of the button the list is aligned to
  placement?: MenuPlacement
  isTranslucent?: boolean
}

// Settings of this device: the theme and, on the Player Screen, the way back to the selection
function SettingsMenu({
  themeOverride,
  onChangeThemeOverride,
  onSwitchCharacter = null,
  placement = 'start',
  isTranslucent = false,
}: SettingsMenuProps): ReactElement {
  const theme = useTheme()
  const selectedIndex = OPTIONS.findIndex((option) => option.value === themeOverride)
  const switchIndex = onSwitchCharacter === null ? null : OPTIONS.length
  const {
    isOpen, close, open, wrapperRef, triggerRef, optionElement, focusOption, choose,
    handleTriggerKeyDown, handleListKeyDown,
  } = useListbox({
    count: OPTIONS.length + (switchIndex === null ? 0 : 1),
    selectedIndex,
    onChoose: (index) => {
      if (index === switchIndex) {
        onSwitchCharacter?.()
      } else if (OPTIONS[index].value !== themeOverride) {
        onChangeThemeOverride(OPTIONS[index].value)
      }
    },
    // A tap on a smartphone has to close the menu as well
    outsideEvent: 'pointerdown',
  })

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        ref={triggerRef}
        type="button"
        data-test-id="settings-menu"
        aria-label="Einstellungen"
        title="Einstellungen"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleTriggerKeyDown}
        $isTranslucent={isTranslucent}
      >
        <ReactSVG
          src={settingsIcon}
          beforeInjection={(svg) => {
            svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
          }}
        />
      </Trigger>
      {isOpen && (
        <List
          role="menu"
          aria-label="Einstellungen"
          onKeyDown={handleListKeyDown}
          $placement={placement}
        >
          {OPTIONS.map((option, index) => (
            <Option
              key={option.label}
              ref={optionElement(index)}
              role="menuitemradio"
              tabIndex={-1}
              aria-checked={index === selectedIndex}
              data-test-id={`theme-option-${option.value ?? 'table'}`}
              $isSelected={index === selectedIndex}
              onClick={() => choose(index)}
              onFocus={() => focusOption(index)}
            >
              {option.label}
            </Option>
          ))}
          {switchIndex !== null && (
            <>
              <Separator role="separator" />
              <Option
                ref={optionElement(switchIndex)}
                role="menuitem"
                tabIndex={-1}
                data-test-id="switch-character"
                $isSelected={false}
                onClick={() => choose(switchIndex)}
                onFocus={() => focusOption(switchIndex)}
              >
                <ReactSVG
                  src={swapIcon}
                  beforeInjection={(svg) => {
                    svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
                  }}
                />
                Charakter wechseln
              </Option>
            </>
          )}
        </List>
      )}
    </Wrapper>
  )
}

export default SettingsMenu
