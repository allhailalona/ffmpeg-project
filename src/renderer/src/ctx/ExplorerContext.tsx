import { createContext, useContext, useReducer} from "react";
import { DirItem, ExplorerAction, ExplorerContextType } from '../types'

const ExplorerContext = createContext<ExplorerContextType | undefined>(undefined)

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
			//convert recieved array back to an object so we can properly add it to the explorer
			const isPresent = (arr: DirItem[], targetDir: DirItem): boolean => {
				for (const dir of arr) {
					console.log('first search')
					if (dir.path === targetDir.path) {
						return true
					} else if (dir.subfolders) {
						console.log('calling isPresent on sub directories')
						if (isPresent(dir.subfolders, targetDir)) {
							return true
						}
					}
				}
				//the function stops when a return is issued. reaching this point means the function--
				//--DID NOT find the value we're looking for, thus it's false
				return false
			}

			//a fairly complex .reduce function I got from Claude and have no energy to understand
			const updatedExplorer = action.payload.res.reduce((acc: DirItem[], dir: DirItem) => {
        if (!isPresent(acc, dir)) {
            return [...acc, dir];
        }
        return acc;
    }, explorer);

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
	
	const values: ExplorerContextType = {explorer, dispatch}
	return (
		<ExplorerContext.Provider value={values}>
			{children}
		</ExplorerContext.Provider>
	)
}

//create a custom hook
export function useExplorer(): ExplorerContextType {
	const context = useContext(ExplorerContext)
	if (context === undefined) {
		throw new Error ('useExplorer must be used within an ExplorerPorvider')
	} else {
		return context
	}
}