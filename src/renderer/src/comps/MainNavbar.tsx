import { TextField, Button, Box } from '@mui/material'
import { MainNavbarProps } from 'src/types'
import useExplorer from '@renderer/hooks/useExplorer'

export default function MainNavbar({ outputDir, setOutputDir }: MainNavbarProps): JSX.Element {
  const { dispatch } = useExplorer()

  const handleDirSelect = async (): Promise<void> => {
    try {
      const result = await window.electron.ipcRenderer.invoke('BROWSE_OUTPUT_DIR')
      if (!result.canceled && result.filePaths.length > 0) {
        setOutputDir!(result.filePaths[0])
      }
    } catch (error) {
      console.error('Error selecting directory:', error)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setOutputDir!(event.target.value)
  }

  const handleClearAllClick = (): void => {
    dispatch({ type: 'CLEAR_ALL', payload: undefined })
  }

  return (
    <Box
      sx={{
        height: '10%',
        bgcolor: 'green.200',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2, // Adds space between flex items
        padding: 2 // Adds padding inside the box
      }}
    >
      <Button
        onClick={handleClearAllClick}
        variant="contained"
        size="large"
        sx={{
          height: '100%',
          minWidth: 120,
          backgroundColor: 'red',
          color: 'white',
          '&:hover': {
            backgroundColor: 'darkred'
          }
        }} // Makes button height 100% of parent
      >
        Clear All
      </Button>
      <TextField
        label="Output Directory"
        variant="outlined"
        value={outputDir}
        onChange={handleInputChange}
        sx={{
          flexGrow: 1,
          '& .MuiInputBase-root': { height: '100%' } // Makes TextField height 100% of parent
        }}
      />
      <Button
        onClick={handleDirSelect}
        variant="contained"
        size="large"
        sx={{ height: '100%', minWidth: 120 }} // Makes button height 100% of parent
      >
        Browse
      </Button>
    </Box>
  )
}
