package com.teras.api.service;

import java.io.File;
import java.io.IOException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.teras.db.entity.Attachment;
import com.teras.db.repository.AttachmentRepository;

@Service
public class FileServiceImpl implements FileService {

	@Autowired
	AttachmentRepository attachmentRepository;

	@Override
	public String uploadFile(MultipartFile file) throws IllegalStateException, IOException {
		String uuid = UUID.randomUUID().toString();
		if (!file.isEmpty()) {

			File newFile = new File(uuid + "_" + file.getOriginalFilename());
			file.transferTo(newFile);
		}

		createFile(uuid, file.getOriginalFilename(), file.getContentType(), uuid + "_" + file.getOriginalFilename());

		return uuid;
	}

	@Override
	public ResponseEntity<Object> downloadFile(String uuid, String agent) {
		Attachment attach = attachmentRepository.findByUuid(uuid).get();
		try {
			String originFileName = URLDecoder.decode(attach.getFileName(), "UTF-8");
			String path = "/home/ubuntu/file/" + attach.getFilePath();

			String onlyFileName = originFileName.substring(originFileName.lastIndexOf("_") + 1);

			if (agent.contains("Trident"))// Internet Explore
				onlyFileName = URLEncoder.encode(onlyFileName, "UTF-8").replaceAll("\\+", " ");
			else if (agent.contains("Edge")) // Micro Edge
				onlyFileName = URLEncoder.encode(onlyFileName, "UTF-8");
			else // Chrome
				onlyFileName = new String(onlyFileName.getBytes("UTF-8"), "ISO-8859-1");

			Path filePath = Paths.get(path);
			Resource resource = new InputStreamResource(Files.newInputStream(filePath));

			HttpHeaders headers = new HttpHeaders();
			headers.setContentDisposition(ContentDisposition.builder("attachment").filename(onlyFileName).build()); //

			return new ResponseEntity<Object>(resource, headers, HttpStatus.OK);
		} catch (Exception e) {
			return new ResponseEntity<Object>(null, HttpStatus.CONFLICT);
		}
	}

	@Override
	public Attachment createFile(String uuid, String fileName, String fileType, String filePath) {
		Attachment attachment = Attachment.builder().uuid(uuid).fileName(fileName).fileType(fileType).filePath(filePath)
				.build();
		return attachmentRepository.save(attachment);
	}

	@Override
	public String getFileName(String uuid) {
		return attachmentRepository.findByUuid(uuid).get().getFileName();
	}

}
