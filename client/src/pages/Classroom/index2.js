import React, { useEffect, useState } from "react";
import { Paper, Grid, Typography, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

function Classroom() {
  const [subject, setSubject] = useState();
  const [goal, setGoal] = useState();

  useEffect(() => {
    setSubject("3교시 - 영어");
    setGoal("p.91까지");
  }, []);

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
  }));

  return (
    <Grid container direction="column">
      <Grid
        item
        sx={{ height: 120 }}
        container
        justifyContent="space-around"
        alignItems="center"
      >
        <Grid item sx={{ textAlign: "center" }} xs={3}>
          <Paper
            sx={{
              width: 300,
              height: 80,
              borderRadius: 5,
              backgroundColor: "#16995A",
              textAlign: "center",
              display: "inline-block",
            }}
          ></Paper>
        </Grid>
        <Grid item sx={{ textAlign: "center" }} xs={9}>
          <Paper
            sx={{
              width: 900,
              height: 60,
              borderRadius: 5,
              textAlign: "center",
              display: "inline-block",
            }}
            elevation={3}
          >
            <Typography
              sx={{
                display: "inline-block",
                color: "#16995A",
              }}
              varient=""
            >
              오늘의 목표
            </Typography>
            <Typography sx={{ display: "inline-block" }} varient="">
              {goal}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      <Grid item>
        <Box
          sx={{
            height: 700,
            backgroundColor: "yellow",
          }}
        ></Box>
      </Grid>
      <Grid item>
        <Item>buttons</Item>
      </Grid>
    </Grid>
  );
}

export default Classroom;
