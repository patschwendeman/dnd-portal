import {
  FunctionComponent, KeyboardEvent, ReactElement, useEffect, useRef, useState,
} from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import settingsIcon from '/assets/icons/settings.svg'

import { Theme } from '../models/models'
import { textStyle } from '../style/tokens'
import { getListboxNextIndex, getListboxStartIndex, isListboxNavigationKey } from '../utils/listbox'

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
    outline: ${(props) => props.theme.borderWidth.thick} solid ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }
`

// Positioned without z-index: it lies above the unpositioned resources, the overlay "Handy drehen" comes later in the
// JSX and still covers it.
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
  color: ${(props) => (props.$isSelected ? props.theme.colors.onPrimary : props.theme.colors.text.color)};
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:hover,
  &:focus {
    background-color: ${(props) => (props.$isSelected ? props.theme.colors.primary : props.theme.colors.background)};
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

const ThemeMenu: FunctionComponent<ThemeMenuProps> = ({ themeOverride, onChangeThemeOverride }): ReactElement => {
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  const selectedIndex = OPTIONS.findIndex((option) => option.value === themeOverride)

  useEffect(() => {
    if (isOpen && focusIndex >= 0) {
      optionRefs.current[focusIndex]?.focus()
    }
  }, [isOpen, focusIndex])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    // pointerdown instead of mousedown: a tap on a smartphone has to close the menu as well
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [isOpen])

  const open = () => {
    setFocusIndex(getListboxStartIndex(selectedIndex, OPTIONS.length))
    setIsOpen(true)
  }

  const closeAndFocusTrigger = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const choose = (value: Theme | null) => {
    closeAndFocusTrigger()
    if (value !== themeOverride) {
      onChangeThemeOverride(value)
    }
  }

  // Enter and Space reach the button as a click; only the arrows need their own handling.
  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()
      open()
    }
  }

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isListboxNavigationKey(event.key)) {
      event.preventDefault()
      setFocusIndex(getListboxNextIndex(event.key, focusIndex, OPTIONS.length))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (focusIndex >= 0) {
        choose(OPTIONS[focusIndex].value)
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeAndFocusTrigger()
    } else if (event.key === 'Tab') {
      setIsOpen(false)
    }
  }

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
        onClick={() => (isOpen ? setIsOpen(false) : open())}
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
              ref={(element) => {
                optionRefs.current[index] = element
              }}
              role="option"
              tabIndex={-1}
              aria-selected={index === selectedIndex}
              data-test-id={`theme-option-${option.value ?? 'table'}`}
              $isSelected={index === selectedIndex}
              onClick={() => choose(option.value)}
              onFocus={() => setFocusIndex(index)}
            >
              {option.label}
            </Option>
          ))}
        </List>
      )}
    </Wrapper>
  )
}

export { ThemeMenu }
