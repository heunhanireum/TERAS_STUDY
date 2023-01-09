package com.teras.db.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.teras.db.entity.School;

@Repository
public interface SchoolRepository extends JpaRepository<School, String> {
	Optional<School> findBySchoolCode(String schoolCode);
	
	Optional<List<School>> findBySchoolNameContains(String schoolName);
}
