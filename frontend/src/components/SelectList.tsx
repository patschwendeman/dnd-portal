import { ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled from 'styled-components'

import { textStyle } from '../style/tokens'
import useListbox from '../utils/useListbox'

import lockIcon from '/assets/icons/padlock.svg'

const SELECT_LIST_MAX_HEIGHT = '320px'

const Wrapper = styled.div`
    position: relative;
    display: flex;
    min-width: 0;
`

// A field on the panel tile like the other controls in panels (surface `background`)
const Trigger = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${(props) => props.theme.space[2]};
    width: 100%;
    min-width: 0;
    height: ${(props) => props.theme.size.control.md};
    padding: 0 ${(props) => props.theme.space[3]};
    ${textStyle('sm')}
    font-family: inherit;
    font-weight: ${(props) => props.theme.fontWeight.medium};
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    border-radius: ${(props) => props.theme.radius.md};
    cursor: pointer;

    &:disabled {
        color: ${(props) => props.theme.colors.text.muted};
        cursor: default;
    }

    &[aria-disabled="true"] {
        cursor: not-allowed;
    }

    &:focus-visible {
        outline: ${(props) => props.theme.borderWidth.thick} solid
          ${(props) => props.theme.colors.primary};
        outline-offset: ${(props) => props.theme.borderWidth.thick};
    }
`

// Single line: long names in the narrow panel end with an ellipsis
const Ellipsis = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const Chevron = styled.svg<{ $isOpen: boolean }>`
    flex-shrink: 0;
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
    fill: currentColor;
    transform: ${(props) => (props.$isOpen ? 'rotate(180deg)' : 'none')};
`

const LockIcon = styled.span`
    flex-shrink: 0;
    color: ${(props) => props.theme.colors.text.muted};

    svg {
        display: block;
        width: ${(props) => props.theme.size.icon};
        height: ${(props) => props.theme.size.icon};
    }
`

const List = styled.div`
    position: absolute;
    top: calc(100% + ${(props) => props.theme.space[1]});
    right: 0;
    left: 0;
    z-index: ${(props) => props.theme.layer.popover};
    display: flex;
    flex-direction: column;
    gap: ${(props) => props.theme.space[1]};
    max-height: ${SELECT_LIST_MAX_HEIGHT};
    overflow-y: auto;
    padding: ${(props) => props.theme.space[1]};
    background-color: ${(props) => props.theme.colors.secondary};
    border: ${(props) => props.theme.borderWidth.thin} solid
      ${(props) => props.theme.colors.border};
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
    background-color: ${(props) => (
      props.$isSelected ? props.theme.colors.primary : 'transparent'
    )};
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

    /* Keyboard focus shows an outline on every entry: the background fill alone is too faint,
       and the selected entry keeps its primary fill. Inset, because the scrolling list would clip
       an outer outline. */
    &:focus-visible {
        outline: ${(props) => props.theme.borderWidth.thick} solid
            ${(props) => (
              props.$isSelected ? props.theme.colors.onPrimary : props.theme.colors.primary
            )};
        outline-offset: -${(props) => props.theme.borderWidth.thick};
    }
`

interface SelectOption<T> {
  value: T
  label: string
}

interface SelectListProps<T extends string | number> {
  options: readonly SelectOption<T>[]
  // null: no entry selected (the button shows no text)
  value: T | null
  onChange: (value: T) => void
  // Accessible name of button and list
  label: string
  testId: string
  // Test ids: entries `${optionTestIdPrefix}-${value}`, lock `${testId}-lock`
  optionTestIdPrefix: string
  // The list does not open, a lock replaces the arrow, `lockedTitle` is the tooltip
  isLocked?: boolean
  lockedTitle?: string
  // Disabled like without entries
  isDisabled?: boolean
}

function SelectList<T extends string | number>({
  options,
  value,
  onChange,
  label,
  testId,
  optionTestIdPrefix,
  isLocked = false,
  lockedTitle = undefined,
  isDisabled = false,
}: SelectListProps<T>): ReactElement {
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const isUnavailable = isDisabled || options.length === 0
  const {
    isOpen, close, open, wrapperRef, triggerRef, optionElement, focusOption, choose,
    handleTriggerKeyDown, handleListKeyDown,
  } = useListbox({
    count: options.length,
    selectedIndex,
    canOpen: !isLocked,
    onChoose: (index) => {
      if (options[index].value !== value) {
        onChange(options[index].value)
      }
    },
  })

  // A lock that starts meanwhile (a fight from another Admin window, an error) closes an open list
  const isListShown = isOpen && !isLocked && !isUnavailable

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        ref={triggerRef}
        type="button"
        data-test-id={testId}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isListShown}
        // aria-disabled instead of disabled, so the tooltip shows and the button keeps its focus
        aria-disabled={isLocked || undefined}
        title={isLocked ? lockedTitle : undefined}
        disabled={isUnavailable}
        onClick={() => (isListShown ? close() : open())}
        onKeyDown={handleTriggerKeyDown}
      >
        <Ellipsis title={selectedOption?.label}>{selectedOption?.label ?? ''}</Ellipsis>
        {isLocked ? (
          <LockIcon aria-hidden="true" data-test-id={`${testId}-lock`}>
            <ReactSVG src={lockIcon} />
          </LockIcon>
        ) : (
          <Chevron $isOpen={isListShown} viewBox="0 0 20 20" aria-hidden="true">
            <polygon points="5,7 15,7 10,13" />
          </Chevron>
        )}
      </Trigger>
      {isListShown && (
        <List role="listbox" aria-label={label} onKeyDown={handleListKeyDown}>
          {options.map((option, index) => (
            <Option
              key={option.value}
              ref={optionElement(index)}
              role="option"
              tabIndex={-1}
              aria-selected={index === selectedIndex}
              data-test-id={`${optionTestIdPrefix}-${option.value}`}
              title={option.label}
              $isSelected={index === selectedIndex}
              onClick={() => choose(index)}
              onFocus={() => focusOption(index)}
            >
              <Ellipsis>{option.label}</Ellipsis>
            </Option>
          ))}
        </List>
      )}
    </Wrapper>
  )
}

export type { SelectOption }
export { SelectList }
