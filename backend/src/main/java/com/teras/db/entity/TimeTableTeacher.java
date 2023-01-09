package com.teras.db.entity;

import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.Table;

import com.teras.db.embeddedId.TimeTableTeacherId;

import lombok.Getter;

@Entity
@Getter
@Table(name = "timetableTeacher")
public class TimeTableTeacher {
	@EmbeddedId
	TimeTableTeacherId timeTableTeacherId;
}
