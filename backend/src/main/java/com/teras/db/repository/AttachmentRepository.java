package com.teras.db.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.teras.db.entity.Attachment;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, String>{
	Optional<Attachment> findByUuid(String uuid);
}
