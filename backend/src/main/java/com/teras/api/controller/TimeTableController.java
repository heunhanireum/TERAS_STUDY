package com.teras.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.teras.api.response.TimeTableGetRes;
import com.teras.api.service.TimeTableService;
import com.teras.common.auth.SsafyUserDetails;
import com.teras.db.dto.TimeTableDto;

import io.swagger.annotations.Api;
import springfox.documentation.annotations.ApiIgnore;

/**
 * �쑀�� 愿��젴 API �슂泥� 泥섎━瑜� �쐞�븳 而⑦듃濡ㅻ윭 �젙�쓽.
 */
@Api(value = "�쑀�� API", tags = { "User" })
@RestController
@RequestMapping("/timetable")
public class TimeTableController {
	@Autowired
	TimeTableService timeTableService;

	@GetMapping()
	public ResponseEntity<? extends TimeTableGetRes> getTimeTable(@ApiIgnore Authentication authentication) {
		SsafyUserDetails userDetails = (SsafyUserDetails) authentication.getDetails();
		String userId = userDetails.getUsername();

		List<Object> list = timeTableService.getTimeTable(userId);

		return ResponseEntity.status(200).body(TimeTableGetRes.of(200, "SUCCESS", list));

	}
}
