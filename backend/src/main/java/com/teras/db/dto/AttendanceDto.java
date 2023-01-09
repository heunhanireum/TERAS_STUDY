package com.teras.db.dto;

import com.teras.db.entity.Attendance;

import lombok.Data;

@Data
public class AttendanceDto {
	String date;
	int state;
	
	public AttendanceDto(Attendance attendance) {
		date = attendance.getAttendanceId().getDate();
		state = attendance.getStatement();
	}
}
