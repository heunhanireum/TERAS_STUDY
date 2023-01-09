package com.teras.db.dto;

import com.teras.db.entity.Assignment;

import lombok.Data;

@Data
public class AssignmentDto {
	private Long assignNo;
	private String title;
	private String content;
	private String name;
	private String subjectName;
	private String createdDate;
	private String deadLine;
	private String uuid;
	private int state;

	public AssignmentDto(Assignment assign, int state) {
		this(assign);
		this.state = state;
	}

	public AssignmentDto(Assignment assign) {
		assignNo = assign.getAssignNo();
		title = assign.getTitle();
		content = assign.getContent();
		name = assign.getUserId().getName();
		subjectName = assign.getSubjectCode().getSubjectName();
		createdDate = assign.getCreatedDate().toString();
		deadLine = assign.getDeadline().toString();
		if (assign.getUuid() != null)
			uuid = assign.getUuid().getUuid();
	}
}
