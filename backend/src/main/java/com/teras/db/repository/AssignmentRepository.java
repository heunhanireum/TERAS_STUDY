package com.teras.db.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.teras.db.entity.Assignment;
import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.SubjectDetail;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
	Optional<List<Assignment>> findByClassCodeAndSubjectCodeOrderByDeadlineAsc(ClassEntity classCode,
			SubjectDetail subjectCode, Pageable pageable);
	Optional<List<Assignment>> findByClassCodeAndSubjectCodeOrderByDeadlineAsc(ClassEntity classCode,
			SubjectDetail subjectCode);

	Optional<List<Assignment>> findByClassCodeOrderByDeadlineAsc(ClassEntity classCode, Pageable pageable);
	Optional<List<Assignment>> findByClassCodeOrderByDeadlineAsc(ClassEntity classCode);

	Optional<Assignment> findByAssignNo(long assignNo);
}
