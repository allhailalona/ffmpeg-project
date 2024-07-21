import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import fs from 'fs'
import { DirItem } from '../renderer/src/comps/FileView' //import the type interface so I can use it in handlers
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

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
  ipcMain.handle('GET_DETAILS', async (event, explorer: DirItem[]) => {
    try {
      const updatedExplorer = await Promise.all(explorer.map(getItemDetails));
      return updatedExplorer;
    } catch (err) {
      console.error('Error in GET_DETAILS handler:', err);
    }
  })

  ipcMain.handle('TOGGLE_EXPAND', async (event, dirToToggle: DirItem) => {
    //dirToToggle must be passed as a whole to index.ts since we need to check the value of isExpanded
    console.log('toggle detected')
    try {
      if(dirToToggle.isExpanded) {
        //find subfolders
        const subfolders = await fs.promises.readdir(dirToToggle.path)
        
        //convert the to path then assign them to the subfolders item in the dirToToggle object
        // Convert to path and assign to subfolders item in dirToToggle object
        const expandedDirToToggle = {
          ...dirToToggle,
          subfolders: await Promise.all(
            //pay close attention! this is how u apply a function to each and one of the items in a certain array then rewrite them
            subfolders.map(async (subfolder) => getItemDetails({ path: path.join(dirToToggle.path, subfolder) }))
          )
        };
        
        const filteredExpandedDirToToggle = expandedDirToToggle.subfolders.filter(dir => dir !== null)
        console.log(JSON.stringify(filteredExpandedDirToToggle, null, 2));

      } else {
        console.log('dirToToggle is not expanded')
      }
    } catch (err) {
      console.error(err)
    }
  })

  async function getItemDetails(dir: DirItem): Promise<DetailedDirItem> {
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
            size: stats.size
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
      console.error(`Couldn't detail ${dir.path}:`, err);
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
