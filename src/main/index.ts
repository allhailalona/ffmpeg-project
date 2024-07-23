import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import fs from 'fs'
import { DirItem } from '../renderer/src/comps/FileView' //import the type interface so I can use it in handlers
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 350,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }

  })

  //open dev pane by default when on dev mode
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  //add your ipcHandlers here
  ipcMain.handle('alona', (event, value) => {
    console.log(value)
  })

  ipcMain.handle('GET_DETAILS', async (event, dirsToDetail: DirItem[] | []) => {
    console.log('welcome! dirsToDetail is ', dirsToDetail)
    //the problem Gal found was HERE! check on youtube how to use promise.all settler
    return Promise.allSettled(dirsToDetail.map(dir => {
      return getItemDetails(dir)
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
  })

  ipcMain.handle('TOGGLE_EXPAND', async (event, dirToToggle: DirItem): Promise<DirItem[]> => {
    //dirToToggle must be passed as a whole to index.ts since we need to check the value of isExpanded
    console.log(dirToToggle)
    try {
      if(!dirToToggle.isExpanded) {
        //find subfolders
        const subfolders = await fs.promises.readdir(dirToToggle.path)
        
        //create a path value for each dir
        const expandedDirToToggle = subfolders.map(dir => ({path: path.join(dirToToggle.path, dir)}))
        console.log('fuck', expandedDirToToggle)

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
  })

  async function getItemDetails(dir: DirItem) {
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

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
