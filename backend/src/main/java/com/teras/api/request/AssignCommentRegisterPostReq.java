package com.teras.api.request;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("AssignCommentRegisterPostReq")
public class AssignCommentRegisterPostReq {
	long assignNo;
	String content;
	String uuid;
}
