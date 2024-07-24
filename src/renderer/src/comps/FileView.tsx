import { dir } from "console"
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
	type: 'ADD_DIRS' | 'TOGGLE_EXPAND'
	payload?: any
}

function updateExplorerRecursively(dirs: DirItem[], parentDir: DirItem, subfolders?: DirItem[]): DirItem[] {
	return dirs.map(dir => {
		if(dir.path === parentDir.path) {
			const updatedDir = {
				...dir, 
				subfolders
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
		//since the function stops when a return is issued we know that by reaching here, nothing was found, which is--
		//-why we can return dir without any chagnes
		return dir
	})
}

//the state is managed automatically and there is no need to explicitly pass it to the function
function reducer(explorer: DirItem[], action: Action) {
	switch (action.type) {
		case 'ADD_DIRS':
			//convert recieved array back to an object so  we can properly add it to the explorer
			const dirToInsert = action.payload.res[0]
			console.log('dirToInsert is:', dirToInsert)

			const isPresent = (arr: DirItem[], targetPath: string): boolean => {
				for (const dir of arr) {
					console.log('first search')
					if (dir.path === targetPath) {
						return true
					} else if (dir.subfolders) {
						console.log('calling isPresent on sub directories')
						if (isPresent(dir.subfolders, targetPath)) {
							return true
						}
					}
				}
				//the function stops when a return is issued. reaching this point means the function--
				//--DID NOT find the value we're looking for, thus it's false
				return false
			}

			console.log('explorer is: ', explorer)
	
			let updatedExplorer: DirItem[]

			if (isPresent(explorer, dirToInsert.path)) {
				console.log('already exists, returning explorer AS IS')
				updatedExplorer = [...explorer]
			} else {
				console.log('doesnt exist yet, updating explorer')
				updatedExplorer = [
					...explorer, 
					dirToInsert
				]
			}

			return updatedExplorer //replace explorer with updatedExplorer
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

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
	}

	const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		try {
			//since the output of e.dataTransfer.files is rather odd, we need to arrange it, so GET_DETAILS can read it
			const droppedFiles = Array.from(e.dataTransfer.files).map(file => ({path: file.path}))
		
			//get res from electron API
			const res = await window.electron.ipcRenderer.invoke('GET_DETAILS', droppedFiles)

			//update explorer with dispatch
			dispatch({type: 'ADD_DIRS', payload: {res}})
		} catch (err) {
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const handleClick = async (type: string) => {
		try {
			setIsLoading(true)

			const selectedFiles = await window.electron.ipcRenderer.invoke('SELECT_DIR_DIALOG', type)
			const selectedFilesMod = selectedFiles.map(file => ({path: file}))
			
			const res = await window.electron.ipcRenderer.invoke('GET_DETAILS', selectedFilesMod)
			
			dispatch({type: 'ADD_DIRS', payload: {res}})
		} catch (err) {
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	//make sure page contents are not loaded until async ops are done!
	if (explorer.length === 0) {
		return <div onDragOver={handleDragOver} onDrop={handleDrop} style={{height:'200px', backgroundColor: 'lightblue'}}>
			<button onClick={() => handleClick('folder')}>pick folders</button>
			<button onClick={() => handleClick('file')}>pick files</button>
		</div>
	} else if (isLoading) {
    return <div>Loading...</div>
  } else {
		return (
			<div onDragOver={handleDragOver} onDrop={handleDrop} style={{height:'200px', backgroundColor: 'lightblue'}}>{renderDirTree(explorer)}</div>
		)
	}
}
