package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.AttendanceDto;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("AttendanceMonthGetRes")
public class AttendanceMonthGetRes extends BaseResponseBody{
	List<AttendanceDto> list;
	
	public static AttendanceMonthGetRes of(Integer statusCode, String message, List<AttendanceDto> list) {
		AttendanceMonthGetRes res = new AttendanceMonthGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setList(list);
		return res;
	}
}
