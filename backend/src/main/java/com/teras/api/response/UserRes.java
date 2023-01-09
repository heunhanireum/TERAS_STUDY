package com.teras.api.response;

import com.teras.db.dto.UserDto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * 회원 본인 정보 조회 API ([GET] /api/v1/users/me) 요청에 대한 응답값 정의.
 */
@Getter
@Setter
@ApiModel("UserResponse")
public class UserRes{
	@ApiModelProperty(name="User ID")
	UserDto user;
	
	public static UserRes of(UserDto user) {
		UserRes res = new UserRes();
		res.setUser(user);
		return res;
	}
}
