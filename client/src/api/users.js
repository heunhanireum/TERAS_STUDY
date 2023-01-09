import { apiInstance } from "./index";
import axios from "axios";

const api = apiInstance();

export async function doLogin(user, success, fail) {
  await api.post(`/auth/login`, JSON.stringify(user)).then(success).catch(fail);
}

export async function signUp(user, success, fail){
  await api.post('/users', JSON.stringify(user)).then(success).catch(fail);
}

export const getSchool = async (params, success, fail) => {
  return await axios
    .get("https://open.neis.go.kr/hub/schoolInfo", { params })
    .then(success)
    .catch(fail);
};