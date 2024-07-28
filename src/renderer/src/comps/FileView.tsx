import { useEffect, useState } from "react"
import { DirItem } from '../types'
import { useExplorer } from "@renderer/ctx/ExplorerContext"

export default function FileView(): JSX.Element {
	const { explorer, dispatch } = useExplorer()
	const [isLoading, setIsLoading] = useState(true)

	const toggleExpand = async (dirToToggle: DirItem) => {
		try {
			setIsLoading(true)

			//toggle clickedDir
			dispatch({type: 'TOGGLE_EXPAND', payload: {dirToToggle}})

			//expand/collapse dir
			//in the future u can pass the dir alone, which I presume will save CPU... 
			const subfolders = await window.electron.ipcRenderer.invoke('TOGGLE_EXPAND', dirToToggle)
			
			//update explorer
			dispatch({type: 'TOGGLE_EXPAND', payload: {parentDir: dirToToggle, subfolders}})
		} catch (err) {
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
	}

	const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		try {
			//since the output of e.dataTransfer.files is rather odd, we need to arrange it, so GET_DETAILS can read it
			const droppedFiles = Array.from(e.dataTransfer.files).map(file => ({path: file.path}))
			console.log('dropped files are', droppedFiles)
		
			//get res from electron API
			const res = await window.electron.ipcRenderer.invoke('GET_DETAILS', droppedFiles)
			console.log('detailed dropped files are', res)

			//update explorer with dispatch
			dispatch({type: 'ADD_DIRS', payload: {res}})
		} catch (err) {
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const handleClick = async (type: string) => {
		try {
			setIsLoading(true)

			const selectedFiles = await window.electron.ipcRenderer.invoke('SELECT_DIR_DIALOG', type)
			const selectedFilesMod = selectedFiles.map(file => ({path: file}))
			
			const res = await window.electron.ipcRenderer.invoke('GET_DETAILS', selectedFilesMod)
			
			dispatch({type: 'ADD_DIRS', payload: {res}})
		} catch (err) {
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const renderDirTree = (dirsToRender: DirItem[]) => {
		const folders = dirsToRender.filter(dir => dir.type === 'folder')
		const files = dirsToRender.filter(dir => dir.type === 'file')
		
		return (
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Size</th>
					</tr>
				</thead>
				<tbody>
						{folders.map(folder => (
							<tr key={folder.path}>
								<td>{folder.path}</td>
							</tr>
						))}
					{files.map(file => (
						<tr key={file.path}>
							{/*although file.metadata will always exist, we have to check for it's existance to ts proof our code
							we cannot  do it in types.ts since metadata does not exist before getDetails is done*/}
							{file.metadata && Object.entries(file.metadata).map(([key, value]) => (
								<td key={key}>{value !== undefined ? value : 'undefined'}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		)
	}

	useEffect(() => {
		console.log('file explorer was just updated to', explorer)
	}, [explorer])

	//make sure page contents are not loaded until async ops are done!
	if (explorer.length === 0) {
		return <div onDragOver={handleDragOver} onDrop={handleDrop} className="w-full h-[90%] p-2 border-white border-2 border-solid flex justify-center items-center">
			<button onClick={() => handleClick('folder')} className="m-2 p-3 bg-green-200">pick folders</button>
			<button onClick={() => handleClick('file')} className="m-2 p-3 bg-green-200">pick files</button>
		</div>
	} else if (isLoading) {
    return <div className="w-full h-[90%] p-2 border-white border-2 border-solid flex justify-center items-center">Loading...</div>
  } else {
		return (
			<div onDragOver={handleDragOver} onDrop={handleDrop} className="w-full h-[90%] p-2 border-white border-2 border-solid">{renderDirTree(explorer)}</div>
		)
	}
}
