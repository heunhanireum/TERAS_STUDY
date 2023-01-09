package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.UserDto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@ApiModel("ClassmatesGetRes")
public class ClassmatesGetRes extends BaseResponseBody {
	@ApiModelProperty(name = "우리반 보기", example = "list[{user}, {user}, ...]")
	List<UserDto> list;
	int total;
	
	public static ClassmatesGetRes of(Integer statusCode, String message, List<UserDto> list, int total) {
		ClassmatesGetRes res = new ClassmatesGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setList(list);
		res.setTotal(total);
		return res;
	}
}
