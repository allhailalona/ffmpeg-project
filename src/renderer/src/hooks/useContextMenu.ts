//the functionality of useEffect will only be available when the comp mounts, ergo when the menu is visible
//usually the useEffect won't be necessary here, but since we use a global (document etc) event listener, IT REMAINS AFTER RE-RENDERS--
//--which means it will accumulate and reduce performance, which is why we clean them up.
//in other worsds, don't try to look at the useEffect as why do we render it only once? this menu renders only once anyways...
//the useEffect is here for a different reason! read above - it's performance optimization!
//now, since we use useEffect, it's proper to use useCallback as well for professionalism and future proofing (perhaps we'll want to keep the
//--menu after click and whatnot....)

import { useState, useEffect, useCallback } from 'react'
import { UseContextMenuReturn, ContextMenuProps } from 'src/types'

export default function useContextMenu(): UseContextMenuReturn {
  const [contextMenuProps, setContextMenuProps] = useState<ContextMenuProps>({
    isVisible: false,
    x: 0,
    y: 0
  })

  const showContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    console.log('hello from showContextMenu, x is', e.clientX, 'and y is', e.clientY)

    setContextMenuProps({
      isVisible: true,
      x: e.clientX,
      y: e.clientY
    })
  }, [])

  const hideContextMenu = useCallback(() => {
    setContextMenuProps((prev) => ({ ...prev, isVisible: false }))
  }, [])

  useEffect(() => {
    const handleClick = (): void => {
      if (contextMenuProps.isVisible) {
        hideContextMenu()
      }
    }

    document.addEventListener('click', handleClick)

    return (): void => {
      document.removeEventListener('click', handleClick)
    }
  }, [contextMenuProps.isVisible, hideContextMenu])

  return { contextMenuProps, showContextMenu, hideContextMenu }
}
