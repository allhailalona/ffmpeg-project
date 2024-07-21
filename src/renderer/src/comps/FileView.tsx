import { useEffect, useReducer } from "react"

interface DirItem {
	path: string
	type?: string
	isExpanded?: boolean
	metadata?: any[]
}

interface Action {
	type: 'GET_DETAILS' | 'TOGGLE_EXPAND'
}

function reducer(explorer: dirItem[], action: Action) {
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

	return (
		<div>FileView</div>
	)
}
