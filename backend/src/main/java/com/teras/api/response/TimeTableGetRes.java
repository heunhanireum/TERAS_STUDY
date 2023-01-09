package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.TimeTableDto;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@ApiModel("TimeTableGetRes")
public class TimeTableGetRes extends BaseResponseBody{
	List<Object> list;
	
	public static TimeTableGetRes of(Integer statusCode, String message, List<Object> list) {
		TimeTableGetRes res = new TimeTableGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setList(list);
		
		return res;
	}
}
