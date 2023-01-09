package com.teras.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.teras.api.request.StudyRoomRegisterPostReq;
import com.teras.api.response.StudyRoomListGetRes;
import com.teras.api.service.StudyRoomService;
import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.entity.StudyRoom;


@RestController
@RequestMapping("/api/study-room")
public class StudyRoomController {

	@Autowired
	StudyRoomService studyRoomService;

	@PostMapping()
	public ResponseEntity<? extends BaseResponseBody> registerStudyRoom(
			@RequestBody StudyRoomRegisterPostReq registerInfo) {
		
		studyRoomService.createStudyRoom(registerInfo);

		return ResponseEntity.status(200).body(BaseResponseBody.of(200, "SUCCESS"));
	}

	@GetMapping()
	public ResponseEntity<? extends BaseResponseBody> getListStudyRoom() {

		List<StudyRoom> list = studyRoomService.getStudyRoomList();

		return ResponseEntity.status(200).body(StudyRoomListGetRes.of(200, "SUCCESS", list));
	}

	@DeleteMapping("/{sessionId}")
	public ResponseEntity<? extends BaseResponseBody> deleteStudyRoom(@PathVariable("sessionId") String sessionId) {

		studyRoomService.deleteStudyRoom(sessionId);

		return ResponseEntity.status(200).body(BaseResponseBody.of(200, "SUCCESS"));
	}
}
