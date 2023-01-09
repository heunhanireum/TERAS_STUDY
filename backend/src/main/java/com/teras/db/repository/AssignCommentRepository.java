package com.teras.db.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.teras.db.embeddedId.AssignCommentId;
import com.teras.db.entity.AssignComment;
import com.teras.db.entity.Assignment;
import com.teras.db.entity.User;

@Repository
public interface AssignCommentRepository extends JpaRepository<AssignComment, AssignCommentId> {
	Optional<List<AssignComment>> findByAssignCommentId_AssignNo(Assignment assignNo);
	Optional<AssignComment> findByAssignCommentId_AssignNoAndAssignCommentId_UserId(Assignment assignNo,User userId);
	
	Integer countByAssignCommentId_AssignNoAndAssignCommentId_UserId(Assignment assignNo, User user);
	Integer countByAssignCommentId_AssignNo(Assignment assign);
}
