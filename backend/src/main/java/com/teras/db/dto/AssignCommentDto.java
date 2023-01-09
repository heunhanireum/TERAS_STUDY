package com.teras.db.dto;

import com.teras.db.entity.AssignComment;

import lombok.Data;

@Data
public class AssignCommentDto {
	String content;
	String submitDate;
	String uuid;

	public AssignCommentDto(AssignComment assignComment) {
		if (assignComment != null) {
			content = assignComment.getContent();
			submitDate = assignComment.getSubmitDate().toString();
			if (assignComment.getUuid() != null)
				uuid = assignComment.getUuid().getUuid();
		}

	}

}
