import { Dispatch, SetStateAction } from 'react'

/// <reference types="vite/client" />

export interface ExplorerContextType {
  explorer: DirItem[]
  dispatch: Dispatch<ExplorerAction>
  viewParams: string[] //for now!
  setViewParams: (value: SetStateAction<string[]>) => void
}

export interface DirItem {
  path: string
  type?: string //this here cannot be required since we recieve paths only from the various inputs
  isExpanded?: boolean
  metadata?: object
  subfolders?: DirItem[]
}

export type ExplorerAction =
  | { type: 'ADD_DIRS'; payload: { res: DirItem[] } }
  | {
      type: 'TOGGLE_EXPAND'
      payload: {
        dirToToggle?: DirItem
        parentDir?: DirItem
        subfolders?: DirItem[]
      }
    }

//////////////////////////////////////////ContextMenu types///////////////////////////////////////////////
export interface ContextMenuProps {
  isVisible: boolean
  x: number
  y: number
}

export interface UseContextMenuReturn {
  contextMenuProps: ContextMenuProps
  showContextMenu: (e: React.MouseEvent) => void
  hideContextMenu: () => void
}

export interface ContextMenuCompProps {
  //we use the Record to annotate object types ([key, value),--
  //--in this case the menu lable is a string, and the value is a function
  //void is used where the function won't return any value, like console.log in fucntion. in future--
  //--commits, the items' action will use window.electron.ipcInvoke so we'll need to change the return type
  items: Record<string, () => void>
  x: number
  y: number
}
