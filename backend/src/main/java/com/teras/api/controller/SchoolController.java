package com.teras.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.teras.api.request.ClassRegisterPostReq;
import com.teras.api.response.ClassRegisterPostRes;
import com.teras.api.response.ClassSearchGetRes;
import com.teras.api.response.SchoolSearchGetRes;
import com.teras.api.service.SchoolService;
import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.School;

@RestController
@RequestMapping("/school")
public class SchoolController {
	@Autowired
	SchoolService schoolService;
	
	@GetMapping()
	public ResponseEntity<? extends SchoolSearchGetRes> searchSchool(@RequestParam String schoolName) {
		List<School> list = schoolService.searchSchoolBySchoolName(schoolName);
		
		return ResponseEntity.status(200).body(SchoolSearchGetRes.of(200, "SUCCESS", list));
	}
	
	@PostMapping()
	public ResponseEntity<? extends ClassRegisterPostRes> registerClass(@RequestBody ClassRegisterPostReq registerInfo) {
		ClassEntity classEntity = schoolService.createClassEntity(registerInfo);
		
		return ResponseEntity.status(200).body(ClassRegisterPostRes.of(200, "SUCCESS", classEntity.getClassCode()));
	}
	
	@GetMapping("/class")
	public ResponseEntity<? extends ClassSearchGetRes> searchClass(@RequestParam String schoolCode) {
		List<ClassEntity> list = schoolService.searchClassBySchoolCode(schoolCode);
		
		return ResponseEntity.status(200).body(ClassSearchGetRes.of(200, "SUCCESS", list));
	}
}
