package com.teras.api.response;

import com.teras.common.model.response.BaseResponseBody;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("ClassRegisterPostRes")
public class ClassRegisterPostRes extends BaseResponseBody {
	String classCode;
	
	public static ClassRegisterPostRes of(Integer statusCode, String message, String classCode) {
		ClassRegisterPostRes res = new ClassRegisterPostRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setClassCode(classCode);
		return res;
	}
}
