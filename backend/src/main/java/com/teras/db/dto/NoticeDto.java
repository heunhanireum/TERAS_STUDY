package com.teras.db.dto;

import com.teras.db.entity.Notice;

import lombok.Data;

@Data
public class NoticeDto {
	private Long noticeNo;
	private String title;
	private String content;
	private String name;
	private String createdDate;
	private String uuid;

	public NoticeDto(Notice notice) {
		noticeNo = notice.getNoticeNo();
		title = notice.getTitle();
		content = notice.getContent();
		name = notice.getUser().getName();
		createdDate = notice.getCreatedDate().toString();
		if (notice.getAttach() != null)
			this.uuid = notice.getAttach().getUuid();
	}

}
