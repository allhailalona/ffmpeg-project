import { ipcMain, dialog, IpcMainInvokeEvent } from 'electron'
import fs from 'fs' //because we use promises, I forgot before
import path from 'path'
//import iconv from 'iconv-lite'
//import jschardet from 'jschardet'
import { DirItem } from '../types' //import the type interface so I can use it in handlers
import { getItemDetails } from './utils'

export default function setupIPC(): void {
  ipcMain.handle('GET_DETAILS', handleGetDetails)
  ipcMain.handle('TOGGLE_EXPAND', handleToggleExpand)
  ipcMain.handle('SELECT_DIR_DIALOG', handleSelectDirDialog)
  ipcMain.handle('BROWSE_OUTPUT_DIR', browseOutputDir)
}

async function handleGetDetails(
  _event: IpcMainInvokeEvent,
  dirsToDetail: DirItem[] | [],
  viewParams: string[]
): Promise<DirItem[]> {
  return Promise.allSettled(
    dirsToDetail.map((dir) => {
      //console log here for debugging, this solution currently DOES NOT work
      //notice how not only hebrew is problematic, node.js cannot process big centered dots as well
      //const detection = jschardet.detect(dir.path)

      //const decodedPath = iconv.decode(Buffer.from(dir.path, 'binary'), detection.encoding)

      //const decodedDir = {
      //	...dir,
      //	path: decodedPath
      //}

      //Pass viewParams here
      console.log('hello from handleGetDetails, calling getItemDetails for mapped item', dir.path)
      return getItemDetails(dir, viewParams)
    })
  )
    .then((results) => {
      const updatedDirsToDetail = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          //if the value is okay, insert it to the array in the proper location
          return { ...dirsToDetail[index], ...result.value }
        } else {
          //if it's not, don't insert it (avoid nulls this)
          console.error(`Error processing dir ${index}:`, result.reason)
          return dirsToDetail[index] // Return original item if there was an error
        }
      })
      return updatedDirsToDetail
    })
    .catch((err) => {
      console.error('Error in GET_DETAILS handler:', err)
      throw err // Re-throw the error to be handled by the caller
    })
}

async function handleToggleExpand(
  _event: IpcMainInvokeEvent,
  dirToToggle: DirItem,
  viewParams: string[]
): Promise<DirItem[] | DirItem | null> {
  //dirToToggle must be passed as a whole to index.ts since we need to check the value of isExpanded
  console.log(dirToToggle)
  try {
    if (!dirToToggle.isExpanded) {
      //find subfolders
      const subfolders = await fs.promises.readdir(dirToToggle.path)

      //create a path value for each dir
      const expandedDirToToggle = subfolders.map((dir) => ({
        path: path.join(dirToToggle.path, dir)
      }))

      //detail each path item, since we're inside try{} and not .then() we need to use await
      const detailedExpandedDirToToggle = await Promise.allSettled(
        expandedDirToToggle.map((dir) => {
          //pass viewParams here
          return getItemDetails(dir, viewParams)
        })
      )
        .then((results) =>
          results.map((result, index) => {
            if (result.status === 'fulfilled') {
              return { ...expandedDirToToggle[index], ...result.value }
            } else {
              console.error('Error calling detail from TOGGLE_EXPAND')
              return expandedDirToToggle[index]
            }
          })
        )
        .catch((err) => {
          console.error('Error in TOGGLE_EXPAND detailing handler:', err)
          throw err
        })

      return detailedExpandedDirToToggle
    } else {
      console.log('dirToToggle is not expanded')
      return dirToToggle
    }
  } catch (err) {
    console.error(err)
    return null
    //don't forget to delete subfolders here!!!
  }
}

async function handleSelectDirDialog(_event: IpcMainInvokeEvent, type: string): Promise<string[]> {
  const res = await dialog.showOpenDialog({
    properties: [type === 'folder' ? 'openDirectory' : 'openFile', 'multiSelections']
  })

  if (res.canceled) {
    return null
  } else {
    return res.filePaths
  }
}

async function browseOutputDir() {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result
}
