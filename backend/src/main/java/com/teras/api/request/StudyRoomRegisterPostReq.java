package com.teras.api.request;

import io.swagger.annotations.ApiModel;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("StudyRoomRegisterPostReq")
public class StudyRoomRegisterPostReq {
	String sessionId;
	String roomName;
}
