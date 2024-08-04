import { useReducer } from 'react'
import { Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material'
import useExplorer from '@renderer/hooks/useExplorer'

const initialState = {
  convertedAudioCodec: '',
  convertedVideoCodec: '',
  convertedImageCodec: ''
}

function reducer(state, action) {
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

export default function ActionPane({ outputDir }): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState)

  const { explorer } = useExplorer()

  const handleSelectChange = (e) => {
    dispatch({
      type: 'SET_DROPDOWN',
      payload: { name: e.target.name, value: e.target.value }
    })
  }

  const handleConvertClick = async () => {
    try {
      const res = await window.electron.ipcRenderer.invoke('CONVERT_EXPLORER', 
        explorer, 
        {
          audio: state.convertedAudioCodec, 
          video: state.convertedVideoCodec, 
          image: state.convertedImageCodec,
        },
        outputDir
      );
    } catch (err) {
      console.error('Error in handleConvertClick', err);
    }
  };

  return (
    <div className="w-full flex flex-row items-center bg-zinc-200">
      <div className="w-[10%] flex items-center">Output Codec:</div>
      <div className="w-[80%] flex justify-around items-center">
        <FormControl margin="normal">
          <InputLabel>Audio output Codec:</InputLabel>
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

        <FormControl margin="normal">
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

        <FormControl margin="normal">
          <InputLabel>Image output Codec:</InputLabel>
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
      </div>
      <div className="flex items-center justify-right">
        <Button onClick={handleConvertClick} variant="contained" size="large">
          Convert!
        </Button>
      </div>
    </div>
  )
}
