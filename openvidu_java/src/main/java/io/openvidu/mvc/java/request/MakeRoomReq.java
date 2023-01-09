package io.openvidu.mvc.java.request;


import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;


@ApiModel("MakeRoomRequest")
public class MakeRoomReq {

    @ApiModelProperty(name = "방", example="1")
    @NotNull(message = "Room may not be empty")
    private Integer Roomtype;

    @ApiModelProperty(name = "비밀번호", example="password")
    @NotNull(message = "password may not be null")
    @Size(max = 50)
    private String password;
}