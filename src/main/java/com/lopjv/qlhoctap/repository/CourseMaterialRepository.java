package com.lopjv.qlhoctap.repository;

import com.lopjv.qlhoctap.entity.CourseMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseMaterialRepository extends JpaRepository<CourseMaterial, Long> {

    /**
     * Lấy tất cả tài liệu của một khóa học
     */
    @Query("SELECT cm FROM CourseMaterial cm WHERE cm.course.id = :courseId AND cm.isActive = true ORDER BY cm.createdAt DESC")
    List<CourseMaterial> findByCourseIdAndActive(@Param("courseId") Long courseId);

    @Query("SELECT cm FROM CourseMaterial cm WHERE cm.subject.id = :subjectId AND cm.isActive = true ORDER BY cm.createdAt DESC")
    List<CourseMaterial> findBySubjectIdAndActive(@Param("subjectId") Long subjectId);

    /**
     * Lấy tất cả tài liệu được tải lên bởi một giảng viên
     */
    @Query("SELECT cm FROM CourseMaterial cm WHERE cm.uploadedBy.id = :userId AND cm.isActive = true ORDER BY cm.createdAt DESC")
    List<CourseMaterial> findByUploadedByAndActive(@Param("userId") Long userId);

    /**
     * Lấy tất cả tài liệu đang hoạt động
     */
    @Query("SELECT cm FROM CourseMaterial cm WHERE cm.isActive = true ORDER BY cm.createdAt DESC")
    List<CourseMaterial> findAllActive();
}
