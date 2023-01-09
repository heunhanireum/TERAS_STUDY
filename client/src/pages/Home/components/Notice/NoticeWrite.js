// import React, { createRef, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Dropzone from "react-dropzone";
// import { FileIcon, defaultStyles } from "react-file-icon";
// import { useNavigate } from "react-router-dom";
// import styled from 'styled-components';
// import '@toast-ui/editor/dist/toastui-editor.css';
// import { Editor } from '@toast-ui/react-editor';
// import { writeNotice } from "api/notice";
// import { errorAlert, successAlert, warnAlert } from "modules/alert";
// import { logout } from "modules/user";

// const BtnContainer = styled.div`
//   display: flex;
//   margin-top: 1rem;
//   flex-direction: row;
//   justify-content: center;
//   width: 100%;
// `;

// const FileContainer = styled.div`
//   margin-top: 1rem;
//   .dropzone {
//     text-align: center;
//     padding: 20px;
//     border: 3px dashed #eeeeee;
//     background-color: #fafafa;
//     color: #bdbdbd;
//   }
//   .files {
//     margin-top: 0.5rem;
//     display: flex;
//     padding: 0rem 0.5rem;
//     .file {
//       display: flex;
//       border-radius: 5px;
//       border: 1px solid #e4e4e4;
//       padding: 0.2rem 0.4rem;
//       margin-right: 0.5rem;
//       .icon {
//         width: 0.7rem;
//         margin-right: 0.3rem;
//       }
//       .desc {
//         font-size: 0.9rem;
//         color: #666666;
//       }
//     }
//   }
// `;

// function NoticeWrite() {
//     const { user } = useSelector((state) => state.user );
//     const Navigate = useNavigate();
//     const editorRef = createRef();
//     const contentEmpty = `<p><br class="ProseMirror-trailingBreak"></p>`;
//     const dispatch = useDispatch();
//     const [isLoading, setIsLoading] = useState(true);
//     const [showModal, setShowModal] = useState(false);
//     const [modalMessage, setModalMessage] = useState("");
//     const [ data, setData ] = useState({
//         title: "",
//         content: "",
//         classCode: user.classCode,
//         userId: user.userId,
//         files: null,
//     });


//     const onRegister = () => {
//       if (
//         data.title &&
//         editorRef.current.getInstance().getHTML() !== contentEmpty &&
//         data.noticeNo
//       ) {
//         let formData = new FormData();
//         if (data.files) {
//           for (let i = 0; i < data.files.length; i++) {
//             formData.append("multipartFile", data.files[i]);
//           }
//         }
//         formData.append(
//           "noticeRegisterRequesDto",
//           new Blob(
//             [
//               JSON.stringify({
//                 title: data.title,
//                 content: editorRef.current.getInstance().getHTML(),
//                 classCode: state.userId.classCode,
//               }),
//             ],
//             { type: "application/json"}
//           )
//         );
//         writeNotice(formData)
//             .then(() => {
//               successAlert("공지사항 등록에 성공하였습니다.");
//               Navigate("/notice");
//             })
//             .catch((e) => {
//               if (e.response.status === 401) {
//                 errorAlert(401);
//                 dispatch(logout());
//               } else {
//                 errorAlert(e.response.status, "글 등록에 실패하였습니다.");
//               }
//             });
//     } else {
//       warnAlert(null, "제목과 내용, 구분을 모두 작성해주세요.")
//     }
//   };

//     const onCancle = () => {
//         const url = '/notice';
//         Navigate(url);
//       };

//     const handleDrop = (acceptedFiles) => {
//         setData({
//           ...data,
//           files: acceptedFiles.map((file) => file),
//         });
//       };
    
//     const makeExtension = (fileName) => {
//         let fileLength = fileName.length;
//         let fileDot = fileName.lastIndexOf(".");
//         let fileExtension = fileName
//           .substring(fileDot + 1, fileLength)
//           .toLowerCase();
//         return fileExtension;
//       };
    

//   return (
//     <div>
//         <h1>공지사항 작성하기</h1>
//         <InputContainer>
//             <Editor
//                 name="content"
//                 initialValue={data.content}
//                 previewStyle="tab"
//                 initialEditType="wysiwyg"
//                 useCommandShortcut={true}
//                 ref={editorRef} />
//         </InputContainer>
//         <FileContainer>
//             <Dropzone onDrop={handleDrop} className="dropzone">
//                 {({ getRootProps, getInputProps }) => (
//                     <div {...getRootProps({ className: "dropzone" })}>
//                         <input {...getInputProps()} />
//                         <p>첨부할 파일을 클릭 또는 드래그하여 올려주세요.</p>
//                     </div>
//                 )}
//             </Dropzone>
//             {data.files && (
//             <div className="files">
//                 {data.files.map((file) => (
//                 <div key={file.name}>
//                     <div className="file">
//                     <div className="icon">
//                         <FileIcon
//                         extension={makeExtension(file.name)}
//                         {...defaultStyles[makeExtension(file.name)]}
//                         />
//                     </div>
//                     <div className="desc">{file.name}</div>
//                     </div>
//                 </div>
//                 ))}
//             </div>
//             )}
//         </FileContainer>
//         <BtnContainer>
//         <button
//           name="글쓰기"
//           height="2.5rem"
//           onClick={onRegister}
//         />
//         <button
//           name="취소"
//           ml="1.5rem"
//           height="2.5rem"
//           bc="#C4C4C4"
//           hoverColor="#a2a2a2"
//           onClick={onCancle}
//         />
//       </BtnContainer>
//     </div>
//   )
// }

// export default NoticeWrite


import React, {useState} from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { registerNotice } from '../../../../api/notice'
import { errorAlert, successAlert } from '../../../../modules/alert'
import styled from 'styled-components';
import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/react-editor";

const InputContainer = styled.div`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  border-top: 1px solid #dadde6;
  select {
    width: 10rem;
    border: none;
    padding: 1rem 0.5rem;
    font-size: 1rem;
  }
  input {
    width: 100%;
    border: none;
    padding: 1rem 0.5rem;
    font-size: 1.2rem;
  }
`;

function NoticeWrite() {
  const Navigate = useNavigate()
  const [data, setData] = useState({
    title: "",
    content: "",
    classCode: "",
  })

  const onChange = (e) => {
    const {name, value} = e.target
    setData({
      ...data,
      [name]:value,
    })
  }

  const onSubmit = () => {

    // api요청에 data 실어서 보내기 (header값 필요하면 header 처리해서)
    registerNotice(data).then(() => {
      successAlert("글 등록에 성공하였습니다.");
      Navigate("/notice");
    })
    .catch((e) => {
      if (e.response.status === 401) {
        errorAlert(401);
      } else {
        errorAlert(e.response.status, "글 등록에 실패하였습니다.");
      }
    });
  }
    const onCancel = () => {
      Navigate("../")
    }


  return (
    <div>
      <h2>공지사항 작성하기</h2>
      {/* 제목 */}
      <InputContainer>
        <label for='title'></label>
        <input id='title' onChange={onChange}></input>
      </InputContainer>
      {/* 내용 */}
      <InputContainer>
        <label for='content'></label>
        <Editor 
        id='content' 
        onChange={onChange}
        ></Editor>
      </InputContainer>

      <button onClick={onCancel}>뒤로가기</button>
      <button onClick={onSubmit}>등록하기</button>
    </div>
  )
}

export default NoticeWrite