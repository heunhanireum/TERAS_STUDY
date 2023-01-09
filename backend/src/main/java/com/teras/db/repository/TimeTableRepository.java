package com.teras.db.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.teras.db.dto.TimeTableTeacherInterface;
import com.teras.db.embeddedId.TimeTableId;
import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.SubjectDetail;
import com.teras.db.entity.TimeTable;
import com.teras.db.entity.User;

@Repository
public interface TimeTableRepository extends JpaRepository<TimeTable, TimeTableId> {
	@Query(value = "select * from timetable where class_code = :classCode order by day asc, period asc", nativeQuery = true)
	Optional<List<TimeTable>> findByClassCode(@Param("classCode") ClassEntity classCode);

	@Query(value = "SELECT tt.day, tt.period, ce.grade_number, ce.class_number, ce.class_code FROM teras.timetable tt inner join timetable_teacher ttt on tt.class_code = ttt.class_code join class ce on tt.class_code = ce.class_code where ttt.user_id = :userId and tt.subject_code = :subjectCode", nativeQuery = true)
	Optional<List<TimeTableTeacherInterface>> findByUserIdAndSubjectCode(@Param("userId") User userId,
			@Param("subjectCode") SubjectDetail subjectCode);
}