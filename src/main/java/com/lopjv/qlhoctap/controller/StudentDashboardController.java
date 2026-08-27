package com.lopjv.qlhoctap.controller;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lopjv.qlhoctap.dto.EnrolledCourseDto;
import com.lopjv.qlhoctap.dto.ExamForStudentDto;
import com.lopjv.qlhoctap.dto.ExamResultDto;
import com.lopjv.qlhoctap.dto.StudentInfoDto;
import com.lopjv.qlhoctap.entity.User;
import com.lopjv.qlhoctap.repository.EnrollmentRepository;
import com.lopjv.qlhoctap.repository.ExamQuestionRepository;
import com.lopjv.qlhoctap.repository.ExamRepository;
import com.lopjv.qlhoctap.repository.StudentExamRepository;
import com.lopjv.qlhoctap.repository.UserRepository;
import com.lopjv.qlhoctap.security.SecurityUtils;

@RestController
@RequestMapping("/api/v1/student")
public class StudentDashboardController {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final StudentExamRepository studentExamRepository;

    public StudentDashboardController(
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository,
            ExamRepository examRepository,
            ExamQuestionRepository examQuestionRepository,
            StudentExamRepository studentExamRepository) {
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.examRepository = examRepository;
        this.examQuestionRepository = examQuestionRepository;
        this.studentExamRepository = studentExamRepository;
    }

    /**
     * Lấy thông tin sinh viên hiện tại
     */
    @GetMapping("/info")
    public ResponseEntity<StudentInfoDto> getStudentInfo() {
        User currentUser = SecurityUtils.getCurrentUser(userRepository);
        StudentInfoDto info = StudentInfoDto.builder()
                .userId(currentUser.getId())
                .fullName(currentUser.getFullName())
                .email(currentUser.getEmail())
                .studentId("SV" + currentUser.getId())
                .department("Công nghệ Thông tin")
                .year("2024")
                .build();
        return ResponseEntity.ok(info);
    }

    /**
     * Lấy danh sách khóa học đã đăng ký
     */
    @GetMapping("/courses")
    public ResponseEntity<List<EnrolledCourseDto>> getEnrolledCourses() {
        User currentUser = SecurityUtils.getCurrentUser(userRepository);

        // Query enrollments của sinh viên hiện tại
        List<com.lopjv.qlhoctap.entity.Enrollment> enrollments
                = enrollmentRepository.findByStudentId(currentUser.getId());

        // Map enrollments thành EnrolledCourseDto
        List<EnrolledCourseDto> courses = new ArrayList<>();
        for (com.lopjv.qlhoctap.entity.Enrollment enrollment : enrollments) {
            com.lopjv.qlhoctap.entity.Course course = enrollment.getCourse();
            courses.add(EnrolledCourseDto.builder()
                    .courseId(course.getId())
                    .code(course.getCode())
                    .title(course.getTitle())
                    .description(course.getDescription())
                    .createdById(course.getCreatedBy().getId())
                    .createdByName(course.getCreatedBy().getFullName())
                    .totalStudents((int) enrollmentRepository.findByCourseId(course.getId()).size())
                    .build());
        }
        return ResponseEntity.ok(courses);
    }

    /**
     * Lấy danh sách kỳ thi sắp tới
     */
    @GetMapping("/upcoming-exams")
    public ResponseEntity<List<ExamForStudentDto>> getUpcomingExams() {
        List<ExamForStudentDto> exams = new ArrayList<>();
        User currentUser = SecurityUtils.getCurrentUser(userRepository);
        List<com.lopjv.qlhoctap.entity.Enrollment> enrollments = enrollmentRepository.findByStudentId(currentUser.getId());

        for (com.lopjv.qlhoctap.entity.Enrollment enrollment : enrollments) {
            examRepository.findBySubjectCourseIdAndStatusOrderByStartTime(enrollment.getCourse().getId(), "PUBLISHED")
                    .forEach(exam -> exams.add(ExamForStudentDto.builder()
                    .examId(exam.getId())
                    .title(exam.getTitle())
                    .subjectCode(exam.getSubject().getCode())
                    .subjectTitle(exam.getSubject().getTitle())
                    .startTime(exam.getStartTime())
                    .endTime(exam.getEndTime())
                    .durationMinutes(exam.getDurationMinutes())
                    .questionCount(examQuestionCount(exam.getId()))
                    .status(exam.getStatus())
                    .maxTabSwitches(exam.getMaxTabSwitches())
                    .build()));
        }

        return ResponseEntity.ok(exams);
    }

    private int examQuestionCount(Long examId) {
        return examQuestionRepository.findByExamIdOrderByOrderIndex(examId).size();
    }

    /**
     * Lấy danh sách kết quả thi
     */
    @GetMapping("/exam-results")
    public ResponseEntity<List<ExamResultDto>> getExamResults() {
        User currentUser = SecurityUtils.getCurrentUser(userRepository);
        List<com.lopjv.qlhoctap.entity.StudentExam> studentExams = studentExamRepository.findByStudentId(currentUser.getId());

        List<ExamResultDto> results = new ArrayList<>();
        for (com.lopjv.qlhoctap.entity.StudentExam studentExam : studentExams) {
            com.lopjv.qlhoctap.entity.Exam exam = studentExam.getExam();
            if (exam == null) {
                continue;
            }

            results.add(ExamResultDto.builder()
                    .resultId(studentExam.getId())
                    .examId(exam.getId())
                    .examTitle(exam.getTitle())
                    .subjectTitle(exam.getSubject() != null ? exam.getSubject().getTitle() : "")
                    .score(studentExam.getScore() != null ? studentExam.getScore().doubleValue() : 0.0)
                    .durationMinutes(exam.getDurationMinutes())
                    .status(studentExam.getStatus())
                    .startTime(studentExam.getStartTime())
                    .submitTime(studentExam.getSubmitTime())
                    .build());
        }

        results.sort((a, b) -> {
            OffsetDateTime right = b.getSubmitTime() != null ? b.getSubmitTime() : b.getStartTime();
            OffsetDateTime left = a.getSubmitTime() != null ? a.getSubmitTime() : a.getStartTime();
            if (left == null && right == null) {
                return 0;
            }
            if (left == null) {
                return 1;
            }
            if (right == null) {
                return -1;
            }
            return right.compareTo(left);
        });

        return ResponseEntity.ok(results);
    }

    /**
     * Lấy thống kê dashboard
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        User currentUser = SecurityUtils.getCurrentUser(userRepository);
        List<com.lopjv.qlhoctap.entity.StudentExam> studentExams = studentExamRepository.findByStudentId(currentUser.getId());
        List<com.lopjv.qlhoctap.entity.StudentExam> completedExams = studentExams.stream()
                .filter(exam -> "SUBMITTED".equals(exam.getStatus()) || "AUTO_SUBMITTED".equals(exam.getStatus()))
                .toList();
        double averageScore = completedExams.stream()
                .mapToDouble(exam -> exam.getScore() == null ? 0 : exam.getScore().doubleValue())
                .average()
                .orElse(0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCourses", enrollmentRepository.findByStudentId(currentUser.getId()).size());
        stats.put("activeCourses", enrollmentRepository.findByStudentId(currentUser.getId()).size());
        stats.put("completedExams", completedExams.size());
        stats.put("averageScore", averageScore);
        stats.put("attendanceRate", 0);
        stats.put("totalAssignments", 12);
        stats.put("submittedAssignments", 11);
        return ResponseEntity.ok(stats);
    }
}
