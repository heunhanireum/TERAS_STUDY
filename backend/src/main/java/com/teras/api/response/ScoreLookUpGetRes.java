package com.teras.api.response;

import java.util.List;

import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.ScoreDto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Setter;
import lombok.Getter;

@Getter
@Setter
@ApiModel("ScoreLookUpGetRes")
public class ScoreLookUpGetRes extends BaseResponseBody {
	@ApiModelProperty(name = "성적 보기", example = "list[{ScoreDto}, {ScoreDto}, ...]")
	List<ScoreDto> list;
	
	public static ScoreLookUpGetRes of(Integer statusCode, String message, List<ScoreDto> list) {
		ScoreLookUpGetRes res = new ScoreLookUpGetRes();
		res.setStatusCode(statusCode);
		res.setMessage(message);
		res.setList(list);
		return res;
	}
}
