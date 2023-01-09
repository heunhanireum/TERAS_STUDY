import React, { useState } from "react";
import "./login.css";

import { doLogin } from "../../api/Users";

function LoginForm() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const handleClick = async () => {
    try {
      await doLogin(
        { id, password },
        (response) => {
          const accessToken = response.data.accessToken;

          alert(accessToken);
          localStorage.setItem("accessToken", accessToken);

          window.location.href = "/";
        },
        () => console.log("로그인 실패")
      );
    } catch (e) {
      alert("Failed to login");
      setId("");
      setPassword("");
    }
  };

  return (
    <div className="loginGridContainer">
      <h1>Login</h1>
      <input
        value={id}
        onChange={({ target: { value } }) => setId(value)}
        type="text"
        placeholder="id"
      />
      <input
        value={password}
        onChange={({ target: { value } }) => setPassword(value)}
        type="password"
        placeholder="password"
      />
      <button onClick={handleClick}>Login</button>
    </div>
  );
}

export default LoginForm;
