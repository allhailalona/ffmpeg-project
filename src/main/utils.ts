import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { DirItem } from '../types'

export async function getItemDetails(dir: DirItem, viewParams: string[]) {
    try {
        const stats = await fs.promises.stat(dir.path);
    
        if (stats.isDirectory()) {
            console.log('folder detected')
            return {
                ...dir,
                type: 'folder',
                isExpanded: false, 
            }
        } else if (stats.isFile()) {
            console.log('file detected')
            console.log('calling getMetadata')
            const metadata = await handleGetMetadata(dir, stats, viewParams)
            console.log('metadata is', metadata)
            return {
                ...dir, 
                type: 'file', 
                metadata: metadata
            }
        } else {
            console.error('not a file nor a folder')
            return dir
        }
    } catch (err) {
        console.error(`Couldn't detail ${dir.path}`, err);
        return null
    }
}

async function handleGetMetadata(dir: DirItem, stats: fs.Stats, viewParams: string[]): Promise<Record<string, string | number> | null> {
    try {
        const metadata: Record<string, string | number> = {}

        for (const param of viewParams) {
            switch(param) {
                case 'name':
                    metadata.name = path.basename(dir.path)
                    break
                case 'title':
                    const res = await getMetadata(dir.path)
                    metadata.title = res.format?.tags?.title || 'No title'
                    break
                case 'size':
                    metadata.size = stats.size
                    break
            }
        }

        return metadata
    } catch (err) {
        console.error('Error in handleGetMetadata:', err)
        return null
    }
}

function getMetadata(targetPath: string): Promise<ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(targetPath, (err, metadata) => {
            if (err) {
                reject(err)
            } else {
                resolve(metadata)
            }
        })
    })
}