package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.NoticeDto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@ApiModel("NoticeListGetRes")
public class NoticeListGetRes extends BaseResponseBody {
	@ApiModelProperty(name = "공지사항 목록", example = "list[{notice}, {notice}, ...]")
	List<NoticeDto> list;
	int total;

	public static NoticeListGetRes of(Integer statusCode, String message, List<NoticeDto> list, int total) {
		NoticeListGetRes res = new NoticeListGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setList(list);
		res.setTotal(total);
		return res;
	}
}
