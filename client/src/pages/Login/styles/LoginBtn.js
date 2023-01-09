import styled from "styled-components";

const WhiteBtn = styled.button`
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 12px 0px;
  border-width: 0px;
  box-sizing: content-box;
  cursor: pointer;
  &: hover {
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.3);
  }
  margin: ${(props) => props.margin};
`;

const GreenBtn = styled.button`
  background-color: #e0ffc1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  padding: 0px;
  border-width: 0px;
  box-sizing: content-box;
  cursor: pointer;
  &: hover {
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.3);
  }
`;

export { GreenBtn, WhiteBtn };
