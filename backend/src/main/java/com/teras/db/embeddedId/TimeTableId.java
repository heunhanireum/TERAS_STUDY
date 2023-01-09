package com.teras.db.embeddedId;

import java.io.Serializable;
import java.util.Objects;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

import com.teras.db.entity.ClassEntity;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Embeddable
public class TimeTableId implements Serializable {
	@ManyToOne
	@JoinColumn(name = "classCode", nullable = true)
	ClassEntity classCode;

	@Column(name = "day", nullable = false)
	int day;

	@Column(name = "period", nullable = false)
	int period;

	public TimeTableId(ClassEntity classCode, int day, int period) {
		this.classCode = classCode;
		this.day = day;
		this.period = period;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		TimeTableId timetalbeId = (TimeTableId) o;
		return Objects.equals(classCode, timetalbeId.classCode) && Objects.equals(day, timetalbeId.day)
				&& period == timetalbeId.period;
	}

	@Override
	public int hashCode() {
		return Objects.hash(classCode, day, period);
	}
}
