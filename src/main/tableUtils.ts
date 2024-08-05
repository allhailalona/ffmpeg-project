import fs from 'fs'
import path from 'path'
import { dialog } from 'electron'
import { DirItem } from '../types'

//this file here handles advanced table actions, like input filtering and auto expanding

function isMediaFile(filePath: string): boolean {
  const mediaExtensions = [
    '.mp3',
    '.wav',
    '.ogg',
    '.flac',
    '.opus',
    '.mp4',
    '.avi',
    '.mov',
    '.jpg',
    '.jpeg',
    '.jxl',
    '.png',
    '.gif',
    '.bmp'
  ]
  return mediaExtensions.includes(path.extname(filePath).toLowerCase())
}

export async function getItemDetails(dir: DirItem, viewParams: string[]): Promise<DirItem | null> {
  try {
    const stats = await fs.promises.stat(dir.path)
    const metadata = await handleGetMetadata(dir, stats, viewParams)

    if (stats.isDirectory()) {
      const subItems = await fs.promises.readdir(dir.path)
      const subDirs = await Promise.all(
        subItems.map((item) => getItemDetails({ path: path.join(dir.path, item) }, viewParams))
      )
      const validSubDirs = subDirs.filter((item) => item !== null)

      if (validSubDirs.length > 0) {
        console.log('folder with media detected')
        return {
          ...dir,
          type: 'folder',
          isExpanded: true,
          metadata: metadata,
          subfolders: validSubDirs
        }
      } else {
        return null
      }
    } else if (stats.isFile() && isMediaFile(dir.path)) {
      console.log('media file detected')

      return {
        ...dir,
        type: 'file',
        metadata: metadata
      }
    } else {
      return null
    }
  } catch (err) {
    console.error(`Couldn't detail ${dir.path}`, err)
    return null
  }
}

async function handleGetMetadata(
  dir: DirItem,
  stats: fs.Stats,
  viewParams: string[]
): Promise<Record<string, string | number> | null> {
  try {
    console.log('hello from handleGetMetadata recieved', dir)
    console.log('viewParams are', viewParams)
    const metadata: Record<string, string | number> = {}

    console.log('about to enter loop')
    for (const param of viewParams) {
      switch (param) {
        case 'name':
          metadata.name = path.basename(dir.path) || 'No name found'
          break
        case 'size':
          metadata.size = stats.size || 'No size found'
          break
      }
    }

    return metadata
  } catch (err) {
    console.error('Error in handleGetMetadata:', err)
    return null
  }
}

export async function browseOutputDir(): Promise<object> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  console.log(result)
  return result
}
