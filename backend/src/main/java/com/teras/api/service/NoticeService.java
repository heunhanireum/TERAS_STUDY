package com.teras.api.service;

import java.util.List;

import com.teras.api.request.NoticeRegisterPostReq;
import com.teras.db.dto.NoticeDto;
import com.teras.db.entity.Notice;

public interface NoticeService {
	Notice createNotice(NoticeRegisterPostReq noticeRegisterInfo, String userId);
	
	List<NoticeDto> getNoticeList(String userId, int page);

	NoticeDto getNotice(long noticeNo);
	
	Boolean editNotice(long noticeNo, String userId, NoticeRegisterPostReq noticePostReq);
	
	Boolean deleteNotice(long noticeNo, String userId);
	
	int getNoticeListTotal(String userId);
}
