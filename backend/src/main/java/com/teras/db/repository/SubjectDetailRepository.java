package com.teras.db.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.teras.db.entity.SubjectDetail;

@Repository
public interface SubjectDetailRepository extends JpaRepository<SubjectDetail, String> {

	Optional<SubjectDetail> findBySubjectCode(String subjectCode);
}
