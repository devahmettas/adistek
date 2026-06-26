import { RefObject, useEffect } from 'react'

type BodyStyleSnapshot = {
  overflow: string
  paddingRight: string
  position: string
  top: string
  width: string
  touchAction: string
}

let lockCount = 0
let savedScrollY = 0
let savedStyles: BodyStyleSnapshot | null = null
let touchMoveHandler: ((event: TouchEvent) => void) | null = null

function isInsideModalScroll(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  let element: Element | null = target

  while (element) {
    if (element.hasAttribute('data-modal-scroll')) {
      return true
    }

    if (element.getAttribute('role') === 'dialog') {
      const { overflowY } = window.getComputedStyle(element)

      if (overflowY === 'auto' || overflowY === 'scroll') {
        return true
      }
    }

    element = element.parentElement
  }

  return false
}

function lockBodyScroll() {
  const { body, documentElement } = document
  savedScrollY = window.scrollY

  savedStyles = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
    touchAction: body.style.touchAction,
  }

  const scrollbarWidth = window.innerWidth - documentElement.clientWidth

  body.style.overflow = 'hidden'
  body.style.position = 'fixed'
  body.style.top = `-${savedScrollY}px`
  body.style.width = '100%'
  body.style.touchAction = 'none'

  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`
  }

  touchMoveHandler = (event: TouchEvent) => {
    if (isInsideModalScroll(event.target)) {
      return
    }

    event.preventDefault()
  }

  document.addEventListener('touchmove', touchMoveHandler, { passive: false })
}

function unlockBodyScroll() {
  const { body } = document

  if (touchMoveHandler) {
    document.removeEventListener('touchmove', touchMoveHandler)
    touchMoveHandler = null
  }

  if (savedStyles) {
    body.style.overflow = savedStyles.overflow
    body.style.paddingRight = savedStyles.paddingRight
    body.style.position = savedStyles.position
    body.style.top = savedStyles.top
    body.style.width = savedStyles.width
    body.style.touchAction = savedStyles.touchAction
    savedStyles = null
  }

  window.scrollTo(0, savedScrollY)
}

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      return
    }

    lockCount += 1

    if (lockCount === 1) {
      lockBodyScroll()
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1)

      if (lockCount === 0) {
        unlockBodyScroll()
      }
    }
  }, [active])
}

export function useModalViewport(
  panelRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) {
      return
    }

    const panel = panelRef.current
    const viewport = window.visualViewport

    if (!panel || !viewport) {
      return
    }

    const syncPanelHeight = () => {
      const availableHeight = Math.min(viewport.height - 12, window.innerHeight * 0.94)
      panel.style.maxHeight = `${availableHeight}px`
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target

      if (
        !(target instanceof HTMLInputElement)
        && !(target instanceof HTMLTextAreaElement)
        && !(target instanceof HTMLSelectElement)
      ) {
        return
      }

      window.requestAnimationFrame(() => {
        syncPanelHeight()
        window.setTimeout(() => {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }, 120)
      })
    }

    viewport.addEventListener('resize', syncPanelHeight)
    viewport.addEventListener('scroll', syncPanelHeight)
    panel.addEventListener('focusin', handleFocusIn)
    syncPanelHeight()

    return () => {
      viewport.removeEventListener('resize', syncPanelHeight)
      viewport.removeEventListener('scroll', syncPanelHeight)
      panel.removeEventListener('focusin', handleFocusIn)
      panel.style.maxHeight = ''
    }
  }, [active, panelRef])
}

export function useModalPresentation(
  active: boolean,
  panelRef?: RefObject<HTMLElement | null>,
) {
  useBodyScrollLock(active)

  const emptyRef = { current: null } as RefObject<HTMLElement | null>
  useModalViewport(panelRef ?? emptyRef, active && Boolean(panelRef))
}
