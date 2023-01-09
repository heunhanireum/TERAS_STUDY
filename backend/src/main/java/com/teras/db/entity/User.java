package com.teras.db.entity;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.*;
import com.teras.common.model.column.TerasAuthority;

import lombok.*;

/**
 * �쑀�� 紐⑤뜽 �젙�쓽.
 */
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Getter
@Builder
@Table(name = "user")
public class User {
	@Id
	@Column(name = "userId", unique = true, nullable = false)
	String userId;

	@Column(name = "password", nullable = false)
	@JsonIgnore
	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	String password;

	@Column(name = "name", nullable = false)
	String name;

	@Column(name = "email", nullable = false)
	String email;

	@Column(name = "phoneNumber", nullable = false, length = 13)
	String phoneNumber;

	@ManyToOne
	@JoinColumn(name = "classCode", referencedColumnName = "classCode",nullable = true)
	ClassEntity classCode;

	@Enumerated(EnumType.STRING)
	@Column(name = "authority", nullable = false, length = 12)
	TerasAuthority authority;

	@Column(name = "emergencyPhoneNumber", nullable = true, length = 13)
	String emergencyPhoneNumber;

	@ManyToOne
	@JoinColumn(name = "subjectCode", nullable = true)
	SubjectDetail subjectCode;
}
