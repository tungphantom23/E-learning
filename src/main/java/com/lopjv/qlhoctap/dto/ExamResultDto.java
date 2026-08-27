package com.lopjv.qlhoctap.dto;

import java.time.OffsetDateTime;

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
public class ExamResultDto {

    private Long resultId;
    private Long examId;
    private String examTitle;
    private String subjectTitle;
    private Double score;
    private Integer durationMinutes;
    private String status;
    private OffsetDateTime startTime;
    private OffsetDateTime submitTime;
}
