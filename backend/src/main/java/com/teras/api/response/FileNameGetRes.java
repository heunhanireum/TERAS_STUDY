package com.teras.api.response;

import com.teras.common.model.response.BaseResponseBody;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@ApiModel("FileNameGetRes")
public class FileNameGetRes extends BaseResponseBody {
	String fileName;
	
	public static FileNameGetRes of(Integer statusCode, String message, String fileName) {
		FileNameGetRes res = new FileNameGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setFileName(fileName);
		return res;
	}
}
