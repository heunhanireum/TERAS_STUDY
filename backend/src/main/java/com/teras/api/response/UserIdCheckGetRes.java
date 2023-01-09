package com.teras.api.response;

import com.teras.common.model.response.BaseResponseBody;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@ApiModel("UserIdCheckGetRes")
public class UserIdCheckGetRes extends BaseResponseBody {
	int flag;

	public static UserIdCheckGetRes of(Integer statusCode, String message, int flag) {
		UserIdCheckGetRes res = new UserIdCheckGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setFlag(flag);
		return res;
	}
}
