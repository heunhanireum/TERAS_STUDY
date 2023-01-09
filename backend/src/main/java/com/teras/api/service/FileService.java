package com.teras.api.service;

import java.io.IOException;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import com.teras.db.entity.Attachment;

public interface FileService {
	String uploadFile(MultipartFile file) throws IllegalStateException, IOException;
	ResponseEntity<Object> downloadFile(String uuid, String agent);
	
	Attachment createFile(String uuid, String fileName, String fileType, String filePath);
	String getFileName(String uuid);
}
