package com.teras.db.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.teras.db.entity.StudyRoom;

@Repository
public interface StudyRoomRepository extends JpaRepository<StudyRoom, String>{
	Optional<StudyRoom> findBySessionId(String sessionId);
	
	Optional<List<StudyRoom>> findAllByOrderByCreateDateDesc();
}
