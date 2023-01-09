package com.teras.api.service;

import java.util.List;

import com.teras.db.dto.ScoreDto;
import com.teras.db.entity.User;

public interface ScoreLookUpService {
	
	List<ScoreDto> getScoreList(User user);
}
