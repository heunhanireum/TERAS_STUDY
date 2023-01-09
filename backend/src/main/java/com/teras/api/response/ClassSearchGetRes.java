package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.entity.ClassEntity;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("ClassSearchGetRes")
public class ClassSearchGetRes extends BaseResponseBody {
	List<ClassEntity> list;

	public static ClassSearchGetRes of(Integer statusCode, String message, List<ClassEntity> list) {
		ClassSearchGetRes res = new ClassSearchGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setList(list);
		return res;
	}
}
