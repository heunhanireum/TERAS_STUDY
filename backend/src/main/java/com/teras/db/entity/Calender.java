package com.teras.db.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import lombok.Data;
import lombok.Getter;


@Data
@Embeddable
class CalenderId implements Serializable {
    @ManyToOne
    @JoinColumn(name = "classCode", nullable = true)
    ClassEntity classCode;
	
	@Column(name = "date", nullable = false)
    String date;
}


@Entity
@Getter
@Table(name = "calender")
public class Calender {
	@EmbeddedId
	CalenderId calenderId;
	
	@Column(name = "event", nullable = false)
    String event;
}
