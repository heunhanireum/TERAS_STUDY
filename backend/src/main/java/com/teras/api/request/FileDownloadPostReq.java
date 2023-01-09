package com.teras.api.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("FileDownloadPostReq")
public class FileDownloadPostReq {
	@ApiModelProperty(name = "uuid", example = "d4543f6b-f30f-40f9-be75-a2f047d79c34")
	String uuid;
}
