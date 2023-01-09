package com.teras.api.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * 유저 회원가입 API ([POST] /api/v1/users) 요청에 필요한 리퀘스트 바디 정의.
 */
@Getter
@Setter
@ApiModel("UserRegisterPostRequest")
public class UserRegisterPostReq {
	@ApiModelProperty(name = "유저 ID", example = "your_id")
	String id;
	@ApiModelProperty(name = "유저 Password", example = "your_password")
	String password;
	@ApiModelProperty(name = "유저 이름", example = "your_name")
	String name;
	@ApiModelProperty(name = "유저 Email", example = "your@email.com")
	String email;
	@ApiModelProperty(name = "학교 Code", example = "B019274759")
	String ClassCode;
	@ApiModelProperty(name = "유저 PhoneNumber", example = "0110-0000-0000")
	String phoneNumber;
	@ApiModelProperty(name = "유저 Authority", example = "role_example")
	String authority;

}
