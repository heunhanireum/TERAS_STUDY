import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import {
  NewRoot,
  BackForm,
  LoginContent,
  LogoForm,
  FlexRow1,
  LinkContainer,
} from "./styles/LoginStyle";
import { TextSmallInter } from "./styles/LoginText";

const SignUpFin = ({}) => {
  return (
    <NewRoot>
      <BackForm>
        <LoginContent>
          <LogoForm src={`https://file.rendit.io/n/hqghxg3SfioHvsa6lVy3.png`} />

          <Welcome>
            <TERASSTUDY color="#16995A">TERAS </TERASSTUDY>
            <TERASSTUDY color="#7FD958">STUDY</TERASSTUDY>
            <TERASSTUDY> 에 오신 것을 환영합니다.</TERASSTUDY>
          </Welcome>

          <FlexRow1>
            <LinkContainer>
              <Link
                to={"/login"}
                style={{ textDecoration: "none", color: "black" }}
              >
                <TextSmallInter>로그인하기</TextSmallInter>
              </Link>
            </LinkContainer>
          </FlexRow1>
        </LoginContent>
      </BackForm>
    </NewRoot>
  );
};

const Welcome = styled.div`
  height: 37px;
  width: 450px;
  margin: 50px 0px 140px 0px;
  white-space: pre-wrap;
  text-align: center;
`;
const TERASSTUDY = styled.div`
  font-size: 24px;
  font-family: GangwonEduAll OTF;
  font-weight: 500;
  display: contents;
  color: ${(props) => props.color};
`;
export default SignUpFin;
