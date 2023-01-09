package com.teras.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.teras.api.response.ScoreLookUpGetRes;
import com.teras.api.service.ScoreLookUpService;
import com.teras.api.service.UserService;
import com.teras.common.auth.SsafyUserDetails;
import com.teras.db.dto.ScoreDto;
import com.teras.db.entity.User;

import lombok.AllArgsConstructor;
import springfox.documentation.annotations.ApiIgnore;

@AllArgsConstructor
@RestController
@RequestMapping("/score")
public class ScoreLookUpController {
	@Autowired
	ScoreLookUpService scoreLookUpService;
	
	@Autowired
	UserService userService;
	
	@GetMapping()
	public ResponseEntity<? extends ScoreLookUpGetRes> getScore(@ApiIgnore Authentication authentication) {
		SsafyUserDetails userDetails = (SsafyUserDetails)authentication.getDetails();
		String userId = userDetails.getUsername();
		User user = userService.getUserByUserId(userId);
		List<ScoreDto> list = scoreLookUpService.getScoreList(user);
		
		return ResponseEntity.status(200).body(ScoreLookUpGetRes.of(200, "SUCCESS", list));
	}
}
