package com.teras.api.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.teras.api.request.StudyRoomRegisterPostReq;
import com.teras.common.util.DateFormatUtil;
import com.teras.db.entity.StudyRoom;
import com.teras.db.repository.StudyRoomRepository;

@Service
public class StudyRoomServiceimpl implements StudyRoomService {

	@Autowired
	StudyRoomRepository studyRoomRepository;

	@Override
	public List<StudyRoom> getStudyRoomList() {
		List<StudyRoom> list = studyRoomRepository.findAllByOrderByCreateDateDesc().get();
		return list;
	}

	@Override
	public StudyRoom createStudyRoom(StudyRoomRegisterPostReq registerInfo) {
		System.out.println(registerInfo.getSessionId());
		StudyRoom studyRoom = StudyRoom.builder().sessionId(registerInfo.getSessionId())
				.roomName(registerInfo.getRoomName()).createDate(DateFormatUtil.now()).build();
		
		return studyRoomRepository.save(studyRoom);
	}

	@Override
	public void deleteStudyRoom(String sessionId) {
		StudyRoom studyRoom = studyRoomRepository.findBySessionId(sessionId).get();
		studyRoomRepository.delete(studyRoom);
	}

}
