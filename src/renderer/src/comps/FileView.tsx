import { Fragment } from 'react'
import { DirItem } from '../../../types'
import ContextMenu from './ContextMenu'
import useExplorer from '../hooks/useExplorer'
import useContextMenu from '../hooks/useContextMenu'

export default function FileView(): JSX.Element {
  const { explorer, dispatch, viewParams } = useExplorer()
  const { contextMenuProps, showContextMenu } = useContextMenu()

  const toggleExpand = async (dirToToggle: DirItem): Promise<void> => {
    try {
      //toggle clickedDir
      dispatch({ type: 'TOGGLE_EXPAND', payload: { dirToToggle } })

      //Pass viewParams here
      const subfolders = await window.electron.ipcRenderer.invoke(
        'TOGGLE_EXPAND',
        dirToToggle,
        viewParams
      )

      //update explorer
      dispatch({
        type: 'TOGGLE_EXPAND',
        payload: { parentDir: dirToToggle, subfolders }
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault()
    try {
      //since the output of e.dataTransfer.files is rather odd, we need to arrange it, so GET_DETAILS can read it
      const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
        path: file.path
      }))
      console.log('dropped files are', droppedFiles)

      //Pass viewParams here
      const res = await window.electron.ipcRenderer.invoke('GET_DETAILS', droppedFiles, viewParams)
      console.log('detailed dropped files are', res)

      //update explorer with dispatch
      dispatch({ type: 'ADD_DIRS', payload: { res } })
    } catch (err) {
      console.error(err)
    }
  }

  const handleClick = async (type: string): Promise<void> => {
    try {
      const selectedFiles = await window.electron.ipcRenderer.invoke('SELECT_DIR_DIALOG', type)
      const selectedFilesMod = selectedFiles.map((file) => ({ path: file }))

      //Pass viewParams here
      const res = await window.electron.ipcRenderer.invoke(
        'GET_DETAILS',
        selectedFilesMod,
        viewParams
      )

      dispatch({ type: 'ADD_DIRS', payload: { res } })
    } catch (err) {
      console.error(err)
    }
  }

  const renderDirTree = (dirsToRender: DirItem[]): JSX.Element => {
    const renderFolders = (folder: DirItem, depth: number = 0): JSX.Element => {
      return (
        <Fragment key={folder.path}>
          <tr className="w-full">
            <td
              colSpan={viewParams.length}
              className="border-2 border-black"
              style={{ paddingLeft: `${depth * 8}px` }}
            >
              <span onClick={() => toggleExpand(folder)}>{folder.isExpanded ? '▼' : '▶'}</span>
              <span onDoubleClick={() => toggleExpand(folder)}>{folder.path}</span>
            </td>
          </tr>
          {folder.subfolders &&
            folder.isExpanded &&
            folder.subfolders.map((subDir) =>
              subDir.type === 'folder'
                ? renderFolders(subDir, depth + 1)
                : renderFiles(subDir, depth + 1)
            )}
        </Fragment>
      )
    }

    const renderFiles = (file: DirItem, depth = 0): JSX.Element => {
      return (
        <tr key={file.path} className="bg-green-300">
          {file.metadata &&
            Object.entries(file.metadata).map(([key, value], index) => (
              <td
                key={key}
                className="border-2 border-black"
                style={{ paddingLeft: index === 0 ? `${depth * 8}px` : '0' }}
              >
                {value !== undefined && value !== null ? value.toString() : 'undefined'}
              </td>
            ))}
        </tr>
      )
    }

    const folders = dirsToRender.filter((dir) => dir.type === 'folder')
    const files = dirsToRender.filter((dir) => dir.type === 'file')

    return (
      <div className="w-full h-full overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-red-300 z-10">
            <tr onContextMenu={showContextMenu} className="w-full">
              {viewParams.map((param) => (
                <th key={param} className="w-[50%] border border-black px-4 py-2">
                  {param}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-zinc-300">
            {folders.map((folder) => renderFolders(folder))}
            {files.map((file) => renderFiles(file))}
          </tbody>
        </table>
      </div>
    )
  }

  //make sure page contents are not loaded until async ops are done!
  if (explorer.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="w-full h-[80%] bg-blue-400 border-white border-2 border-solid flex justify-center items-center"
      >
        <button onClick={() => handleClick('folder')} className="m-2 p-3 bg-green-200">
          pick folders
        </button>
        <button onClick={() => handleClick('file')} className="m-2 p-3 bg-green-200">
          pick files
        </button>
      </div>
    )
  } else {
    return (
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="w-full h-[80%] bg-red-500 p-4 border-4 border-white"
      >
        {contextMenuProps.isVisible && (
          <ContextMenu x={contextMenuProps.x} y={contextMenuProps.y} />
        )}
        {renderDirTree(explorer)}
      </div>
    )
  }
}
