package com.teras.api.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.teras.api.request.ClassRegisterPostReq;
import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.School;
import com.teras.db.repository.ClassEntityRepository;
import com.teras.db.repository.SchoolRepository;

@Service
public class SchoolServiceImpl implements SchoolService {
	@Autowired
	SchoolRepository schoolRepository;

	@Autowired
	ClassEntityRepository classEntityRepository;

	@Override
	public List<School> searchSchoolBySchoolName(String schoolName) {
		List<School> list = schoolRepository.findBySchoolNameContains(schoolName).orElse(null);
		return list;
	}

	@Override
	public List<ClassEntity> searchClassBySchoolCode(String schoolCode) {
		List<ClassEntity> list = classEntityRepository
				.findBySchoolCode(schoolRepository.findBySchoolCode(schoolCode).get()).orElse(null);
		return list;
	}

	@Override
	public ClassEntity createClassEntity(ClassRegisterPostReq registerInfo) {
		ClassEntity classEntity = ClassEntity.builder()
				.classCode(registerInfo.getSchoolCode() + registerInfo.getGradeNumber() + registerInfo.getClassNumber())
				.gradeNumber(registerInfo.getGradeNumber()).classNumber(registerInfo.getClassNumber())
				.schoolCode(schoolRepository.findBySchoolCode(registerInfo.getSchoolCode()).get()).build();
		
		return classEntityRepository.save(classEntity);
	}

}
