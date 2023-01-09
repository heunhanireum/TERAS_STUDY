package com.teras.db.entity;

import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.Table;

import com.teras.db.embeddedId.AttendanceId;

import lombok.Getter;

@Entity
@Getter
@Table(name = "attendance")
public class Attendance {
	@EmbeddedId
	AttendanceId attendanceId;
	
	@Column(name = "statement", nullable = false)
    int statement;

	public void update(int state) {
		statement = state;
	}
}
