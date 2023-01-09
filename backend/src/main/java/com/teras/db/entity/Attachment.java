package com.teras.db.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Getter
@Builder
@Table(name = "attachment")
public class Attachment {
	@Id
	@Column(name = "uuid", nullable = false)
    String uuid;
	
	@Column(name = "filePath", nullable = false)
    String filePath;
	
	@Column(name = "fileType", nullable = false)
    String fileType;
	
	@Column(name = "fileName", nullable = false)
    String fileName;
}
