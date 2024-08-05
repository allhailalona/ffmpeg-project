import { useReducer } from 'react'
import { Select, MenuItem, FormControl, InputLabel, Button, Grid, Box } from '@mui/material'
import useExplorer from '@renderer/hooks/useExplorer'
import { CodecState, CodecAction, MainNavbarProps } from '../../../types'

const initialState = {
  convertedAudioCodec: '',
  convertedVideoCodec: '',
  convertedImageCodec: ''
}

function reducer(state: CodecState, action: CodecAction): CodecState {
  switch (action.type) {
    case 'SET_DROPDOWN':
      return { ...state, [action.payload.name]: action.payload.value }
    default:
      return state
  }
}

const selectStyle = {
  minWidth: 200,
  '.MuiSelect-select': {
    display: 'flex',
    alignItems: 'center'
  }
}

export default function ActionPane({ outputDir }: MainNavbarProps): JSX.Element {
  const [state, dispatch] = useReducer<React.Reducer<CodecState, CodecAction>>(
    reducer,
    initialState
  )

  const { explorer } = useExplorer()

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    dispatch({
      type: 'SET_DROPDOWN',
      payload: { name: e.target.name, value: e.target.value }
    })
  }

  const handleConvertClick = async (): Promise<void> => {
    try {
      await window.Electron.ipcRenderer.invoke(
        'CONVERT_EXPLORER',
        explorer,
        {
          audio: state.convertedAudioCodec,
          video: state.convertedVideoCodec,
          image: state.convertedImageCodec
        },
        outputDir
      )
    } catch (err) {
      console.error('Error in handleConvertClick', err)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '10%',
        bgcolor: 'red.300',
        display: 'flex',
        alignItems: 'center',
        p: 2 // Padding
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={2}>
          <Box>Output Codec:</Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Audio Output Codec:</InputLabel>
                <Select
                  name="convertedAudioCodec"
                  value={state.convertedAudioCodec}
                  onChange={handleSelectChange}
                  label="convertedAudioCodec"
                  sx={selectStyle}
                >
                  <MenuItem value="opus">opus</MenuItem>
                  <MenuItem value="mp3">mp3</MenuItem>
                  <MenuItem value="AAC">AAC</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Video Output Codec:</InputLabel>
                <Select
                  name="convertedVideoCodec"
                  value={state.convertedVideoCodec}
                  onChange={handleSelectChange}
                  label="convertedVideoCodec"
                  sx={selectStyle}
                >
                  <MenuItem value="AV1">AV1</MenuItem>
                  <MenuItem value="VP9">VP9</MenuItem>
                  <MenuItem value="H265">H265</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Image Output Codec:</InputLabel>
                <Select
                  name="convertedImageCodec"
                  value={state.convertedImageCodec}
                  onChange={handleSelectChange}
                  label="convertedImageCodec"
                  sx={selectStyle}
                >
                  <MenuItem value="AVIF">AVIF</MenuItem>
                  <MenuItem value="JXL">JPEG XL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={2} container justifyContent="flex-end">
          <Button onClick={handleConvertClick} variant="contained" size="large">
            Convert!
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}
