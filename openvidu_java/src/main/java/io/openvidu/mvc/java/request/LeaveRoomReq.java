package io.openvidu.mvc.java.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;


import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;


@ApiModel("LeaveRoomRequest")
public class LeaveRoomReq {

    @ApiModelProperty(name = "방 번호", example="abcdefg")
    @NotEmpty(message = "roomId may not be empty")
    @Size(max = 50)
    private String roomId;
}