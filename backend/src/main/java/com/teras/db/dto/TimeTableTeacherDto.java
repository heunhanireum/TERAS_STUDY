package com.teras.db.dto;

import lombok.Data;

@Data
public class TimeTableTeacherDto {
	int day;
	int period;
	String gradeNumber;
	String classNumber;
	String classCode;
	
	public TimeTableTeacherDto(TimeTableTeacherInterface timeTalbeTeacherInterface) {
		day = timeTalbeTeacherInterface.getDay();
		period = timeTalbeTeacherInterface.getPeriod();
		gradeNumber = timeTalbeTeacherInterface.getGrade_Number();
		classNumber = timeTalbeTeacherInterface.getClass_Number();
		classCode = timeTalbeTeacherInterface.getClass_Code();
	}

	@Override
	public String toString() {
		return "TimeTableTeacherDto [day=" + day + ", period=" + period + ", gradeNumber=" + gradeNumber
				+ ", classNumber=" + classNumber + ", classCode=" + classCode + "]";
	}
}
