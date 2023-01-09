package com.teras.api.service;

import java.util.List;

import com.teras.db.dto.AttendanceDto;
import com.teras.db.entity.Attendance;

public interface AttendanceService {
	AttendanceDto getAttendance(String userId);
	List<AttendanceDto> getAttendance(String userId, int month);
	Attendance putAttendance(String userId, int state);
}
