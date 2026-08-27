package com.lopjv.qlhoctap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseMaterialDto {

    private Long id;
    private Long courseId;
    private Long subjectId;
    private String courseCode;
    private String courseName;
    private String subjectCode;
    private String subjectTitle;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String filePath;
    private String description;
    private Long uploadedById;
    private String uploadedByName;
    private String uploadedByEmail;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Boolean isActive;
}
