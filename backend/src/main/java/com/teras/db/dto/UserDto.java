package com.teras.db.dto;

import com.teras.db.entity.User;

import lombok.Data;

@Data
public class UserDto {
	String id;

	String name;

	String email;

	String phoneNumber;

	String schoolName;
	
	String classCode;
	
	String classNumber;
	
	String gradeNumber;
	
	String authority;
	
	String subjectCode;

	public UserDto(User user) {
		id = user.getUserId();
		name = user.getName();
		email = user.getEmail();
		phoneNumber = user.getPhoneNumber();
		classCode = user.getClassCode().getClassCode();
		authority = user.getAuthority().toString();
		gradeNumber = user.getClassCode().getGradeNumber();
		classNumber = user.getClassCode().getClassNumber();
		schoolName = user.getClassCode().getSchoolCode().getSchoolName();
		if(user.getSubjectCode()!= null)
			subjectCode = user.getSubjectCode().getSubjectCode();
	}
}
