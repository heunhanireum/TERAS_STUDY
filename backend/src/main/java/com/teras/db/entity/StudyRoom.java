package com.teras.db.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Getter
@Builder
@Table(name = "studyRoom")
public class StudyRoom {
	@Id
	@Column(name = "sessionId", unique = true, nullable = false)
	String sessionId;
	
	@Column(name = "roomName", nullable = false)
	String roomName;
	
	@Column(name = "createDate", nullable = false)
	String createDate;
}
