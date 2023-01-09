package com.teras.db.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.teras.db.embeddedId.AttendanceId;
import com.teras.db.entity.Attendance;
import com.teras.db.entity.User;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, AttendanceId>{
	Optional<List<Attendance>> findByAttendanceId_UserIdAndAttendanceId_DateContains(User user, String date);
}
