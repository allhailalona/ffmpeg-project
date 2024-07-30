import { useEffect, useState, Fragment } from "react"
import { DirItem } from '../../../types'
import ContextMenu from "./ContextMenu"
import useExplorer from '../hooks/useExplorer'
import useContextMenu from '../hooks/useContextMenu'

export default function FileView(): JSX.Element {
	const { explorer, dispatch, viewParams } = useExplorer()
	const [isLoading, setIsLoading] = useState(true)

	const { contextMenuProps, showContextMenu } = useContextMenu()

	const items = {
		cut: () => console.log('cut clicked'), 
		copy: 'copy', 
		paste: 'paste'
	}

	const toggleExpand = async (dirToToggle: DirItem) => {
		try {
			setIsLoading(true)

			//toggle clickedDir
			dispatch({type: 'TOGGLE_EXPAND', payload: {dirToToggle}})

			//Pass viewParams here
			const subfolders = await window.electron.ipcRenderer.invoke('TOGGLE_EXPAND', dirToToggle, viewParams)
			
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
		
			//Pass viewParams here
			const res = await window.electron.ipcRenderer.invoke('GET_DETAILS', droppedFiles, viewParams)
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

			//Pass viewParams here
			const res = await window.electron.ipcRenderer.invoke('GET_DETAILS', selectedFilesMod, viewParams)
			
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
		
		const renderFolders = (folder: DirItem, depth: number = 0) => {
  return (
    <Fragment key={folder.path}>
      <tr className="w-full border border-black">
        <td style={{ paddingLeft: `${depth * 20}px`}}>
          {/* You can use an icon here to indicate folder state */}
          <span onClick={() => toggleExpand(folder)}>{folder.isExpanded ? '▼' : '▶'}</span>
          <span onDoubleClick={() => toggleExpand(folder)}>{folder.path}</span>
        </td>
      </tr>
      {folder.isExpanded && folder.subfolders && folder.subfolders.map(subfolder => (
        renderFolders(subfolder, depth + 1)
      ))}
    </Fragment>
  )
}

		const renderFiles = (file: DirItem) => {
			return (
				<tr key={file.path} className="w-full">
					{/*although file.metadata will always exist, we have to check for it's existance to ts proof our code
					we cannot  do it in types.ts since metadata does not exist before getDetails is done*/}
					{file.metadata && Object.entries(file.metadata).map(([key, value]) => (
						<td key={key}>{value !== undefined && value !== null ? value.toString() : 'undefined'}</td>
					))}
				</tr>
			)
		}

		return (
			<table className="w-full"> 
				{contextMenuProps.isVisible && <ContextMenu items={items} x={contextMenuProps.x} y={contextMenuProps.y}/>}
				<thead className="w-full border-2 border-green-300">
					<tr key={'headers'} onContextMenu={showContextMenu} className="w-full">
						{viewParams.map(param => (
							<th key={param}>{param}</th>
						))}
					</tr>
				</thead>
				<tbody className="w-full bg-green-300 overflow-y-auto">
					{folders.map(renderFolders)}
					{files.map(renderFiles)}
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
