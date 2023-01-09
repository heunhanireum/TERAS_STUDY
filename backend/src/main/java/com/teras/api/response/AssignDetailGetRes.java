package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.AssignCommentDto;
import com.teras.db.dto.AssignmentDto;

import lombok.*;

@Setter
@Getter
public class AssignDetailGetRes extends BaseResponseBody {
	AssignmentDto assign;
	List<AssignCommentDto> list;

	public static AssignDetailGetRes of(Integer statusCode, String message, AssignmentDto assign, List<AssignCommentDto> list) {
		AssignDetailGetRes res = new AssignDetailGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setAssign(assign);
		res.setList(list);
		return res;
	}
}
