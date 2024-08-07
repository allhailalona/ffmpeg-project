import ReactDOM from 'react-dom/client'
import App from './App'
import { ExplorerProvider } from './ctx/ExplorerContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ExplorerProvider>
    <App />
  </ExplorerProvider>
)
