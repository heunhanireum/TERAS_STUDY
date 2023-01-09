package com.teras.db.entity;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import lombok.Getter;

@Entity
@Getter
@Table(name = "subjectNotice")
public class SubjectNotice {
	@Id
	@Column(name = "noticeNo", nullable = false)
    int noticeNo;
	
	@Column(name = "title", nullable = false)
    String title;
	
	@Column(name = "content", nullable = false)
    String content;
	
    @ManyToOne
    @JoinColumn(name = "classCode", nullable = false)
    ClassEntity classCode;
	
	@Column(name = "createDate", nullable = false)
    LocalDateTime createdDate = LocalDateTime.now();
	
    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    User userId;
    
    @ManyToOne
    @JoinColumn(name = "uuid", nullable = false)
    Attachment uuid;
    
    @ManyToOne
    @JoinColumn(name = "subjectCode", nullable = false)
    SubjectDetail subjectCode;
}
