package com.lopjv.qlhoctap.controller;

import java.util.List;
import java.util.stream.Collectors;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lopjv.qlhoctap.dto.CreateQuestionRequest;
import com.lopjv.qlhoctap.dto.QuestionDto;
import com.lopjv.qlhoctap.dto.QuestionImportResultDto;
import com.lopjv.qlhoctap.entity.User;
import com.lopjv.qlhoctap.repository.QuestionRepository;
import com.lopjv.qlhoctap.repository.UserRepository;
import com.lopjv.qlhoctap.security.SecurityUtils;
import com.lopjv.qlhoctap.service.QuestionImportService;
import com.lopjv.qlhoctap.service.QuestionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class QuestionController {

    private final QuestionService questionService;
    private final QuestionImportService questionImportService;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    public QuestionController(QuestionService questionService,
            QuestionImportService questionImportService,
            QuestionRepository questionRepository,
            UserRepository userRepository) {
        this.questionService = questionService;
        this.questionImportService = questionImportService;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping("/teacher/questions")
    public ResponseEntity<List<QuestionDto>> getAllQuestions() {
        // Trong thực tế có thể filter theo teacher_id, ở đây lấy tất cả để đơn giản
        List<QuestionDto> dtos = questionRepository.findAll().stream()
                .map(q -> questionService.getQuestionById(q.getId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/subjects/{subjectId}/questions")
    public ResponseEntity<List<QuestionDto>> getQuestionsBySubject(@PathVariable Long subjectId) {
        return ResponseEntity.ok(questionService.getQuestionsBySubject(subjectId));
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<QuestionDto> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PostMapping("/teacher/questions")
    public ResponseEntity<QuestionDto> createQuestion(@Valid @RequestBody CreateQuestionRequest request) {
        User teacher = SecurityUtils.getCurrentUser(userRepository);
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createQuestion(request, teacher));
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PutMapping("/teacher/questions/{id}")
    public ResponseEntity<QuestionDto> updateQuestion(@PathVariable Long id,
            @Valid @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @DeleteMapping("/teacher/questions/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PostMapping("/teacher/questions/import")
    public ResponseEntity<QuestionImportResultDto> importQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam("subjectId") Long subjectId) {
        User teacher = SecurityUtils.getCurrentUser(userRepository);
        QuestionImportResultDto result = questionImportService.importQuestionsFromExcel(file, subjectId, teacher);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }
}
