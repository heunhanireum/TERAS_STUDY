package com.teras.db.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
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
@Table(name = "openvidu")
public class Openvidu {
	@Id
	@Column(name = "sessionId", unique = true, nullable = false)
	String sessionId;
	
	@Column(name = "hostId", nullable = false)
	String hostId;
	
	@Column(name = "goal", nullable = false)
	String goal;
	
	@ManyToOne
	@JoinColumn(name = "subjectCode", nullable = true)
	SubjectDetail subjectCode;
	
	@Column(name = "period", nullable = false)
	int period;
	
	@ManyToOne
	@JoinColumn(name = "classCode", nullable = true)
	ClassEntity classCode;
}
