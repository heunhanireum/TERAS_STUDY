package com.teras.db.entity;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@Table(name = "assignment")
public class Assignment {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	@Column(name = "assignNo", nullable = false)
    long assignNo;
	
	@Column(name = "title", nullable = false)
    String title;
	
	@Column(name = "content", nullable = false)
    String content;
	
	@Column(name = "deadline", nullable = false)
    String deadline;
	
	@Column(name = "createDate", nullable = false)
	String createdDate;
	
    @ManyToOne
    @JoinColumn(name = "uuid", nullable = true)
    Attachment uuid;
    
    @ManyToOne
    @JoinColumn(name = "classCode", nullable = false)
    ClassEntity classCode;
    
    @ManyToOne
    @JoinColumn(name = "subjectCode", nullable = false)
    SubjectDetail subjectCode;
    
    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    User userId;
}
