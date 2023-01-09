package com.teras.db.embeddedId;

import java.io.Serializable;
import java.util.Objects;

import javax.persistence.Embeddable;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

import com.teras.db.entity.Assignment;
import com.teras.db.entity.User;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Embeddable
public class AssignCommentId implements Serializable {

	@ManyToOne
	@JoinColumn(name = "userId", nullable = false)
	User userId;

	@ManyToOne
	@JoinColumn(name = "assignNo", nullable = false)
	Assignment assignNo;
	
	public AssignCommentId(User userId, Assignment assignNo) {
		this.userId = userId;
		this.assignNo = assignNo;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		AssignCommentId assignCommentId = (AssignCommentId) o;
		return Objects.equals(userId, assignCommentId.userId) && Objects.equals(assignNo, assignCommentId.assignNo);
	}

	@Override
	public int hashCode() {
		return Objects.hash(userId, assignNo);
	}
}
