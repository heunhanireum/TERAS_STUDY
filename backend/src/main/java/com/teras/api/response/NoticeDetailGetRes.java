package com.teras.api.response;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.NoticeDto;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("NoticeDetailGetRes")
public class NoticeDetailGetRes extends BaseResponseBody{
	NoticeDto notice;
	
	public static NoticeDetailGetRes of(Integer statusCode, String message, NoticeDto notice) {
		NoticeDetailGetRes res = new NoticeDetailGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setNotice(notice);
		return res;
	}
}
