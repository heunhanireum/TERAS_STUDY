package com.teras.api.service;

import java.util.List;

import com.teras.api.request.AssignCommentRegisterPostReq;
import com.teras.api.request.AssignRegisterPostReq;
import com.teras.db.dto.AssignCommentDto;
import com.teras.db.dto.AssignmentDto;
import com.teras.db.entity.AssignComment;
import com.teras.db.entity.Assignment;

public interface AssignService {

	List<AssignmentDto> getAssignByClassCodeAndSubjectCode(String userId, String subjectCode, int page);
	List<AssignmentDto> getAssignByClassCodeAndSubjectCode(String userId, String subjectCode);

	Assignment createAssign(AssignRegisterPostReq registerInfo, String userId);

	AssignmentDto getAssignByAssignNo(long assignNo);

	List<AssignCommentDto> getAssignCommentByAssignNoAndUserId(long assignNo, String userId);

	AssignComment createAssignComment(AssignCommentRegisterPostReq registerInfo, String userId);
}
