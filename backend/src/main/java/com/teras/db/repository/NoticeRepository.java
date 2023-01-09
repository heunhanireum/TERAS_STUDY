package com.teras.db.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.Notice;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

	Optional<Notice> findByNoticeNo(int noticeNo);

	Optional<List<Notice>> findAllByOrderByNoticeNoDesc();

	@Query(value = "SELECT * FROM notice WHERE :type like '%:word%'", nativeQuery = true)
	Optional<List<Notice>> findNoticeByType(@Param("type") String type, @Param("word") String word);

	List<Notice> findByClassCode(ClassEntity classEntity, Pageable pageable);
	Integer countByClassCode(ClassEntity classEntity);
}
