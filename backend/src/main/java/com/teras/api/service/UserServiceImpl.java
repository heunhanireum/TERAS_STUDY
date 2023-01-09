package com.teras.api.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.teras.api.request.UserRegisterPostReq;
import com.teras.common.model.column.TerasAuthority;
import com.teras.db.dto.UserDto;
import com.teras.db.entity.ClassEntity;
import com.teras.db.entity.User;
import com.teras.db.repository.ClassEntityRepository;
import com.teras.db.repository.UserRepository;

/**
 * 유저 관련 비즈니스 로직 처리를 위한 서비스 구현 정의.
 */
@Service("userService")
public class UserServiceImpl implements UserService {
	@Autowired
	UserRepository userRepository;

	@Autowired
	ClassEntityRepository classEntityRepository;

	@Autowired
	PasswordEncoder passwordEncoder;

	@Override
	public User createUser(UserRegisterPostReq userRegisterInfo) {
		User user = User.builder().userId(userRegisterInfo.getId())
				.password(passwordEncoder.encode(userRegisterInfo.getPassword())).name(userRegisterInfo.getName())
				.email(userRegisterInfo.getEmail()).phoneNumber(userRegisterInfo.getPhoneNumber())
				.classCode(classEntityRepository.findByClassCode(userRegisterInfo.getClassCode()).get())
				.authority(TerasAuthority.valueOf(userRegisterInfo.getAuthority())).build();
		return userRepository.save(user);
	}

	@Override
	public User getUserByUserId(String userId) {
		// 디비에 유저 정보 조회 (userId 를 통한 조회).
		User user = userRepository.findByUserId(userId).get();
		return user;
	}

	@Override
	public int idCheck(String id) {
		return userRepository.countByUserId(id);
	}
	
	@Override
	public List<UserDto> getClassmates(ClassEntity classCode){
		
		List<UserDto> list = new ArrayList<>();
		
		for (User student : userRepository.findByClassCode(classCode).get()) {
			list.add(new UserDto(student));
		}
		return list;
	}

	
	@Override
	public int getClassmatesTotal(ClassEntity classCode) {
		
		int total = userRepository.countByClassCode(classCode);
		
		return total;
	
	}

}
