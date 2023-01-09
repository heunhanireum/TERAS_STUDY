package com.teras.db.entity;

import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.teras.db.embeddedId.AssignCommentId;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Getter
@Table(name = "assignComment")
public class AssignComment {

	@EmbeddedId
	AssignCommentId assignCommentId;

	@Column(name = "content", nullable = false)
	String content;

	@Column(name = "submitDate", nullable = false)
	String submitDate;

	@ManyToOne
	@JoinColumn(name = "uuid", nullable = true)
	Attachment uuid;

}
