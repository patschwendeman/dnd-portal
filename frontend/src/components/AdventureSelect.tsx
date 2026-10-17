import { FunctionComponent, KeyboardEvent, ReactElement, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { AdventureSummary } from '../models/models'
import { textStyle } from '../style/tokens'
import { getListboxNextIndex, getListboxStartIndex, isListboxNavigationKey } from '../utils/listbox'

const ADVENTURE_LIST_MAX_HEIGHT = '320px'

const Wrapper = styled.div`
    position: relative;
    justify-self: start;
    min-width: 0;
    max-width: 100%;
`

const Trigger = styled.button`
    display: flex;
    align-items: center;
    gap: ${(props) => props.theme.space[2]};
    max-width: 100%;
    height: ${(props) => props.theme.size.control.md};
    padding: 0 ${(props) => props.theme.space[3]};
    ${textStyle('md')}
    font-family: inherit;
    font-weight: ${(props) => props.theme.fontWeight.bold};
    background-color: ${(props) => props.theme.colors.secondary};
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    border-radius: ${(props) => props.theme.radius.md};
    cursor: pointer;

    &:disabled {
        cursor: default;
    }

    &:focus-visible {
        outline: ${(props) => props.theme.borderWidth.thick} solid ${(props) => props.theme.colors.primary};
        outline-offset: ${(props) => props.theme.borderWidth.thick};
    }
`

const TriggerLabel = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const Chevron = styled.svg<{ $isOpen: boolean }>`
    flex-shrink: 0;
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
    fill: ${(props) => props.theme.colors.text.color};
    transform: ${(props) => (props.$isOpen ? 'rotate(180deg)' : 'none')};
`

const List = styled.div`
    position: absolute;
    top: calc(100% + ${(props) => props.theme.space[1]});
    left: 0;
    z-index: ${(props) => props.theme.layer.popover};
    display: flex;
    flex-direction: column;
    gap: ${(props) => props.theme.space[1]};
    width: max-content;
    min-width: 100%;
    max-height: ${ADVENTURE_LIST_MAX_HEIGHT};
    overflow-y: auto;
    padding: ${(props) => props.theme.space[1]};
    background-color: ${(props) => props.theme.colors.secondary};
    border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
    border-radius: ${(props) => props.theme.radius.lg};
`

const Option = styled.div<{ $isSelected: boolean }>`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: flex-start;
    height: ${(props) => props.theme.size.control.md};
    padding: 0 ${(props) => props.theme.space[3]};
    ${textStyle('sm')}
    font-weight: ${(props) => props.theme.fontWeight.medium};
    text-align: left;
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

    /* The selected entry keeps its primary fill, so keyboard focus needs an outline there. Inset, because the
       scrolling list would clip an outer outline. */
    ${(props) => props.$isSelected && `
        &:focus-visible {
            outline: ${props.theme.borderWidth.thick} solid ${props.theme.colors.onPrimary};
            outline-offset: -${props.theme.borderWidth.thick};
        }
    `}
`

interface AdventureSelectProps {
  adventures: AdventureSummary[]
  activeAdventureId: number | null
  onSelectAdventure: (adventureId: number) => void
}

const AdventureSelect: FunctionComponent<AdventureSelectProps> = ({
  adventures,
  activeAdventureId,
  onSelectAdventure,
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  const selectedIndex = adventures.findIndex((adventure) => adventure.id === activeAdventureId)
  const activeAdventure = selectedIndex >= 0 ? adventures[selectedIndex] : undefined

  // Moves the real focus, so the browser scrolls the entry into view and screen readers announce it.
  useEffect(() => {
    if (isOpen && focusIndex >= 0) {
      optionRefs.current[focusIndex]?.focus()
    }
  }, [isOpen, focusIndex])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const closeOnOutsidePointer = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutsidePointer)
    return () => document.removeEventListener('mousedown', closeOnOutsidePointer)
  }, [isOpen])

  const open = () => {
    setFocusIndex(getListboxStartIndex(selectedIndex, adventures.length))
    setIsOpen(true)
  }

  const closeAndFocusTrigger = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const choose = (adventureId: number) => {
    closeAndFocusTrigger()
    if (adventureId !== activeAdventureId) {
      onSelectAdventure(adventureId)
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
      setFocusIndex(getListboxNextIndex(event.key, focusIndex, adventures.length))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (focusIndex >= 0) {
        choose(adventures[focusIndex].id)
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
        type='button'
        data-test-id='adventure-select'
        aria-label='Abenteuer'
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        disabled={adventures.length === 0}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        onKeyDown={handleTriggerKeyDown}
      >
        <TriggerLabel>{activeAdventure?.name ?? ''}</TriggerLabel>
        <Chevron $isOpen={isOpen} viewBox='0 0 20 20' aria-hidden='true'>
          <polygon points='5,7 15,7 10,13' />
        </Chevron>
      </Trigger>
      {isOpen && (
        <List role='listbox' aria-label='Abenteuer' onKeyDown={handleListKeyDown}>
          {adventures.map((adventure, index) => (
            <Option
              key={adventure.id}
              ref={(element) => {
                optionRefs.current[index] = element
              }}
              role='option'
              tabIndex={-1}
              aria-selected={index === selectedIndex}
              data-test-id={`adventure-option-${adventure.id}`}
              $isSelected={index === selectedIndex}
              onClick={() => choose(adventure.id)}
              onFocus={() => setFocusIndex(index)}
            >
              {adventure.name}
            </Option>
          ))}
        </List>
      )}
    </Wrapper>
  )
}

export { AdventureSelect }
