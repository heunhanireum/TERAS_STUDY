package com.teras.api.request;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("AssignRegisterPostReq")
public class AssignRegisterPostReq {
	String title;
	String content;
	String deadLine;
	String uuid;
}
