package com.teras.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.teras.api.request.NoticeRegisterPostReq;
import com.teras.api.response.NoticeDetailGetRes;
import com.teras.api.response.NoticeListGetRes;
import com.teras.api.service.NoticeService;
import com.teras.common.auth.SsafyUserDetails;
import com.teras.common.model.response.BaseResponseBody;
import com.teras.db.dto.NoticeDto;
import com.teras.db.entity.Notice;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.AllArgsConstructor;
import springfox.documentation.annotations.ApiIgnore;

@Api(value = "공지사항 API", tags = { "Notice" })
@AllArgsConstructor
@RestController
@RequestMapping("/notice")
public class NoticeController {

	@Autowired
	NoticeService noticeService;

	@ApiOperation(value = "공지사항 작성", notes = "사용자가 공지사항을 작성한다.")
	@ApiResponses({ @ApiResponse(code = 200, message = "작성 성공"), @ApiResponse(code = 401, message = "인증 실패"),
			@ApiResponse(code = 500, message = "서버 오류") })
	@PostMapping()
	public ResponseEntity<? extends BaseResponseBody> register(@ApiIgnore Authentication authentication,
			@RequestBody @ApiParam(value = "공지사항 내용", required = true) NoticeRegisterPostReq registerInfo) {

		SsafyUserDetails userDetails = (SsafyUserDetails) authentication.getDetails();
		String userId = userDetails.getUsername();

		Notice notice = noticeService.createNotice(registerInfo, userId);

		return ResponseEntity.status(200).body(BaseResponseBody.of(200, "SUCCESS"));
	}

	@ApiOperation(value = "공지사항 전체 조회", notes = "모든 공지사항을 조회한다.")
	@ApiResponses({ @ApiResponse(code = 200, message = "조회 성공"), @ApiResponse(code = 500, message = "서버 오류") })

	@GetMapping("/page/{pageNo}")
	public ResponseEntity<? extends NoticeListGetRes> getList(@ApiIgnore Authentication authentication,
			@PathVariable(name = "pageNo") int page) {
		System.out.println("noticeList");
		SsafyUserDetails userDetails = (SsafyUserDetails) authentication.getDetails();
		String userId = userDetails.getUsername();

		List<NoticeDto> list = noticeService.getNoticeList(userId, page);
		int total = noticeService.getNoticeListTotal(userId);

		return ResponseEntity.status(200).body(NoticeListGetRes.of(200, "SUCCESS", list, total));
	}

	@ApiOperation(value = "특정 게시글 조회", notes = "특정 공지사항을 조회한다.")
	@ApiResponses({ @ApiResponse(code = 200, message = "조회 성공"), @ApiResponse(code = 404, message = "게시글 없음"),
			@ApiResponse(code = 500, message = "서버 오류") })
	@ApiImplicitParam(name = "noticeNo", value = "notice seq", required = true, dataType = "Long")
	@GetMapping("/{noticeNo}")
	public ResponseEntity<? extends BaseResponseBody> getNotice(@PathVariable Long noticeNo) {

		NoticeDto notice = noticeService.getNotice(noticeNo);
		
		if (notice == null) {
			return ResponseEntity.status(404).body(BaseResponseBody.of(404, "NOT_FOUND"));
		}

		return ResponseEntity.status(200).body(NoticeDetailGetRes.of(200, "SUCCESS", notice));
	}

	@ApiOperation(value = "공지사항 수정", notes = "특정 공지사항을 수정한다.")
	@ApiResponses({ @ApiResponse(code = 200, message = "수정 성공"), @ApiResponse(code = 401, message = "인증 실패"),
			@ApiResponse(code = 403, message = "권한 없음"), @ApiResponse(code = 404, message = "게시글 없음"),
			@ApiResponse(code = 500, message = "서버 오류") })
	@ApiImplicitParam(name = "noticeNo", value = "notice seq", required = true, dataType = "Long")
	@PutMapping("/{noticeNo}")
	public ResponseEntity<? extends BaseResponseBody> editNotice(@ApiIgnore Authentication authentication,
			@RequestBody @ApiParam(value = "게시글 수정", required = true) NoticeRegisterPostReq noticePostReq,
			@PathVariable Long noticeNo) {

		SsafyUserDetails userDetails = (SsafyUserDetails) authentication.getDetails();
		String userId = userDetails.getUsername();

		Boolean isNoticeEdited = noticeService.editNotice(noticeNo, userId, noticePostReq);

		if (isNoticeEdited == null) {
			return ResponseEntity.status(404).body(BaseResponseBody.of(404, "NOT_FOUND"));
		}
		if (isNoticeEdited == false) {
			return ResponseEntity.status(403).body(BaseResponseBody.of(403, "FORBIDDEN"));
		}

		return ResponseEntity.status(200).body(BaseResponseBody.of(200, "SUCCESS"));
	}

	@ApiOperation(value = "공지사항 삭제", notes = "공지사항을 삭제한다.")
	@ApiResponses({ @ApiResponse(code = 200, message = "삭제 성공"), @ApiResponse(code = 401, message = "인증 실패"),
			@ApiResponse(code = 403, message = "권한 없음"), @ApiResponse(code = 404, message = "게시글 없음"),
			@ApiResponse(code = 500, message = "서버 오류") })
	@ApiImplicitParam(name = "noticeNo", value = "notice seq", required = true, dataType = "Long")
	@DeleteMapping("/{noticeNo}")
	public ResponseEntity<? extends BaseResponseBody> delete(@ApiIgnore Authentication authentication,
			@PathVariable Long noticeNo) {

		SsafyUserDetails userDetails = (SsafyUserDetails) authentication.getDetails();
		String userId = userDetails.getUsername();

		Boolean isNoticeDeleted = noticeService.deleteNotice(noticeNo, userId);
		
		if (isNoticeDeleted == null) {
			return ResponseEntity.status(404).body(BaseResponseBody.of(404, "NOT_FOUND"));
		}
		if (isNoticeDeleted == false) {
			return ResponseEntity.status(403).body(BaseResponseBody.of(403, "FORBIDDEN"));
		}

		return ResponseEntity.status(200).body(BaseResponseBody.of(200, "SUCCESS"));
	}
}
