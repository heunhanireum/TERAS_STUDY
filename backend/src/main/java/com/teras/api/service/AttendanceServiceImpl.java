package com.teras.api.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.teras.common.util.DateFormatUtil;
import com.teras.db.dto.AttendanceDto;
import com.teras.db.entity.Attendance;
import com.teras.db.entity.User;
import com.teras.db.repository.AttendanceRepository;
import com.teras.db.repository.UserRepository;

@Service
public class AttendanceServiceImpl implements AttendanceService {

	@Autowired
	AttendanceRepository attendanceRepository;

	@Autowired
	UserRepository userRepository;

	@Override
	public AttendanceDto getAttendance(String userId) {
		User user = userRepository.findByUserId(userId).get();

		Attendance attendance = attendanceRepository
				.findByAttendanceId_UserIdAndAttendanceId_DateContains(user, DateFormatUtil.nowDate()).get().get(0);

		return new AttendanceDto(attendance);
	}

	@Override
	public List<AttendanceDto> getAttendance(String userId, int month) {
		User user = userRepository.findByUserId(userId).get();
		String date = DateFormatUtil.nowMonth(month);

		List<AttendanceDto> list = new ArrayList<>();

		for (Attendance attendance : attendanceRepository.findByAttendanceId_UserIdAndAttendanceId_DateContains(user, date).orElse(null)) {
			list.add(new AttendanceDto(attendance));
		}

		return list;
	}

	@Override
	public Attendance putAttendance(String userId, int state) {
		User user = userRepository.findByUserId(userId).get();
		Attendance attendance = attendanceRepository
				.findByAttendanceId_UserIdAndAttendanceId_DateContains(user, DateFormatUtil.nowDate()).get().get(0);
		
		attendance.update(state);
		
		return attendanceRepository.save(attendance);
	}

}
