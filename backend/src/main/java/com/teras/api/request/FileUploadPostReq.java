package com.teras.api.request;

import java.io.File;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("FileUploadPostReq")
public class FileUploadPostReq {
	@ApiModelProperty(name = "파일 이름", example = "example.")
	String fileName;
	@ApiModelProperty(name = "파일 종류", example = "txt")
	String fileType;
	@ApiModelProperty(name = "파일", example = "example.txt")
	File file;
}
