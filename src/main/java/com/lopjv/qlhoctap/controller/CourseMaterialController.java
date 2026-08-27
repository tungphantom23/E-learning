package com.lopjv.qlhoctap.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lopjv.qlhoctap.dto.CourseMaterialDto;
import com.lopjv.qlhoctap.dto.CreateCourseMaterialRequest;
import com.lopjv.qlhoctap.entity.User;
import com.lopjv.qlhoctap.repository.UserRepository;
import com.lopjv.qlhoctap.security.SecurityUtils;
import com.lopjv.qlhoctap.service.CourseMaterialService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class CourseMaterialController {

    private final CourseMaterialService courseMaterialService;
    private final UserRepository userRepository;

    public CourseMaterialController(CourseMaterialService courseMaterialService,
            UserRepository userRepository) {
        this.courseMaterialService = courseMaterialService;
        this.userRepository = userRepository;
    }

    /**
     * Lấy tất cả tài liệu đang hoạt động - Cho sinh viên và giảng viên
     */
    @GetMapping("/materials")
    public ResponseEntity<List<CourseMaterialDto>> getAllActiveMaterials() {
        return ResponseEntity.ok(courseMaterialService.getAllActiveMaterials());
    }

    /**
     * Lấy tất cả tài liệu của một khóa học - Cho sinh viên và giảng viên
     */
    @GetMapping("/courses/{courseId}/materials")
    public ResponseEntity<List<CourseMaterialDto>> getMaterialsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseMaterialService.getMaterialsByCourseId(courseId));
    }

    @GetMapping("/subjects/{subjectId}/materials")
    public ResponseEntity<List<CourseMaterialDto>> getMaterialsBySubject(@PathVariable Long subjectId) {
        return ResponseEntity.ok(courseMaterialService.getMaterialsBySubjectId(subjectId));
    }

    /**
     * Lấy tài liệu theo ID
     */
    @GetMapping("/materials/{id}")
    public ResponseEntity<CourseMaterialDto> getMaterialById(@PathVariable Long id) {
        return ResponseEntity.ok(courseMaterialService.getMaterialById(id));
    }

    /**
     * Tạo tài liệu mới - Chỉ cho giảng viên
     */
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PostMapping("/teacher/materials")
    public ResponseEntity<CourseMaterialDto> createMaterial(
            @Valid @RequestBody CreateCourseMaterialRequest request) {
        User currentUser = SecurityUtils.getCurrentUser(userRepository);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseMaterialService.createMaterial(currentUser.getId(), request));
    }

    /**
     * Cập nhật tài liệu - Chỉ cho giảng viên
     */
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PutMapping("/teacher/materials/{id}")
    public ResponseEntity<CourseMaterialDto> updateMaterial(
            @PathVariable Long id,
            @Valid @RequestBody CreateCourseMaterialRequest request) {
        return ResponseEntity.ok(courseMaterialService.updateMaterial(id, request));
    }

    /**
     * Xóa tài liệu - Chỉ cho giảng viên
     */
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @DeleteMapping("/teacher/materials/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        courseMaterialService.deleteMaterial(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy tất cả tài liệu được tải lên bởi giảng viên hiện tại
     */
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping("/teacher/materials")
    public ResponseEntity<List<CourseMaterialDto>> getMyMaterials() {
        User currentUser = SecurityUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(courseMaterialService.getMaterialsByUploadedBy(currentUser.getId()));
    }
}
