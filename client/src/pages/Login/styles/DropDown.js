import * as React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { styled } from "@mui/material/styles";
import { InputBase } from "@mui/material";

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(0.8),
  },
  "& .MuiInputBase-input": {
    maxheight: 30,
    borderRadius: 4,
    position: "relative",
    backgroundColor: "#ffffff",
    border: "1px solid #096c25",
    fontSize: 16,
    padding: "10px 26px 10px 12px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    // Use the system font instead of the default Roboto font.
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
    "&:focus": {
      borderRadius: 4,
      borderColor: "#096c25",
      boxShadow: "0 0 0 0.2rem rgba(9,108,37,.25)",
    },
  },
}));

export const DropDown = (props) => {
  const handleChange = (event) => {
    props.setValue(event.target.value); // 하위 컴포넌트에서 상위 컴포넌트로 값 전달
  };

  return (
    <Box sx={{ minWidth: 450 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">선택하세요</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          label="Role"
          onChange={handleChange}
          input={<BootstrapInput />}
        >
          <MenuItem value={"STUDENT"}>학생</MenuItem>
          <MenuItem value={"TEACHER"}>교사</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};
