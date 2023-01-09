package com.teras.db.dto;

import com.teras.db.entity.TimeTable;

import lombok.Data;

@Data
public class TimeTableDto {
	int day;
	int period;
	String subjectName;
	
	public TimeTableDto(TimeTable timeTable) {
		day = timeTable.getTimeTableId().getDay();
		period = timeTable.getTimeTableId().getPeriod();
		subjectName = timeTable.getSubjectCode().getSubjectName();
	}
}
