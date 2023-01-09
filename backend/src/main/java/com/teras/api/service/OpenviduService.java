package com.teras.api.service;

import com.google.gson.JsonObject;
import com.teras.api.request.OpenviduRegisterPostReq;
import com.teras.db.dto.OpenviduDto;
import com.teras.db.entity.Openvidu;


public interface OpenviduService {

	Openvidu createSession(OpenviduRegisterPostReq registerInfo, String userId);
	OpenviduDto searchOpenvidu(String sessionId);
	void deletePost(String sessionId);
}
