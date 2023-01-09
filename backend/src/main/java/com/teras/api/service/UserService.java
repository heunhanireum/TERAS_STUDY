package com.teras.api.service;

import java.util.List;

import com.teras.api.request.UserRegisterPostReq;
import com.teras.db.dto.UserDto;
import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.User;

/**
 *	유저 관련 비즈니스 로직 처리를 위한 서비스 인터페이스 정의.
 */
public interface UserService {
	User createUser(UserRegisterPostReq userRegisterInfo);
	User getUserByUserId(String userId);
	int idCheck(String id);
	List<UserDto> getClassmates(ClassEntity classCode);
	int getClassmatesTotal(ClassEntity classCode);

}
