package com.teras.db.embeddedId;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

import com.teras.db.entity.User;

import lombok.Data;

@Data
@Embeddable
public class AttendanceId implements Serializable {
    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    User userId;
	
	@Column(name = "date", nullable = false)
    String date;
}
