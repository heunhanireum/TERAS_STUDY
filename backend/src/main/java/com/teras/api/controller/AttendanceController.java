package com.teras.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.teras.api.response.AttendanceMonthGetRes;
import com.teras.api.response.AttendanceNowGetRes;
import com.teras.api.service.AttendanceService;
import com.teras.common.auth.SsafyUserDetails;
import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.AttendanceDto;

import io.swagger.annotations.Api;
import lombok.AllArgsConstructor;
import springfox.documentation.annotations.ApiIgnore;

@Api(value = "출석 API", tags = { "Attendance" })
@AllArgsConstructor
@RestController
@RequestMapping("/attendance")
public class AttendanceController {

	@Autowired
	AttendanceService attendanceService;

	@GetMapping
	public ResponseEntity<? extends BaseResponseBody> getAttendance(@ApiIgnore Authentication authentication) {
		SsafyUserDetails userDetails = (SsafyUserDetails) authentication.getDetails();
		String userId = userDetails.getUsername();

		AttendanceDto dto = attendanceService.getAttendance(userId);

		return ResponseEntity.status(200).body(AttendanceNowGetRes.of(200, "SUCCESS", dto));
	}

	@GetMapping("/{month}")
	public ResponseEntity<? extends BaseResponseBody> getAttendanceMonth(@ApiIgnore Authentication authentication,
			@PathVariable("month") int month) {
		SsafyUserDetails userDetails = (SsafyUserDetails) authentication.getDetails();
		String userId = userDetails.getUsername();

		List<AttendanceDto> list = attendanceService.getAttendance(userId, month);

		return ResponseEntity.status(200).body(AttendanceMonthGetRes.of(200, "SUCCESS", list));
	}

	@PutMapping("/{state}")
	public ResponseEntity<? extends BaseResponseBody> putAttendance(@ApiIgnore Authentication authentication,
			@PathVariable("state") int state) {
		SsafyUserDetails userDetails = (SsafyUserDetails) authentication.getDetails();
		String userId = userDetails.getUsername();
		
		attendanceService.putAttendance(userId, state);

		return ResponseEntity.status(200).body(BaseResponseBody.of(200, "SUCCESS"));
	}
}
