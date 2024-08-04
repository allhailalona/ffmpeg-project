import { useReducer } from "react"
import { Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material'

const initialState = {
  convertedAudioFormat: '',
  convertedVideoFormat: '',
  convertedImageFormat: ''
}

function reducer(state, action) {
  switch(action.type) {
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
};

export default function ActionPane(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState)

  const handleSelectChange = (e) => {
    dispatch({
      type: 'SET_DROPDOWN',
      payload: {name: e.target.name, value: e.target.value}
    })
  }

  const handleConvertClick = () => {

  }
  
  return (
    <div className="w-full flex flex-row items-center bg-zinc-200">
      <div className="w-[10%] flex items-center">
        Output Format:
      </div>
      <div className="w-[80%] flex justify-around items-center">
        <FormControl margin="normal">
          <InputLabel>Audio output format:</InputLabel>
          <Select
            name="convertedAudioFormat"
            value={state.convertedAudioFormat}
            onChange={handleSelectChange}
            label="convertedAudioFormat"
            sx={selectStyle}
          >
            <MenuItem value="opus">opus</MenuItem>
            <MenuItem value="mp3">mp3</MenuItem>
          </Select>
        </FormControl>

        <FormControl margin="normal">
          <InputLabel>Video Output Format:</InputLabel>
          <Select
            name="convertedVideoFormat"
            value={state.convertedVideoFormat}
            onChange={handleSelectChange}
            label="convertedVideoFormat"
            sx={selectStyle}
          >
            <MenuItem value="av1">av1</MenuItem>
            <MenuItem value="mp4">mp4</MenuItem>
          </Select>
        </FormControl>

        <FormControl margin="normal">
          <InputLabel>Image output format:</InputLabel>
          <Select
            name="convertedImageFormat"
            value={state.convertedImageFormat}
            onChange={handleSelectChange}
            label="convertedImageFormat"
            sx={selectStyle}
          >
            <MenuItem value="av1">av1</MenuItem>
            <MenuItem value="mp4">png</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className="flex items-center justify-right">
        <Button onClick={handleConvertClick} variant="contained" size="large">Convert!</Button>
      </div>
    </div>
    
  );
}
