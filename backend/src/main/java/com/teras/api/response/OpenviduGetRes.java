package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.AssignmentDto;
import com.teras.db.dto.OpenviduDto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class OpenviduGetRes extends BaseResponseBody{
	OpenviduDto openvidu;
	
	public static OpenviduGetRes of(Integer statusCode, String message, OpenviduDto openvidu) {
		OpenviduGetRes res = new OpenviduGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setOpenvidu(openvidu);
		return res;
	}
}
