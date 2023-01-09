import React from "react";
import {Routes, Route} from 'react-router-dom'
import NoticeList from './NoticeList'
import NoticeWrite from './NoticeWrite'
import NoticeDetail from './NoticeDetail'

function main() {
  return (
  <div>
    <Routes>
      <Route path="" element={<NoticeList />} />
      <Route path="write" element={<NoticeWrite />} />
      <Route path="detail/:noticeNo" element={<NoticeDetail />} />
    </Routes>
  </div>);
}

export default main;
