import { ipcMain, dialog } from 'electron'
import fs from 'fs' //because we use promises, I forgot before
import path from 'path'
import iconv from 'iconv-lite'
import jschardet from 'jschardet'
import { DirItem } from '../renderer/src/types' //import the type interface so I can use it in handlers

export default function setupIPC(): void {
  ipcMain.handle('GET_DETAILS', handleGetDetails)
  ipcMain.handle('TOGGLE_EXPAND', handleToggleExpand)
  ipcMain.handle('SELECT_DIR_DIALOG', handleSelectDirDialog)
}

async function handleGetDetails(event, dirsToDetail: DirItem[] | []) {
	return Promise.allSettled(dirsToDetail.map(dir => {
		//console log here for debugging, this solution currently DOES NOT work
		const detection = jschardet.detect(dir.path)

		const decodedPath = iconv.decode(Buffer.from(dir.path, 'binary'), detection.encoding)

		const decodedDir = {
			...dir, 
			path: decodedPath
		}

		return getItemDetails(decodedDir)
	}))
	.then(results => {
		const updatedDirsToDetail = results.map((result, index) => {
			if (result.status === 'fulfilled') {
				//if the value is okay, insert it to the array in the proper location
				return {...dirsToDetail[index], ...result.value}
			} else {
				//if it's not, don't insert it (avoid nulls this)
				console.error(`Error processing dir ${index}:`, result.reason);
				return dirsToDetail[index]; // Return original item if there was an error
			}
		})
		return updatedDirsToDetail
	})
	.catch(err => {
		console.error('Error in GET_DETAILS handler:', err);
		throw err; // Re-throw the error to be handled by the caller
	})
}

async function handleToggleExpand (event, dirToToggle: DirItem): Promise<DirItem[]> {
	//dirToToggle must be passed as a whole to index.ts since we need to check the value of isExpanded
	console.log(dirToToggle)
	try {
		if(!dirToToggle.isExpanded) {
			//find subfolders
			const subfolders = await fs.promises.readdir(dirToToggle.path)
			
			//create a path value for each dir
			const expandedDirToToggle = subfolders.map(dir => ({path: path.join(dirToToggle.path, dir)}))

			//detail each path item, since we're inside try{} and not .then() we need to use await
			const detailedExpandedDirToToggle = await Promise.allSettled(expandedDirToToggle.map(dir => {
				return getItemDetails(dir)
			})).then(results => results.map((result, index) => {
					if (result.status === 'fulfilled') {
						return {...expandedDirToToggle[index], ...result.value}
					} else {
						console.error('Error calling detail from TOGGLE_EXPAND')
						return expandedDirToToggle[index]
					}
				})
			).catch(err => {
				console.error('Error in TOGGLE_EXPAND detailing handler:', err);
				throw err;
			})

			return detailedExpandedDirToToggle
		} else {
			console.log('dirToToggle is not expanded')
		}
	} catch (err) {
		console.error(err)
		//don't forget to delete subfolders here!!!
	}
}

async function handleSelectDirDialog(event, type: string) {
	const res = await dialog.showOpenDialog({
		properties: [type === 'folder' ? 'openDirectory' : 'openFile', 
			'multiSelections'
		]
	})

	if (res.canceled) {
		return null
	} else {
		return res.filePaths
	}
}

async function getItemDetails(dir: DirItem) {
	console.log('items to detail are', dir)
	try {
		const stats = await fs.promises.stat(dir.path);
	
		//different stats for folders and for files (and for symlinks in the future)
		if (stats.isDirectory()) {
			return {
				...dir,
				type: 'folder',
				isExpanded: false, 
				metadata: {
					name: path.basename(dir.path), //this is how we get the name of a folder
					size: stats.size //improvements required - display sized of subcontents for folders and show mb/kb/gb etc
				}
			}
		} else if (stats.isFile()) {
			return {
				...dir, 
				type: 'file', 
				metadata: {
						name: path.basename(dir.path),
						size: stats.size
					}
			}
		}
	} catch (err) {
		console.error(`Couldn't detail ${dir.path}`);
		return null //null will appear anyways, I'm gonna filter it in the expand functino above
	}
}