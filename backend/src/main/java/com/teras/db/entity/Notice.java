package com.teras.db.entity;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import org.springframework.data.annotation.CreatedDate;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Getter
@Builder
@Table(name = "notice")
public class Notice {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	@Column(name = "noticeNo", nullable = false)
	long noticeNo;

	@Column(name = "title", nullable = false)
	String title;

	@Column(name = "content", nullable = false)
	String content;

	@Column(name = "createDate", nullable = false)
	String createdDate;

	@ManyToOne
	@JoinColumn(name = "user_id", nullable = false)
	User user;

	@ManyToOne
	@JsonManagedReference
	@JoinColumn(name = "classCode", nullable = false)
	ClassEntity classCode;

	@ManyToOne
	@JoinColumn(name = "attach", nullable = true)
	Attachment attach;

	public void update(String title, String content) {
		this.title = title;
		this.content = content;
	}

	@Override
	public String toString() {
		return "Notice [noticeNo=" + noticeNo + ", title=" + title + ", content=" + content + ", createdDate="
				+ createdDate + ", user=" + user + ", classCode=" + classCode + ", attach=" + attach + "]";
	}
}
