import { apiInstance, fileApi } from "./index";

const api = apiInstance();

export const registerNotice = async (content, success, fail) => {
    return await fileApi.post("/notice", content).then(success).catch(fail);
  };
  
  export const modifyNotice = async (content, success, fail) => {
    return await fileApi.put("/notice", content).then(success).catch(fail);
  };
  
  export const getNoticeTotalCount = async (success, fail) => {
    return await api.get("/notice").then(success).catch(fail);
  };
  
  export const getNoticeList = async (pageNumber, success, fail) => {
    return await api
      .get(`/notice/list/${pageNumber}`)
      .then(success)
      .catch(fail);
  };
  
  export const deleteNotice = async (noticeNo, success, fail) => {
    return await api
      .put(`/notice/delete/${noticeNo}`)
      .then(success)
      .catch(fail);
  };
  
  export const getNoticeDetail = async (noticeNo, success, fail) => {
    return await api.get(`/notice/${noticeNo}`).then(success).catch(fail);
  };