package com.teras.db.embeddedId;

import java.io.Serializable;

import javax.persistence.Embeddable;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.User;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Embeddable
public class TimeTableTeacherId implements Serializable{
	@ManyToOne
	@JoinColumn(name = "userId", nullable = false)
	User userId;
	
	@ManyToOne
	@JoinColumn(name = "classCode", nullable = false)
	ClassEntity classCode;
}
