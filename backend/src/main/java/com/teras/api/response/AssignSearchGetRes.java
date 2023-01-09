package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.AssignmentDto;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("AssignSearchGetRes")
public class AssignSearchGetRes extends BaseResponseBody{
	List<AssignmentDto> list;
	
	public static AssignSearchGetRes of(Integer statusCode, String message, List<AssignmentDto> list) {
		AssignSearchGetRes res = new AssignSearchGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setList(list);
		return res;
	}
}
