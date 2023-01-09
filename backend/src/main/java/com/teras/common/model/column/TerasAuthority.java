package com.teras.common.model.column;

import org.springframework.security.core.GrantedAuthority;

import lombok.Getter;
import lombok.Setter;

@Getter
public enum TerasAuthority implements GrantedAuthority{
	STUDENT("role_student"), TEACHER("role_teacher"), ADMIN("role_admin");

	private String authority;
	
	TerasAuthority(String authority) {
		this.authority = authority;
	}
}
