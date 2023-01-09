package com.teras.db.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.Getter;

@Entity
@Getter
@Table(name = "school")
public class School {
	@Id
	@Column(name = "schoolCode", unique = true, nullable = false)
	String schoolCode;

	@Column(name = "schoolName", nullable = false)
	String schoolName;
	
	@Column(name = "schoolAddress", nullable = false)
	String schoolAddress;
}
