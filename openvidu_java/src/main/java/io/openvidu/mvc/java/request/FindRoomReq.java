package io.openvidu.mvc.java.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
//import lombok.Getter;
//import lombok.Setter;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;


@ApiModel("FindRoomRequest")
//@Getter
//@Setter
public class FindRoomReq {

    @ApiModelProperty(name = "방 번호", example="abcdefg")
    @NotEmpty(message = "roomId may not be empty")
    @Size(max = 50)
    private String roomId;

    @ApiModelProperty(name = "비밀번호", example="password")
    @NotNull(message = "password may not be empty")
    @Size(max = 50)
    private String password;
}