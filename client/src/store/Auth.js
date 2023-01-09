import { createSlice } from "@reduxjs/toolkit";

export const TOKEN_TIME_OUT = 600 * 1000;

export const tokenSlice = createSlice({
  name: "authToken",
  initialState: {
    authenticated: false, // 로그인 여부
    accessToken: null, // JWT access token
    expireTime: null, // JWT access token의 만료시간
  },
  reducers: {
    // access token 정보 저장
    SET_TOKEN: (state, action) => {
      state.authenticated = true;
      state.accessToken = action.payload;
      state.expireTime = new Date().getTime() + TOKEN_TIME_OUT;
    },
    // 초기화
    DELETE_TOKEN: (state) => {
      state.authenticated = false;
      state.accessToken = null;
      state.expireTime = null;
    },
  },
});

export const { SET_TOKEN, DELETE_TOKEN } = tokenSlice.actions;

export default tokenSlice.reducer;
