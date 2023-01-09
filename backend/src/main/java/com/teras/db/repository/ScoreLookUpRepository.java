package com.teras.db.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.teras.db.embeddedId.ScoreId;
import com.teras.db.entity.ScoreLookUp;
import com.teras.db.entity.User;

@Repository
public interface ScoreLookUpRepository extends JpaRepository<ScoreLookUp, ScoreId> {

	Optional<List<ScoreLookUp>> findByScoreIdUserId(User userId);
}
