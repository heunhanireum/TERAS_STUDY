package com.teras.api.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.teras.api.request.FileDownloadPostReq;
import com.teras.api.response.FileNameGetRes;
import com.teras.api.response.FileUploadPostRes;
import com.teras.api.service.FileService;
import com.teras.common.model.response.BaseResponseBody;

@RestController
@RequestMapping("/file")
public class FileController {
	@Autowired
	FileService fileService;

	@PostMapping("/upload")
	public ResponseEntity<? extends FileUploadPostRes> upload(@RequestParam MultipartFile file)
			throws IllegalStateException, IOException {
		String uuid = fileService.uploadFile(file);

		return ResponseEntity.status(200).body(FileUploadPostRes.of(200, "Success", uuid));
	}

	@PostMapping("/download")
	public ResponseEntity<Object> postDownload(@RequestBody FileDownloadPostReq downloadInfo,  @RequestHeader("User-Agent") String agent) {
		System.out.println(downloadInfo.getUuid());
		return fileService.downloadFile(downloadInfo.getUuid(), agent);
	}

	@GetMapping("/download")
	public ResponseEntity<Object> getdownload(@RequestParam("uuid") String uuid, @RequestHeader("User-Agent") String agent) {

		return fileService.downloadFile(uuid, agent);
	}

	@GetMapping()
	public ResponseEntity<? extends BaseResponseBody> getFileName(@RequestParam("uuid") String uuid) {
		String fileName = fileService.getFileName(uuid);
		return ResponseEntity.status(200).body(FileNameGetRes.of(200, "SUCCESS", fileName));
	}
}
