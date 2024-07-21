import { useEffect, useReducer } from "react"

interface DirItem {
	path: string
	type?: string
	isExpanded?: boolean
	metadata?: any[]
}

interface Action {
	type: 'GET_DETAILS' | 'TOGGLE_EXPAND'
	payload?: any
}

//the state is managed automatically and there is no need to explicitly pass it to the function
function reducer(explorer: DirItem[], action: Action) {
	switch (action.type) {
		case 'GET_DETAILS':
			//call GET_DETAILS
		case 'TOGGLE_EXPAND':
			//coming soon
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

	//GET_DETAILS once the app runs, int he future this won't be the data I specified but the dropped paths
	useEffect(() => {
		const fetchDetails = async () => {
			try {
				const updatedExplorer = await window.electron.ipcRenderer.invoke('GET_DETAILS', explorer)
				dispatch({type: 'GET_DETAILS', payload: updatedExplorer})
			} catch (err) {
				console.error(err)
			}
		}

		fetchDetails()
	})


	return (
		<div>FileView</div>
	)
}
