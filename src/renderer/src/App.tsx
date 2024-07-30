import FileView from './comps/FileView'
import FileViewPrefs from './comps/FileViewPrefs'
import ActionPane from './comps/ActionPane'
import MainNavbar from './comps/MainNavbar'

export default function App(): JSX.Element {
  return (
    <div className="w-screen h-screen p-2">
      <MainNavbar />
      <div className="w-full h-[80%] p-2 bg-blue-300">
        <FileViewPrefs />
        <FileView />
      </div>
      <ActionPane />
    </div>
  )
}
