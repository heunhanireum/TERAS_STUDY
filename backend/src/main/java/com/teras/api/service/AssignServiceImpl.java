package com.teras.api.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.teras.api.request.AssignCommentRegisterPostReq;
import com.teras.api.request.AssignRegisterPostReq;
import com.teras.common.util.DateFormatUtil;
import com.teras.db.dto.AssignCommentDto;
import com.teras.db.dto.AssignmentDto;
import com.teras.db.embeddedId.AssignCommentId;
import com.teras.db.entity.AssignComment;
import com.teras.db.entity.Assignment;
import com.teras.db.entity.SubjectDetail;
import com.teras.db.entity.User;
import com.teras.db.repository.AssignCommentRepository;
import com.teras.db.repository.AssignmentRepository;
import com.teras.db.repository.AttachmentRepository;
import com.teras.db.repository.ClassEntityRepository;
import com.teras.db.repository.SubjectDetailRepository;
import com.teras.db.repository.UserRepository;

@Service
public class AssignServiceImpl implements AssignService {

	@Autowired
	AssignmentRepository assignmentRepository;

	@Autowired
	AssignCommentRepository assignCommentRepository;

	@Autowired
	ClassEntityRepository classEntityRepository;

	@Autowired
	SubjectDetailRepository subjectDetailRepository;

	@Autowired
	UserRepository userRepository;

	@Autowired
	AttachmentRepository attachmentRepository;

	@Override
	public List<AssignmentDto> getAssignByClassCodeAndSubjectCode(String userId, String subjectCode, int page) {
		User user = userRepository.findByUserId(userId).get();
		Pageable pageable = PageRequest.of(page, 10, Sort.by("assignNo").descending());
		List<AssignmentDto> list = new ArrayList<AssignmentDto>();

		int state = 0;

		if (!subjectCode.toUpperCase().equals("ALL")) {
			SubjectDetail subject = subjectDetailRepository.findBySubjectCode(subjectCode).get();

			for (Assignment assign : assignmentRepository
					.findByClassCodeAndSubjectCodeOrderByDeadlineAsc(user.getClassCode(), subject, pageable).get()) {

				if ("TEACHER".equals(user.getAuthority())) {
					state = assignCommentRepository.countByAssignCommentId_AssignNo(assign);
				} else {
					state = assignCommentRepository.countByAssignCommentId_AssignNoAndAssignCommentId_UserId(assign,
							user);
				}
				list.add(new AssignmentDto(assign, state));
			}
		} else {
			for (Assignment assign : assignmentRepository
					.findByClassCodeOrderByDeadlineAsc(user.getClassCode(), pageable).get()) {

				if ("TEACHER".equals(user.getAuthority())) {
					state = assignCommentRepository.countByAssignCommentId_AssignNo(assign);
				} else {
					state = assignCommentRepository.countByAssignCommentId_AssignNoAndAssignCommentId_UserId(assign,
							user);
				}

				list.add(new AssignmentDto(assign, state));
			}
		}

		return list;
	}

	@Override
	public List<AssignmentDto> getAssignByClassCodeAndSubjectCode(String userId, String subjectCode) {
		User user = userRepository.findByUserId(userId).get();

		List<AssignmentDto> list = new ArrayList<AssignmentDto>();
		int state = 0;

		if (!subjectCode.toUpperCase().equals("ALL")) {
			SubjectDetail subject = subjectDetailRepository.findBySubjectCode(subjectCode).get();

			for (Assignment assign : assignmentRepository
					.findByClassCodeAndSubjectCodeOrderByDeadlineAsc(user.getClassCode(), subject).get()) {
				if ("TEACHER".equals(user.getAuthority())) {
					state = assignCommentRepository.countByAssignCommentId_AssignNo(assign);
				} else {
					state = assignCommentRepository.countByAssignCommentId_AssignNoAndAssignCommentId_UserId(assign,
							user);
				}
				list.add(new AssignmentDto(assign, state));
			}
		} else {
			for (Assignment assign : assignmentRepository.findByClassCodeOrderByDeadlineAsc(user.getClassCode())
					.get()) {
				if ("TEACHER".equals(user.getAuthority())) {
					state = assignCommentRepository.countByAssignCommentId_AssignNo(assign);
				} else {
					state = assignCommentRepository.countByAssignCommentId_AssignNoAndAssignCommentId_UserId(assign,
							user);
				}
				list.add(new AssignmentDto(assign, state));
			}
		}

		return list;
	}

	@Override
	public Assignment createAssign(AssignRegisterPostReq registerInfo, String userId) {
		User user = userRepository.findByUserId(userId).get();

		Assignment assign = Assignment.builder().title(registerInfo.getTitle()).content(registerInfo.getContent())
				.deadline(registerInfo.getDeadLine()).classCode(user.getClassCode()).subjectCode(user.getSubjectCode())
				.userId(user).createdDate(DateFormatUtil.now())
				.uuid(attachmentRepository.findByUuid(registerInfo.getUuid()).orElse(null)).build();
		return assignmentRepository.save(assign);
	}

	@Override
	public AssignmentDto getAssignByAssignNo(long assignNo) {
		AssignmentDto assign = new AssignmentDto(assignmentRepository.findByAssignNo(assignNo).get());

		return assign;
	}

	@Override
	public List<AssignCommentDto> getAssignCommentByAssignNoAndUserId(long assignNo, String userId) {
		User user = userRepository.findByUserId(userId).get();
		Assignment assign = assignmentRepository.findByAssignNo(assignNo).orElse(null);

		List<AssignCommentDto> list = new ArrayList<>();

		if ("TEACHER".equals(user.getAuthority())) {
			for (AssignComment comment : assignCommentRepository.findByAssignCommentId_AssignNo(assign).get()) {
				list.add(new AssignCommentDto(comment));
			}
		} else {

			list.add(new AssignCommentDto(assignCommentRepository
					.findByAssignCommentId_AssignNoAndAssignCommentId_UserId(assign, user).orElse(null)));
		}
		return list;
	}

	@Override
	public AssignComment createAssignComment(AssignCommentRegisterPostReq registerInfo, String userId) {
		User user = userRepository.findByUserId(userId).get();
		Assignment assignment = assignmentRepository.findByAssignNo(registerInfo.getAssignNo()).get();

		AssignCommentId assignCommentId = new AssignCommentId(user, assignment);

		AssignComment comment = AssignComment.builder().content(registerInfo.getContent())
				.assignCommentId(assignCommentId).submitDate(DateFormatUtil.now())
				.uuid(attachmentRepository.findByUuid(registerInfo.getUuid()).orElse(null)).build();

		return assignCommentRepository.save(comment);
	}
}
