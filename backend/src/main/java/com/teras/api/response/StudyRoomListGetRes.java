package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.entity.StudyRoom;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@ApiModel("StudyRoomListGetRes")
public class StudyRoomListGetRes extends BaseResponseBody {
	List<StudyRoom> list;
	
	public static StudyRoomListGetRes of(Integer statusCode, String message, List<StudyRoom> list) {
		StudyRoomListGetRes res = new StudyRoomListGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setList(list);
		return res;
	}
}
