package com.teras.api.response;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.AttendanceDto;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("AttendanceNowGetRes")
public class AttendanceNowGetRes extends BaseResponseBody{
	AttendanceDto dto;
	
	public static AttendanceNowGetRes of(Integer statusCode, String message, AttendanceDto dto) {
		AttendanceNowGetRes res = new AttendanceNowGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setDto(dto);
		return res;
	}
}
