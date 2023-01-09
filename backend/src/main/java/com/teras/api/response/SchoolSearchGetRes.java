package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.entity.School;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SchoolSearchGetRes extends BaseResponseBody{
	List<School> list;
	
	public static SchoolSearchGetRes of(Integer statusCode, String message, List<School> list) {
		SchoolSearchGetRes res = new SchoolSearchGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setList(list);
		return res;
	}
}
