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

//the state is managed automatically and there is no need to explicitly pass it to the function
function reducer(explorer: DirItem[], action: Action) {
	switch (action.type) {
		case 'GET_DETAILS':
			console.log(action.payload)
			return action.payload
		case 'TOGGLE_EXPAND':
			if(action.payload.dirToToggle !== undefined) {
				action.payload.dirToToggle.isExpanded = !action.payload.dirToToggle.isExpanded
			} else if (action.payload.toggledDir !== undefined) {
				console.log('allhailhitler')
				console.log(action.payload.toggledDir)
			}
		default:
			return explorer
	}
}

const initDir: DirItem[] = [
	{path: "C:/Users/user/Desktop"},
	{path: "C:/Users/user/Documents"}
]

export default function FileView(): JSX.Element {
	//right now we use initDir for sake of example
	const [explorer, dispatch] = useReducer(reducer, initDir)
	const [isLoading, setIsLoading] = useState(true)

	//GET_DETAILS once the app runs, int he future this won't be the data I specified but the dropped paths
	useEffect(() => {
		const fetchDetails = async (): Promise<void> => {
			try {
				setIsLoading(true)
				const updatedExplorer = await window.electron.ipcRenderer.invoke('GET_DETAILS', explorer)
				dispatch({type: 'GET_DETAILS', payload: updatedExplorer})
			} catch (err) {
				console.error(err)
			} finally {
				setIsLoading(false)
			}
		}

		fetchDetails()
	}, [])

	const toggleExpand = async (dirToToggle: DirItem) => {
		try {
			setIsLoading(true)
			//toggle clickedDir
			dispatch({type: 'TOGGLE_EXPAND', payload: {dirToToggle: dirToToggle}})

			//expand/collapse dir
			const toggledDir = await window.electron.ipcRenderer.invoke('TOGGLE_EXPAND', dirToToggle)

			//update explorer 
			console.log('calling update dispatch')
			dispatch({type: 'TOGGLE_EXPAND', payload: {toggledDir: toggledDir}})
		} catch (err) {
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const renderDirTree = (dirToRender: DirItem[]) => {
		console.log(dirToRender)
		return dirToRender.map(dir => {
			if (dir.type === 'folder') {
				return <div key={dir.path}>
					<a onClick={() => toggleExpand(dir)}>{dir.isExpanded ? '>' : '<'}</a>
					{dir.metadata?.name || dir.path}
					{dir.isExpanded && dir.subfolders && (<div style={{marginLeft: '5px'}}>{renderDirTree(dir.subfolders)}</div>)}
				</div>
			} else if (dir.type === 'file') {
				return <div key={dir.path}>
					 {dir.metadata?.name || dir.path}
				</div>
			} 

			return null
		})
	}


	//make sure page contents are not loaded until async ops are done!
	//this is VERY important and can cause a variety of frustrating bugs
	if (isLoading) {
    return <div>Loading...</div>
  } else {
		return (
			<div>{renderDirTree(explorer)}</div>
		)
	}
}
