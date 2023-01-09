import React from "react";
import { Route, Navigate } from "react-router-dom";

const RouteGuard = ({ component: Component, ...rest }) => {
  function hasJWT() {
    let authenticated = false;

    //check user has JWT token
    localStorage.getItem("accessToken")
      ? (authenticated = true)
      : (authenticated = false);

    return authenticated;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        hasJWT() ? (
          <Component {...props} />
        ) : (
          <Navigate to={{ pathname: "/login" }} />
        )
      }
    />
  );
};

export default RouteGuard;
