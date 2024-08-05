import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { DirItem, ConvertFileParams, codecPrefs } from '../types'

//this file here handles the ffmpeg file conversion

const cpuCount: number = os.cpus().length

async function convertAudio({
  item,
  currentOutputDir,
  codecPrefs
}: ConvertFileParams): Promise<string> {
  console.log('hello from convertAudio', item, currentOutputDir, codecPrefs)
  const codec = codecPrefs.audio
  let outputFormat, audioCodec, outputOptions

  switch (codec) {
    case 'mp3':
      outputFormat = 'mp3'
      audioCodec = 'libmp3lame'
      outputOptions = ['-q:a 0', '-V 0', '-b:a 256k']
      break
    case 'aac':
      outputFormat = 'm4a'
      audioCodec = 'aac'
      outputOptions = ['-b:a 256k', '-vbr 5']
      break
    case 'opus':
      outputFormat = 'opus'
      audioCodec = 'libopus'
      outputOptions = [
        '-vbr on',
        '-b:a 256k',
        '-compression_level 10',
        '-frame_duration 20',
        '-application audio'
      ]
      break
    default:
      throw new Error(`Unsupported audio codec: ${codec}`)
  }

  const outputPath = path.join(
    currentOutputDir,
    `${path.basename(item.path, path.extname(item.path))}.${outputFormat}`
  )

  return new Promise((resolve, reject) => {
    ffmpeg(item.path)
      .audioCodec(audioCodec)
      .audioChannels(2)
      .outputOptions(outputOptions)
      .outputOptions('-threads', cpuCount)
      .toFormat(outputFormat)
      .on('error', reject)
      .on('end', () => resolve(outputPath))
      .save(outputPath)
  })
}

async function convertVideo({
  item,
  currentOutputDir,
  codecPrefs
}: ConvertFileParams): Promise<string> {
  console.log('hello from convertVideo', item, currentOutputDir, codecPrefs)
  const codec = codecPrefs.video
  let outputFormat, videoCodec, outputOptions

  switch (codec) {
    case 'av1':
      outputFormat = 'mp4'
      videoCodec = 'libaom-av1'
      outputOptions = ['-crf 23', '-cpu-used 0', '-row-mt 1']
      break
    case 'vp9':
      outputFormat = 'mkv'
      videoCodec = 'libvpx-vp9'
      outputOptions = ['-crf 23', '-b:v 0', '-deadline best', '-cpu-used 0']
      break
    case 'h265':
      outputFormat = 'mp4'
      videoCodec = 'libx265'
      outputOptions = ['-crf 23', '-preset veryslow']
      break
    default:
      throw new Error(`Unsupported video codec: ${codec}`)
  }

  const outputPath = path.join(
    currentOutputDir,
    `${path.basename(item.path, path.extname(item.path))}.${outputFormat}`
  )

  return new Promise((resolve, reject) => {
    ffmpeg(item.path)
      .videoCodec(videoCodec)
      .outputOptions(outputOptions)
      .outputOptions('-threads', cpuCount)
      .toFormat(outputFormat)
      .on('error', reject)
      .on('end', () => resolve(outputPath))
      .save(outputPath)
  })
}

async function convertImage({
  item,
  currentOutputDir,
  codecPrefs
}: ConvertFileParams): Promise<string> {
  console.log('hello from convertImage', item, currentOutputDir, codecPrefs)
  const codec = codecPrefs.image
  let outputFormat, outputOptions

  switch (codec) {
    case 'avif':
      outputFormat = 'avif'
      outputOptions = ['-crf 23', '-cpu-used 0']
      break
    case 'webp':
      outputFormat = 'webp'
      outputOptions = ['-lossless 1', '-q 90']
      break
    case 'jxl':
      outputFormat = 'jxl'
      outputOptions = ['-q 90']
      break
    default:
      throw new Error(`Unsupported image codec: ${codec}`)
  }

  const outputPath = path.join(
    currentOutputDir,
    `${path.basename(item.path, path.extname(item.path))}.${outputFormat}`
  )

  return new Promise((resolve, reject) => {
    ffmpeg(item.path)
      .outputOptions(outputOptions)
      .outputOptions('-threads', cpuCount)
      .toFormat(outputFormat)
      .on('error', reject)
      .on('end', () => resolve(outputPath))
      .save(outputPath)
  })
}

async function convertVideoTwoPass({
  item,
  currentOutputDir,
  codecPrefs
}: ConvertFileParams): Promise<string> {
  const codec = codecPrefs.video
  if (codec !== 'av1') {
    return convertVideo({item, currentOutputDir, codecPrefs})
  }

  const outputPath = path.join(
    currentOutputDir,
    `${path.basename(item.path, path.extname(item.path))}.mp4`
  )

  const baseOptions = [
    '-c:v libaom-av1',
    '-crf 23',
    '-b:v 0',
    '-cpu-used 0',
    '-row-mt 1',
    `-threads ${cpuCount}`
  ]

  return new Promise((resolve, reject) => {
    ffmpeg(item.path)
      .outputOptions(baseOptions)
      .outputOptions('-pass 1')
      .outputOptions('-f null')
      .output('/dev/null')
      .on('error', reject)
      .on('end', () => {
        ffmpeg(item.path)
          .outputOptions(baseOptions)
          .outputOptions('-pass 2')
          .output(outputPath)
          .on('error', reject)
          .on('end', () => resolve(outputPath))
          .run()
      })
      .run()
  })
}

export function getFileType(filePath: string): string {
  const extensionToTypeMap = {
    mp4: 'video',
    mkv: 'video',
    mov: 'video',
    avi: 'video',
    webm: 'video',
    mp3: 'audio',
    wav: 'audio',
    flac: 'audio',
    ogg: 'audio',
    opus: 'audio',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    bmp: 'image',
    webp: 'image'
    // Add more extensions and types as needed
  }
  const extension = path.extname(filePath).slice(1).toLowerCase()
  return extensionToTypeMap[extension] || 'unknown'
}

export async function convertExplorer(
  dirToConvert: DirItem[],
  codecPrefs: codecPrefs,
  outputDir: string
): Promise<void> {
  try {
    console.log('hello from convertExplorer', dirToConvert, codecPrefs, outputDir)
    fs.mkdirSync(path.join(outputDir, 'converted'), { recursive: true })

    const convertTo = async (items: DirItem[], currentOutputDir: string): Promise<void> => {
      console.log('hello from convertTo', items, currentOutputDir, 'codecPrefs are',  codecPrefs)
      await Promise.allSettled(
        items.map(async (item) => {
          if (item.type === 'folder' && item.subfolders) {
            const newOutputDir = path.join(currentOutputDir, item.metadata.name)
            await fs.promises.mkdir(newOutputDir, { recursive: true })
            console.log('created folder and now calling function again with', item.subfolders, newOutputDir)
            await convertTo(item.subfolders, newOutputDir)
          } else if (item.type === 'file') {
            const fileType = getFileType(item.path)
            try {
              switch (fileType) {
                case 'audio':
                  console.log('this is an audio file', item, currentOutputDir, codecPrefs)
                  await convertAudio({item, currentOutputDir, codecPrefs})
                  break
                case 'video':
                  if (codecPrefs.video === 'av1') {
                    await convertVideoTwoPass({item, currentOutputDir, codecPrefs})
                  } else {
                    await convertVideo({item, currentOutputDir, codecPrefs})
                  }
                  break
                case 'image':
                  await convertImage({item, currentOutputDir, codecPrefs})
                  break
                default:
                  console.log(`Unsupported file type: ${fileType}`)
              }
            } catch (error) {
              console.error(`Error converting ${item.path}: ${error.message}`)
            }
          }
        })
      )
    }

    console.log('passing', dirToConvert, path.join(outputDir, 'converted'), 'to covnertTo')
    await convertTo(dirToConvert, path.join(outputDir, 'converted'))
  } catch (err) {
    console.error('Error in convertExplorer function!', err)
  }
}
