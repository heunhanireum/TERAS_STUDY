package com.teras.api.service;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.teras.api.request.NoticeRegisterPostReq;
import com.teras.common.util.DateFormatUtil;
import com.teras.db.dto.NoticeDto;
import com.teras.db.entity.Notice;
import com.teras.db.entity.User;
import com.teras.db.repository.AttachmentRepository;
import com.teras.db.repository.NoticeRepository;
import com.teras.db.repository.UserRepository;

@Service
public class NoticeServiceImpl implements NoticeService {
	@PersistenceContext
	private EntityManager em;

	@Autowired
	UserRepository userRepository;

	@Autowired
	NoticeRepository noticeRepository;

	@Autowired
	AttachmentRepository attachmentRepository;

	@Override
	public Notice createNotice(NoticeRegisterPostReq noticeRegisterInfo, String userId) {
		User user = userRepository.findByUserId(userId).get();

		Notice notice = Notice.builder().title(noticeRegisterInfo.getTitle()).content(noticeRegisterInfo.getContent())
				.user(user).classCode(user.getClassCode()).createdDate(DateFormatUtil.now())
				.attach(attachmentRepository.findByUuid(noticeRegisterInfo.getUuid()).orElse(null)).build();

		return noticeRepository.save(notice);
	}

	@Override
	public List<NoticeDto> getNoticeList(String userId, int page) {
		User user = userRepository.findByUserId(userId).get();

		Pageable pageable = PageRequest.of(page, 10, Sort.by("noticeNo").descending());

		List<NoticeDto> list = new ArrayList<>();

		for (Notice notice : noticeRepository.findByClassCode(user.getClassCode(), pageable)) {
			System.out.println(notice.toString());
			list.add(new NoticeDto(notice));
		}

		return list;
	}

	@Override
	public int getNoticeListTotal(String userId) {
		User user = userRepository.findByUserId(userId).get();

		int total = noticeRepository.countByClassCode(user.getClassCode());

		return total / 10;
	}

	@Override
	public NoticeDto getNotice(long noticeNo) {
		Notice notice = noticeRepository.findById(noticeNo).orElse(null);
		if (notice == null)
			return null;

		return new NoticeDto(notice);
	}

	@Override
	public Boolean editNotice(long noticeNo, String userId, NoticeRegisterPostReq noticePostReq) {

		Notice notice = noticeRepository.findById(noticeNo).orElse(null);
		User user = userRepository.findByUserId(userId).get();
		
		if (notice == null)
			return null;

		if (!notice.getUser().equals(user)) {
			return false;
		}

		notice.update(noticePostReq.getTitle(), noticePostReq.getContent());

		noticeRepository.save(notice);

		return true;
	}

	@Override
	public Boolean deleteNotice(long noticeNo, String userId) {
		Notice notice = noticeRepository.findById(noticeNo).orElse(null);
		User user = userRepository.findByUserId(userId).get();
		
		if (notice == null)
			return null;

		if (!notice.getUser().equals(user)) {
			return false;
		}
		noticeRepository.deleteById(noticeNo);

		return true;
	}
}
