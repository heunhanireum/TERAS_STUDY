package com.teras.db.entity;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Getter
@Table(name = "class")
public class ClassEntity {
	@Id
	@Column(name = "classCode", nullable = false)
    String classCode;
	
	@JsonManagedReference
    @OneToMany(mappedBy = "classCode")
    List<User> users = new ArrayList<>();
	
    @ManyToOne
    @JoinColumn(name = "schoolCode", nullable = true)
    School schoolCode;
    
    @Column(name = "classNumber", nullable = false)
    String classNumber;
    
    @Column(name = "gradeNumber", nullable = false, length = 13)
    String gradeNumber;
}
