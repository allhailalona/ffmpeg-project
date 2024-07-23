import { useState, useEffect, useReducer } from "react"

export interface Metadata {
	name?: string
	size?: number
}
export interface DirItem {
	path: string
	type?: string
	isExpanded?: boolean
	metadata?: Metadata
	subfolders?: DirItem[]
}

interface Action {
	type: 'GET_DETAILS' | 'TOGGLE_EXPAND'
	payload?: any
}

function updateExplorerRecursively(dirs: DirItem[], parentDir: DirItem, subfolders?: DirItem[]): DirItem[] {
	return dirs.map(dir => {
		if(dir.path === parentDir.path) {
			const updatedDir = {
				...dir, 
				subfolders: subfolders
			}
			console.log('found and added ', updatedDir)
			return updatedDir
		} else if (dir.subfolders && dir.isExpanded) {
			console.log('couldnt find in parent folders, searching in sub directories')
			return {
				...dir, 
				subfolders: updateExplorerRecursively(dir.subfolders, parentDir, subfolders)
			}
		}
		//if nothing was found
		return dir
	})
}

//the state is managed automatically and there is no need to explicitly pass it to the function
function reducer(explorer: DirItem[], action: Action) {
	switch (action.type) {
		case 'GET_DETAILS':
			console.log(action.payload.res)
			return action.payload.res
		case 'TOGGLE_EXPAND':
			if(action.payload.dirToToggle !== undefined) {
				//toggle dir upon click
				action.payload.dirToToggle.isExpanded = !action.payload.dirToToggle.isExpanded
			} else if (action.payload.parentDir !== undefined && action.payload.subfolders !== undefined) {
				//update explorer
				const result = updateExplorerRecursively(explorer, action.payload.parentDir, action.payload.subfolders)
				return result
			}
		default:
			return explorer
	}
}

export default function FileView(): JSX.Element {
	//right now we use initDir for sake of example
	const [explorer, dispatch] = useReducer(reducer, [])
	const [isLoading, setIsLoading] = useState(true)

	const toggleExpand = async (dirToToggle: DirItem) => {
		try {
			setIsLoading(true)

			//toggle clickedDir
			dispatch({type: 'TOGGLE_EXPAND', payload: {dirToToggle}})

			//expand/collapse dir
			//in the future u can pass the dir alone, which I presume will save CPU... 
			const subfolders = await window.electron.ipcRenderer.invoke('TOGGLE_EXPAND', dirToToggle)
			
			//update explorer
			dispatch({type: 'TOGGLE_EXPAND', payload: {parentDir: dirToToggle, subfolders}})

		} catch (err) {
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const renderDirTree = (dirToRender: DirItem[]) => {
		return dirToRender.map(dir => {
			if (dir.type === 'folder') {
				return <div key={dir.path}>
					<a onClick={() => toggleExpand(dir)}>{dir.isExpanded ? '^  ' : 'v  '}</a>
					{dir.metadata?.name || dir.path}
					{dir.isExpanded && dir.subfolders && (
							<div style={{marginLeft: '10px'}}>{renderDirTree(dir.subfolders)}</div>
            )}
				</div>
			} else if (dir.type === 'file') {
				return <div key={dir.path}>
					 {dir.metadata?.name || dir.path}
				</div>
			} 

			return null
		})
	}

	const handleDragHover = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
	}

	const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		try {
			//since the output of e.dataTransfer.files is rather odd, we need to arrange it, so GET_DETAILS can read it
			const droppedFiles = Array.from(e.dataTransfer.files).map(file => ({path: file.path}))
			console.log(droppedFiles)
		
			const res = await window.electron.ipcRenderer.invoke('GET_DETAILS', droppedFiles)
			console.log('res is', res)
			dispatch({type: 'GET_DETAILS', payload: {res}})
		} catch (err) {
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	//make sure page contents are not loaded until async ops are done!
	if (explorer.length === 0) {
		return <div onDragOver={handleDragHover} onDrop={handleDrop} style={{height:'200px', backgroundColor: 'lightblue'}}>drop files here</div>
	} else if (isLoading) {
    return <div>Loading...</div>
  } else {
		return (
			<div>{renderDirTree(explorer)}</div>
		)
	}
}
