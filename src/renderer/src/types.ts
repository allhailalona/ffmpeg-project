/// <reference types="vite/client" />

export interface ExplorerContextType {
	explorer: DirItem[]
	dispatch: React.Dispatch<ExplorerAction>
}

export interface Metadata {
	name?: string
	size?: number
}
export interface DirItem {
	path: string
	type?: 'file' | 'folder'
	isExpanded?: boolean
	metadata?: Metadata
	subfolders?: DirItem[]
}

export type ExplorerAction = 
	| { type: 'ADD_DIRS'; payload: { res: DirItem[] } }
	| { type: 'TOGGLE_EXPAND'; payload: { dirToToggle?: DirItem; parentDir?: DirItem; subfolders?: DirItem[] } };