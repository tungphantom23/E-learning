package com.lopjv.qlhoctap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCourseMaterialRequest {

    @NotNull(message = "Mã khóa học không được để trống")
    private Long courseId;

    @NotNull(message = "Mã môn học không được để trống")
    private Long subjectId;

    @NotBlank(message = "Tên tệp không được để trống")
    private String fileName;

    @NotBlank(message = "Loại tệp không được để trống")
    private String fileType;

    @NotNull(message = "Kích thước tệp không được để trống")
    private Long fileSize;

    @NotBlank(message = "Đường dẫn tệp không được để trống")
    private String filePath;

    private String description;
}
