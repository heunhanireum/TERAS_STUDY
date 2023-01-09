package com.teras.api.controller;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.teras.api.request.OpenviduPostReq;
import com.teras.api.request.OpenviduRegisterPostReq;
import com.teras.api.request.OpenviduRemoveUserReq;
import com.teras.api.response.OpenviduGetRes;
import com.teras.api.response.OpenviduPostRes;
import com.teras.api.service.OpenviduService;
import com.teras.common.auth.SsafyUserDetails;
import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.OpenviduDto;
import com.teras.db.entity.Openvidu;
import com.teras.db.repository.OpenviduRepository;

import io.openvidu.java.client.ConnectionProperties;
import io.openvidu.java.client.ConnectionType;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.Session;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import springfox.documentation.annotations.ApiIgnore;

@Api(value = "openvidu처리 API", tags = { "Openvidu." })
@RestController
@RequestMapping("/api/openvidu")
public class OpenviduController {

	// OpenVidu object as entrypoint of the SDK
	private OpenVidu openVidu;

	// Collection to pair session names and OpenVidu Session objects
	private Map<String, Session> mapSessions = new ConcurrentHashMap<>();
	// Collection to pair session names and tokens (the inner Map pairs tokens and
	// role associated)
	private Map<String, Map<String, OpenViduRole>> mapSessionNamesTokens = new ConcurrentHashMap<>();
	// Collection to pair session names and recording objects
	private Map<String, Boolean> sessionRecordings = new ConcurrentHashMap<>();

	// URL where our OpenVidu server is listening
	private String OPENVIDU_URL;
	// Secret shared with our OpenVidu server
	private String SECRET;

	@Autowired
	OpenviduService openviduService;

	@Autowired
	OpenviduRepository openviduRepository;

	@Autowired
	public OpenviduController(@Value("${openvidu.secret}") String secret,
			@Value("${openvidu.url}") String openviduUrl) {
		this.SECRET = secret;
		this.OPENVIDU_URL = openviduUrl;
		this.openVidu = new OpenVidu(OPENVIDU_URL, SECRET);
	}

	@PostMapping
	public ResponseEntity<? extends BaseResponseBody> registerSession(@ApiIgnore Authentication authentication,
			@RequestBody OpenviduRegisterPostReq registerInfo) {
		SsafyUserDetails userDetails = (SsafyUserDetails) authentication.getDetails();
		String userId = userDetails.getUsername();

		Openvidu openvidu = openviduService.createSession(registerInfo, userId);

		return ResponseEntity.status(200).body(BaseResponseBody.of(200, "SUCCESS"));
	}

	@GetMapping("/{sessionId}")
	public ResponseEntity<? extends BaseResponseBody> getOpenvidu(@PathVariable(name = "sessionId") String sessionId) {

		OpenviduDto openvidu = openviduService.searchOpenvidu(sessionId);

		return ResponseEntity.status(200).body(OpenviduGetRes.of(200, "SUCCESS", openvidu));
	}


	@DeleteMapping("/del/{sessionId}")
	public ResponseEntity<? extends BaseResponseBody> deleteOpenvidu(
			@PathVariable(name = "sessionId") String sessionId) {
		Optional<Openvidu> openvidu = openviduRepository.findBySessionId(sessionId);	

		if (openvidu.isPresent()) {
			openviduRepository.delete(openvidu.get());
			return ResponseEntity.status(200).body(BaseResponseBody.of(200, "SUCCESS"));
		} else {
			return ResponseEntity.status(500).body(BaseResponseBody.of(500, "DATA NOT EXIST"));
		}

	}

	
	


	
	



}