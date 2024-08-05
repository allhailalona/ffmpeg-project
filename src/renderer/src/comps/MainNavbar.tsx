import { TextField, Button, Box } from '@mui/material'
import { MainNavbarProps } from 'src/types'

export default function MainNavbar({ outputDir, setOutputDir }: MainNavbarProps): JSX.Element {
  const handleDirSelect = async (): Promise<void> => {
    try {
      const result = await window.electron.ipcRenderer.invoke('BROWSE_OUTPUT_DIR')
      if (!result.canceled && result.filePaths.length > 0) {
        setOutputDir(result.filePaths[0])
      }
    } catch (error) {
      console.error('Error selecting directory:', error)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setOutputDir(event.target.value)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        label="Output Directory"
        variant="outlined"
        value={outputDir}
        onChange={handleInputChange}
        sx={{ flexGrow: 1 }}
      />
      <Button variant="contained" onClick={handleDirSelect}>
        Browse
      </Button>
    </Box>
  )
}
