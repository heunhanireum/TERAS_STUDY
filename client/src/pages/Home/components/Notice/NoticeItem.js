import React from 'react'
import { useNavigate } from 'react-router-dom'

function NoticeItem({data, index}) {
    const Navigate = useNavigate();

  return (
    <table onClick={() => Navigate(`./${data.noticeNo}`)}>
        <tbody>{index + 1}</tbody>
        <tbody>{data.title}</tbody>
        <tbody>{data.userName}</tbody>
        <tbody>{data.createdTime}</tbody>
    </table>
  );
};

export default NoticeItem