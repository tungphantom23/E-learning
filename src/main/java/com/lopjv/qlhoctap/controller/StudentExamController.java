package com.lopjv.qlhoctap.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lopjv.qlhoctap.dto.ExamQuestionForStudentDto;
import com.lopjv.qlhoctap.dto.ExamResultResponseDto;
import com.lopjv.qlhoctap.dto.SubmitExamRequestDto;
import com.lopjv.qlhoctap.entity.ExamQuestion;
import com.lopjv.qlhoctap.entity.StudentExam;
import com.lopjv.qlhoctap.entity.User;
import com.lopjv.qlhoctap.exception.ResourceNotFoundException;
import com.lopjv.qlhoctap.repository.ExamQuestionRepository;
import com.lopjv.qlhoctap.repository.StudentExamRepository;
import com.lopjv.qlhoctap.repository.UserRepository;
import com.lopjv.qlhoctap.security.SecurityUtils;
import com.lopjv.qlhoctap.service.AssessmentService;
import com.lopjv.qlhoctap.service.QuestionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class StudentExamController {

    private final StudentExamRepository studentExamRepository;
    private final AssessmentService assessmentService;
    private final UserRepository userRepository;
    private final QuestionService questionService;
    private final ExamQuestionRepository examQuestionRepository;

    public StudentExamController(StudentExamRepository studentExamRepository,
            AssessmentService assessmentService,
            UserRepository userRepository,
            QuestionService questionService,
            ExamQuestionRepository examQuestionRepository) {
        this.studentExamRepository = studentExamRepository;
        this.assessmentService = assessmentService;
        this.userRepository = userRepository;
        this.questionService = questionService;
        this.examQuestionRepository = examQuestionRepository;
    }

    /**
     * Sinh viên vào phòng thi — tạo bản ghi StudentExam. Kiểm tra đề thi
     * PUBLISHED, trong thời gian, chưa thi.
     */
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @PostMapping("/student/exams/{examId}/start")
    public ResponseEntity<StudentExam> startExam(@PathVariable Long examId) {
        User student = SecurityUtils.getCurrentUser(userRepository);
        return ResponseEntity.status(HttpStatus.CREATED).body(assessmentService.startExam(examId, student));
    }

    /**
     * Ghi nhận sự kiện chuyển tab của sinh viên (chống gian lận). Frontend gọi
     * mỗi khi phát hiện window blur event.
     */
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @PatchMapping("/student/exams/{examId}/tab-switch")
    public ResponseEntity<StudentExam> recordTabSwitch(@PathVariable Long examId) {
        User student = SecurityUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(assessmentService.recordTabSwitch(examId, student));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @GetMapping("/student/exams")
    public ResponseEntity<List<StudentExam>> getStudentExams() {
        User student = SecurityUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(studentExamRepository.findByStudentId(student.getId()));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @PostMapping("/student/exams/submit")
    public ResponseEntity<ExamResultResponseDto> submitExam(@Valid @RequestBody SubmitExamRequestDto requestDto) {
        User student = SecurityUtils.getCurrentUser(userRepository);
        requestDto.setStudentId(student.getId()); // Ghi đè ID sinh viên từ token để bảo mật
        return ResponseEntity.ok(assessmentService.submitAndGradeExam(requestDto));
    }

    /**
     * Sinh viên lấy câu hỏi đề thi (ẩn đáp án isCorrect)
     */
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @GetMapping("/student/exams/{examId}/questions")
    public ResponseEntity<List<ExamQuestionForStudentDto>> getExamQuestionsForStudent(@PathVariable Long examId) {
        return ResponseEntity.ok(questionService.getExamQuestionsForStudent(examId));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @GetMapping("/student/exams/{examId}/result")
    public ResponseEntity<StudentExam> getExamResult(@PathVariable Long examId) {
        User student = SecurityUtils.getCurrentUser(userRepository);
        StudentExam result = studentExamRepository.findByExamIdAndStudentId(examId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có kết quả thi cho môn này"));
        return ResponseEntity.ok(result);
    }

    /**
     * Lấy chi tiết đáp án: Câu hỏi + Đáp án đúng + Đáp án sinh viên
     */
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @GetMapping("/student/exams/{examId}/answer-details")
    public ResponseEntity<Map<String, Object>> getExamAnswerDetails(@PathVariable Long examId) {
        User student = SecurityUtils.getCurrentUser(userRepository);
        StudentExam result = studentExamRepository.findByExamIdAndStudentId(examId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có kết quả thi cho môn này"));

        Map<String, Object> response = new HashMap<>();
        response.put("studentExam", result);
        response.put("questions", questionService.getExamQuestionsForStudent(examId));

        return ResponseEntity.ok(response);
    }

    /**
     * Giáo viên xem câu hỏi đề thi (có đáp án đầy đủ)
     */
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping("/teacher/exams/{examId}/questions")
    public ResponseEntity<List<ExamQuestion>> getExamQuestionsForTeacher(@PathVariable Long examId) {
        return ResponseEntity.ok(examQuestionRepository.findByExamIdOrderByOrderIndex(examId));
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping("/teacher/exams/{examId}/results")
    public ResponseEntity<List<StudentExam>> getExamResults(@PathVariable Long examId) {
        return ResponseEntity.ok(studentExamRepository.findByExamId(examId));
    }
}
