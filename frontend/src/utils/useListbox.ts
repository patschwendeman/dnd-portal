import {
  KeyboardEvent, RefObject, useEffect, useRef, useState,
} from 'react'

import { getListboxNextIndex, getListboxStartIndex, isListboxNavigationKey } from './listbox'

interface ListboxOptions {
  count: number
  selectedIndex: number
  /**
   * Called with the index of the entry chosen by click, Enter or Space; the list is closed already
   */
  onChoose: (index: number) => void
  /** While false the list does not open (e.g. locked during a fight) */
  canOpen?: boolean
  /** pointerdown on smartphones, so a tap outside closes the list as well */
  outsideEvent?: 'mousedown' | 'pointerdown'
}

interface Listbox {
  isOpen: boolean
  close: () => void
  open: () => void
  wrapperRef: RefObject<HTMLDivElement>
  triggerRef: RefObject<HTMLButtonElement>
  optionElement: (index: number) => (element: HTMLDivElement | null) => void
  focusOption: (index: number) => void
  choose: (index: number) => void
  handleTriggerKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  handleListKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

/** Button with a list after the ARIA pattern "Listbox" */
const useListbox = ({
  count, selectedIndex, onChoose, canOpen = true, outsideEvent = 'mousedown',
}: ListboxOptions): Listbox => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Moves the real focus, so the browser scrolls the entry into view and screen readers announce
  // it.
  useEffect(() => {
    if (isOpen && focusIndex >= 0) {
      optionRefs.current[focusIndex]?.focus()
    }
  }, [isOpen, focusIndex])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    const closeOnOutsidePointer = (event: Event) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener(outsideEvent, closeOnOutsidePointer)
    return () => document.removeEventListener(outsideEvent, closeOnOutsidePointer)
  }, [isOpen, outsideEvent])

  const open = () => {
    if (!canOpen) {
      return
    }
    setFocusIndex(getListboxStartIndex(selectedIndex, count))
    setIsOpen(true)
  }

  const closeAndFocusTrigger = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const choose = (index: number) => {
    closeAndFocusTrigger()
    onChoose(index)
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
      setFocusIndex(getListboxNextIndex(event.key, focusIndex, count))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (focusIndex >= 0) {
        choose(focusIndex)
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeAndFocusTrigger()
    } else if (event.key === 'Tab') {
      setIsOpen(false)
    }
  }

  return {
    isOpen,
    close: () => setIsOpen(false),
    open,
    wrapperRef,
    triggerRef,
    optionElement: (index) => (element) => {
      optionRefs.current[index] = element
    },
    focusOption: setFocusIndex,
    choose,
    handleTriggerKeyDown,
    handleListKeyDown,
  }
}

export default useListbox
