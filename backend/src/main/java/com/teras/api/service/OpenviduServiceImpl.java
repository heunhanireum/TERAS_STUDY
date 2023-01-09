package com.teras.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.gson.JsonObject;
import com.teras.api.request.OpenviduRegisterPostReq;
import com.teras.db.dto.OpenviduDto;
import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.Openvidu;
import com.teras.db.entity.User;
import com.teras.db.repository.ClassEntityRepository;
import com.teras.db.repository.OpenviduRepository;
import com.teras.db.repository.UserRepository;

@Service
public class OpenviduServiceImpl implements OpenviduService {

	@Autowired
	OpenviduRepository openviduRepository;

	@Autowired
	ClassEntityRepository classEntityRepository;

	@Autowired
	UserRepository userRepository;

	@Override
	public Openvidu createSession(OpenviduRegisterPostReq registerInfo, String userId) {
		ClassEntity classEntity = classEntityRepository.findByClassCode(registerInfo.getClassCode()).get();
		User user = userRepository.findByUserId(userId).get();

		Openvidu openvidu = Openvidu.builder().sessionId(registerInfo.getSessionId()).goal(registerInfo.getGoal())
				.subjectCode(user.getSubjectCode()).hostId(registerInfo.getHostId()).classCode(classEntity).build();

		return openviduRepository.save(openvidu);
	}


	@Override
    public void deletePost(String sessionId) {
		openviduRepository.deleteById(sessionId);
	}
	
	@Override
	public OpenviduDto searchOpenvidu(String sessionId) {
		OpenviduDto openviduDto = new OpenviduDto(openviduRepository.findById(sessionId).get());

		return openviduDto;
	}

}
