package com.teras.api.service;

import java.util.List;

import com.teras.api.request.ClassRegisterPostReq;
import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.School;

public interface SchoolService {
	List<School> searchSchoolBySchoolName(String schoolName);

	List<ClassEntity> searchClassBySchoolCode(String schoolCode);
	
	ClassEntity createClassEntity(ClassRegisterPostReq registerInfo);
}
