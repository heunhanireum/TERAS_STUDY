package com.teras.db.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.School;

@Repository
public interface ClassEntityRepository extends JpaRepository<ClassEntity, String>{
	Optional<ClassEntity> findByClassCode(String ClassCode);
	
	Optional<List<ClassEntity>> findBySchoolCode(School school);

}
