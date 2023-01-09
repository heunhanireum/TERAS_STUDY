import "./App.css";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/index";
import UserLogin from "./pages/Login/UserLogin";
import SignUp from "./pages/Login/SignUp";
import SignUpFin from "./pages/Login/SignUpFin";
import Classroom from "./pages/Classroom/index";

function App() {
  const [user, setUser] = useState();

  //const logout = () => setUser(null);

  return (
    <Router>
      <Routes>
        {/* home이랑 userlogin이 같은 곳에 달려있다. 홈에서 accessToken이 없을때 로그인페이지로 redirect 되게 만들어야 된다. */}
        <Route
          path="/*"
          element={
            localStorage.getItem("accessToken") ? <Home /> : <UserLogin />
          }
        />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signupfin" element={<SignUpFin />} />
        <Route path="/classroom" element={<Classroom />} />
      </Routes>
    </Router>
  );
}

export default App;
