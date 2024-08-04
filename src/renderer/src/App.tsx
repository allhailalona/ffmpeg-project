import FileView from './comps/FileView'
import ActionPane from './comps/ActionPane'
import MainNavbar from './comps/MainNavbar'

export default function App(): JSX.Element {
  return (
    <div className="w-screen h-screen p-2 bg-black">
      <MainNavbar />
      <FileView />
      <ActionPane />
    </div>
  )
}
