package com.teras.db.dto;

import com.teras.db.entity.ScoreLookUp;
import lombok.Data;

@Data
public class ScoreDto {
	private String userId;
	private String subjectCode;
	private String date;
	private int score;
	
	public ScoreDto(ScoreLookUp scoreLookUp) {
		userId = scoreLookUp.getScoreId().getUserId().getUserId();
		subjectCode = scoreLookUp.getScoreId().getSubjectCode().getSubjectCode();
		date = scoreLookUp.getScoreId().getDate();
		score = scoreLookUp.getScore();
		
	}
}
