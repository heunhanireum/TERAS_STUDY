package com.teras.db.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.teras.db.entity.Openvidu;

@Repository
public interface OpenviduRepository extends JpaRepository<Openvidu, String>{
	Optional<Openvidu> findBySessionId(String sessionId);
} 