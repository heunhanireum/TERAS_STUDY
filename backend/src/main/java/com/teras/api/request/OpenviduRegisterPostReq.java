package com.teras.api.request;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("OpenviduRegisterPostReq")
public class OpenviduRegisterPostReq {
	String sessionId;
	String hostId;
	String goal;
	String classCode;
}
