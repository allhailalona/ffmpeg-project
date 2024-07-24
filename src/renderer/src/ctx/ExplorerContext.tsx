import { createContext, useContext, useReducer} from "react";
import { DirItem, ExplorerAction } from '../types'

const ExplorerContext = createContext()

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
function reducer(explorer: DirItem[], action: ExplorerAction) {
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

export function ExplorerProvider({ children }) {
	const [explorer, dispatch] = useReducer(reducer, [])
	
	const values = {explorer, dispatch}
	return (
		<ExplorerContext.Provider value={values}>
			{children}
		</ExplorerContext.Provider>
	)
}

//create a custom hook
export function useExplorer() {
	const context = useContext(ExplorerContext)
	if (context === undefined) {
		throw new Error ('useExplorer must be used within an ExplorerPorvider')
	} else {
		return context
	}
}