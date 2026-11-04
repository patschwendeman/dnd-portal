import { ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import settingsIcon from '/assets/icons/settings.svg'

import { Theme } from '../models/models'
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

const Wrapper = styled.div`
  position: relative;
  align-self: flex-start;
`

const Trigger = styled.button`
  width: ${(props) => props.theme.size.control.lg};
  height: ${(props) => props.theme.size.control.lg};
  padding: 0;
  display: grid;
  place-items: center;
  background-color: ${(props) => props.theme.colors.secondary};
  border: none;
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

// Positioned without z-index: it lies above the unpositioned resources, the overlay "Handy drehen"
// comes later in the JSX and still covers it.
const List = styled.div`
  position: absolute;
  top: calc(100% + ${(props) => props.theme.space[1]});
  left: 0;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[1]};
  width: max-content;
  padding: ${(props) => props.theme.space[1]};
  background-color: ${(props) => props.theme.colors.secondary};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.lg};
`

const Option = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
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
`

interface ThemeMenuProps {
  themeOverride: Theme | null
  onChangeThemeOverride: (override: Theme | null) => void
}

function ThemeMenu({ themeOverride, onChangeThemeOverride }: ThemeMenuProps): ReactElement {
  const theme = useTheme()
  const selectedIndex = OPTIONS.findIndex((option) => option.value === themeOverride)
  const {
    isOpen, close, open, wrapperRef, triggerRef, optionElement, focusOption, choose,
    handleTriggerKeyDown, handleListKeyDown,
  } = useListbox({
    count: OPTIONS.length,
    selectedIndex,
    onChoose: (index) => {
      if (OPTIONS[index].value !== themeOverride) {
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
        data-test-id="theme-menu"
        aria-label="Darstellung"
        title="Darstellung"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleTriggerKeyDown}
      >
        <ReactSVG
          src={settingsIcon}
          beforeInjection={(svg) => {
            svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
          }}
        />
      </Trigger>
      {isOpen && (
        <List role="listbox" aria-label="Darstellung" onKeyDown={handleListKeyDown}>
          {OPTIONS.map((option, index) => (
            <Option
              key={option.label}
              ref={optionElement(index)}
              role="option"
              tabIndex={-1}
              aria-selected={index === selectedIndex}
              data-test-id={`theme-option-${option.value ?? 'table'}`}
              $isSelected={index === selectedIndex}
              onClick={() => choose(index)}
              onFocus={() => focusOption(index)}
            >
              {option.label}
            </Option>
          ))}
        </List>
      )}
    </Wrapper>
  )
}

export default ThemeMenu
