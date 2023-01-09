import React, { useState } from "react";
import "./home.css";
import TimeTable from "./components/Timetable/timetable";
import { Button } from "@mui/material";
import Main from "./components/Main/Main";
import Notice from "./components/Notice/Notice";
import Assignment from "./components/Assignment/Assignment";
import Grade from "./components/Grade/Grade";
import Schedule from "./components/Schedule/Schedule";
import StudyRoom from "./components/StudyRoom/StudyRoom";
import MyClass from "./components/MyClass/MyClass";
import Profile from "./components/Profile/Profile";
import { Route, Routes, NavLink } from "react-router-dom";


function Home() {
  const navTabs = [
    {
      name: "메인",
      component: <Main />,
      path: "/main"
    },
    {
      name: "공지",
      component: <Notice />,
      path: "/notice"

    },
    {
      name: "과제",
      component: <Assignment />,
      path: "/assignment"

    },
    {
      name: "성적",
      component: <Grade />,
      path: "/grade"

    },
    {
      name: "일정",
      component: <Schedule />,
      path: "/schedule"

    },
    {
      name: "스터디룸",
      component: <StudyRoom />,
      path: "/studyroom"

    },
    {
      name: "우리반",
      component: <MyClass />,
      path: "/myclass"

    },
  ];

  return (
    <div className="mainFlexContainer">
      <div className="mainGridContainer">
        <div className="headerGridContainer">
          <div className="logoContainer">
            <img src={"/Teras_logo_home.png"} alt="terasLogo" height="100" />
          </div>
          <div className="navBar"></div>
        </div>
        <div className="sideBarGridContainer">
          <div className="profileContainer">
            <Profile />
          </div>
          <div className="timeTableGridContainer">
            <div className="classRoomButtonContainer">
              {/* Link 써서 주소로보내기 */}
              {/*   ex.      <Link to="/signup" className="">회원가입</Link> */}
              <Button
                sx={{
                  width: 200,
                  height: 50,
                }}
                variant="contained"
              >
                강의실 입장
              </Button>
            </div>
            <div className="timeTableContainer">
              <TimeTable
                rows={["수학", "영어", "국어", "진로", "화학I", "체육", "도덕"]}
              />
            </div>
          </div>
        </div>
        <div className="dashBoardFlexContainer">
          <div className="dashBoardContainer">
            {/* tap 메뉴 div */}
            <div className="navTabContainer">
              {navTabs.map((tab, index) => (
                  <NavLink
                    className={({isActive}) => (isActive ? "navTabButton selectedTab": "navTabButton")}
                    key = {index}
                    to = {tab.path}
                    >
                      {tab.name}
                  </NavLink>
                ))}
            </div>
            {/* routing box */}
            <div className="componentContainer">
              <Routes>
                <Route path="main" element={<Main />} />
                <Route path="notice/*" element={<Notice />} />
                <Route path="assignment" element={<Assignment/>} />
                <Route path="grade" element={<Grade />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="studyroom" element={<StudyRoom />} />
                <Route path="myclass" element={<MyClass />} />
              </Routes>
            </div>

            {/* <div className="navTabContainer">
              {navTabs.map((tab, index) => (
                <button
                  className={`navTabButton ${
                    selected === index ? "selectedTab" : ""
                  }`}
                  key={index}
                  onClick={() => setSelected(index)}
                >
                  {tab.name}
                </button>
              ))}
            </div>
            <div className="componentContainer">
              {navTabs[selected].component}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
