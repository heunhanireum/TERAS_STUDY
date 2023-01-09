import React, { useEffect, useState } from "react";
import { Paper, Grid, Typography } from "@mui/material";
import "./classroom.css";

function Classroom() {
  const [subject, setSubject] = useState();

  useEffect(() => {
    setSubject("3교시 - 영어");
  }, []);
  return (
    <div className="classroomFelxContainer">
      <div className="classroomGridContainer">
        <div className="header">
          <div className="subjectBox">{subject}</div>
          <div className="goalBox">
            <Paper
              sx={{
                width: 700,
                height: 60,
                borderRadius: 5,
              }}
              elevation={3}
            >
              <Grid
                container
                spacing={2}
                justifyContent="flex-start"
                alignItems="center"
              >
                <Grid item>
                  <Typography color="#16995A">오늘의 목표</Typography>
                </Grid>
                <Grid item>
                  <Typography>p.91까지</Typography>
                </Grid>
              </Grid>
            </Paper>
          </div>
        </div>
        <div className="videoContainer"></div>
        <div className="chatPanel"></div>
        <div className="footer"></div>
      </div>
    </div>
  );
}

export default Classroom;
