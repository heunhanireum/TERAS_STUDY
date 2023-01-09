package com.teras.api.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.teras.db.dto.TimeTableDto;
import com.teras.db.dto.TimeTableTeacherDto;
import com.teras.db.dto.TimeTableTeacherInterface;
import com.teras.db.entity.TimeTable;
import com.teras.db.entity.User;
import com.teras.db.repository.TimeTableRepository;
import com.teras.db.repository.UserRepository;

@Service
public class TimeTableServiceImpl implements TimeTableService {
	@Autowired
	UserRepository userRepository;

	@Autowired
	TimeTableRepository timeTableRepository;

	@Override
	public List<Object> getTimeTable(String userId) {
		User user = userRepository.findByUserId(userId).get();

		List<Object> list = new ArrayList<>();
		
		System.out.println(user.getAuthority().toString());

		if (user.getAuthority().toString() == "TEACHER") {
			for(TimeTableTeacherInterface timetableTeacherInterface : timeTableRepository.findByUserIdAndSubjectCode(user, user.getSubjectCode()).get()) {
				TimeTableTeacherDto dto = new TimeTableTeacherDto(timetableTeacherInterface);
				System.out.println(dto.toString());
				list.add(dto);
			}
		} else if (user.getAuthority().toString() == "STUDENT") {
			for (TimeTable timeTable : timeTableRepository.findByClassCode(user.getClassCode()).get()) {
				list.add(new TimeTableDto(timeTable));
			}
		}

		return list;
	}

}
