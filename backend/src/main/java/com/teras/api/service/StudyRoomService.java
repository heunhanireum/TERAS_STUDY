package com.teras.api.service;

import java.util.List;

import com.teras.api.request.StudyRoomRegisterPostReq;
import com.teras.db.entity.StudyRoom;

public interface StudyRoomService {
	List<StudyRoom> getStudyRoomList();
	
	StudyRoom createStudyRoom(StudyRoomRegisterPostReq registerInfo);
	
	void deleteStudyRoom(String sessionId);
}
