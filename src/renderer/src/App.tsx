import { useState } from 'react'
import FileView from './comps/FileView'
import ActionPane from './comps/ActionPane'
import MainNavbar from './comps/MainNavbar'

export default function App(): JSX.Element {
  const [outputDir, setOutputDir] = useState('')

  return (
    <div className="w-screen h-screen p-2">
      <MainNavbar outputDir={outputDir} setOutputDir={setOutputDir} />
      <FileView />
      <ActionPane outputDir={outputDir} />
    </div>
  )
}
