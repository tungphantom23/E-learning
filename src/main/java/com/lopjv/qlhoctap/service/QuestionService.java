package com.lopjv.qlhoctap.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lopjv.qlhoctap.dto.CreateQuestionRequest;
import com.lopjv.qlhoctap.dto.ExamQuestionForStudentDto;
import com.lopjv.qlhoctap.dto.QuestionDto;
import com.lopjv.qlhoctap.dto.QuestionOptionDto;
import com.lopjv.qlhoctap.dto.QuestionOptionForStudentDto;
import com.lopjv.qlhoctap.entity.ExamQuestion;
import com.lopjv.qlhoctap.entity.Question;
import com.lopjv.qlhoctap.entity.QuestionOption;
import com.lopjv.qlhoctap.entity.Subject;
import com.lopjv.qlhoctap.entity.User;
import com.lopjv.qlhoctap.exception.ResourceNotFoundException;
import com.lopjv.qlhoctap.repository.ExamQuestionRepository;
import com.lopjv.qlhoctap.repository.QuestionOptionRepository;
import com.lopjv.qlhoctap.repository.QuestionRepository;
import com.lopjv.qlhoctap.repository.SubjectRepository;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final SubjectRepository subjectRepository;
    private final ExamQuestionRepository examQuestionRepository;

    public QuestionService(QuestionRepository questionRepository,
            QuestionOptionRepository questionOptionRepository,
            SubjectRepository subjectRepository,
            ExamQuestionRepository examQuestionRepository) {
        this.questionRepository = questionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.subjectRepository = subjectRepository;
        this.examQuestionRepository = examQuestionRepository;
    }

    public List<QuestionDto> getQuestionsBySubject(Long subjectId) {
        return questionRepository.findBySubjectId(subjectId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public QuestionDto getQuestionById(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với ID: " + id));
        return mapToDto(question);
    }

    /**
     * Tạo câu hỏi mới. createdBy được lấy từ JWT (không nhận từ client).
     */
    @Transactional
    public QuestionDto createQuestion(CreateQuestionRequest request, User createdBy) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học với ID: " + request.getSubjectId()));

        if (request.getOptions() == null || request.getOptions().size() < 2) {
            throw new IllegalArgumentException("Câu hỏi phải có ít nhất 2 phương án trả lời.");
        }

        long correctCount = request.getOptions().stream().filter(o -> Boolean.TRUE.equals(o.getIsCorrect())).count();
        if (request.getQuestionType() != null && request.getQuestionType().equalsIgnoreCase("SINGLE_CHOICE") && correctCount != 1) {
            throw new IllegalArgumentException("Câu hỏi SINGLE_CHOICE phải có đúng 1 đáp án đúng.");
        }

        Question question = Question.builder()
                .subject(subject)
                .createdBy(createdBy)
                .chapterTopic(request.getChapterTopic())
                .content(request.getContent().trim())
                .questionType(request.getQuestionType() == null ? "SINGLE_CHOICE" : request.getQuestionType().toUpperCase())
                .difficulty(request.getDifficulty().toUpperCase())
                .build();

        Question savedQuestion = questionRepository.save(question);

        List<QuestionOption> options = new ArrayList<>();
        for (CreateQuestionRequest.QuestionOptionInput optionInput : request.getOptions()) {
            options.add(QuestionOption.builder()
                    .question(savedQuestion)
                    .content(optionInput.getContent().trim())
                    .isCorrect(Boolean.TRUE.equals(optionInput.getIsCorrect()))
                    .build());
        }

        questionOptionRepository.saveAll(options);
        return mapToDto(savedQuestion);
    }

    /**
     * Cập nhật nội dung câu hỏi (content, chapterTopic, difficulty) và xóa/tạo
     * lại options.
     */
    @Transactional
    public QuestionDto updateQuestion(Long id, CreateQuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với ID: " + id));
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học với ID: " + request.getSubjectId()));

        if (request.getOptions() == null || request.getOptions().size() < 2) {
            throw new IllegalArgumentException("Câu hỏi phải có ít nhất 2 phương án trả lời.");
        }

        long correctCount = request.getOptions().stream().filter(o -> Boolean.TRUE.equals(o.getIsCorrect())).count();
        String questionType = request.getQuestionType() == null ? question.getQuestionType() : request.getQuestionType().toUpperCase();
        if ("SINGLE_CHOICE".equalsIgnoreCase(questionType) && correctCount != 1) {
            throw new IllegalArgumentException("Câu hỏi SINGLE_CHOICE phải có đúng 1 đáp án đúng.");
        }

        question.setContent(request.getContent().trim());
        question.setSubject(subject);
        question.setChapterTopic(request.getChapterTopic());
        question.setDifficulty(request.getDifficulty().toUpperCase());
        question.setQuestionType(questionType);
        questionRepository.save(question);

        // Xóa toàn bộ options cũ và tạo lại
        questionOptionRepository.deleteByQuestionId(id);
        List<QuestionOption> newOptions = new ArrayList<>();
        for (CreateQuestionRequest.QuestionOptionInput optionInput : request.getOptions()) {
            newOptions.add(QuestionOption.builder()
                    .question(question)
                    .content(optionInput.getContent().trim())
                    .isCorrect(Boolean.TRUE.equals(optionInput.getIsCorrect()))
                    .build());
        }
        questionOptionRepository.saveAll(newOptions);
        return mapToDto(question);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy câu hỏi với ID: " + id);
        }
        questionRepository.deleteById(id);
    }

    public List<ExamQuestionForStudentDto> getExamQuestionsForStudent(Long examId) {
        List<ExamQuestion> examQuestions = examQuestionRepository.findByExamIdOrderByOrderIndex(examId);
        List<ExamQuestionForStudentDto> result = new ArrayList<>();

        for (ExamQuestion eq : examQuestions) {
            Question question = eq.getQuestion();
            List<QuestionOption> options = questionOptionRepository.findByQuestionId(question.getId());

            List<QuestionOptionForStudentDto> optionDtos = options.stream()
                    .map(o -> QuestionOptionForStudentDto.builder()
                    .id(o.getId())
                    .content(o.getContent())
                    .build())
                    .collect(Collectors.toList());

            result.add(ExamQuestionForStudentDto.builder()
                    .id(question.getId())
                    .content(question.getContent())
                    .questionType(question.getQuestionType())
                    .options(optionDtos)
                    .build());
        }

        return result;
    }

    private QuestionDto mapToDto(Question question) {
        List<QuestionOption> options = questionOptionRepository.findByQuestionId(question.getId());

        return QuestionDto.builder()
                .id(question.getId())
                .subjectId(question.getSubject() != null ? question.getSubject().getId() : null)
                .subjectTitle(question.getSubject() != null ? question.getSubject().getTitle() : null)
                .chapterTopic(question.getChapterTopic())
                .content(question.getContent())
                .questionType(question.getQuestionType())
                .difficulty(question.getDifficulty())
                .options(options.stream().map(opt -> QuestionOptionDto.builder()
                .id(opt.getId())
                .content(opt.getContent())
                .isCorrect(opt.getIsCorrect())
                .build()).collect(Collectors.toList()))
                .build();
    }
}
