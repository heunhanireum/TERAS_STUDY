package com.teras.api.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ApiModel("ClassRegisterPostReq")
public class ClassRegisterPostReq {
	@ApiModelProperty(name = "grade_number", example = "S0000000001")
	String SchoolCode;
	@ApiModelProperty(name = "grade_number", example = "3")
	String gradeNumber;
	@ApiModelProperty(name = "class_number", example = "5")
	String classNumber;
}
