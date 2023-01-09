import React, {useEffect, useState} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNoticeDetail } from '../../../../api/notice'
import { errorAlert } from '../../../../modules/alert';

function NoticeDetail() {
    const Navigate = useNavigate();
    const params = useParams();
    const [data, setData] = useState({
        noticeNo: "",
        title: "",
        content: "",
        files: "",
        classCode: "",
        createTime: "",
        updateTime: "",
        userId: "",
        name: "",
    });

    useEffect(() => {
        let noticeUserId = "";

        getNoticeDetail(params.noticeNo)
        .then((res) => {
            noticeUserId = res.data.userId;
            setData(res.data);
          }).catch((e) => {
            if (e.response.status === 401) {
              errorAlert(401);
            } else {
              errorAlert(e.response.status, "공지사항을 불러오지 못했습니다.");
            }
            Navigate("../");

        })
    })
  return (
    <div>
        <title>{data.title}</title>
        <div>{data.userId}</div>
        <div>{data.files}</div>
        <content>{data.content}</content>
    </div>
  )
}

export default NoticeDetail