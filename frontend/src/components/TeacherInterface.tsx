import React, { useEffect, useMemo, useState } from 'react';
import type { CourseMaterial as MaterialItem } from '../types/material';
import { coursesApiService, examApiService, questionsApiService, materialsApiService, umlApiService } from '../services/apiService';
import './styles/TeacherInterface.css';

// =============================================================================
// 1. INTERFACES
// =============================================================================
interface Course { id: number; code: string; title: string; description: string; }
interface Subject { id: number; courseId: number; code: string; title: string; teacherName?: string; description?: string; }
interface QuestionOption { content: string; isCorrect: boolean; }
interface Question {
  id: number; subjectId: number; content: string; chapterTopic: string; difficulty: string;
  questionType?: string; options?: QuestionOption[];
}
interface Exam {
  id: number; subjectId: number; title: string; durationMinutes: number;
  startTime: string; endTime: string; status: string; questions?: number;
}
interface UmlAssignment {
  id: number; subjectId: number; title: string; description: string;
  dueDate: string; maxScore: number; rubricCriteria?: string;
}
type CourseMaterial = MaterialItem;

type ViewKey = 'overview' | 'courses' | 'questions' | 'exams' | 'results' | 'reports';

interface TeacherInterfaceProps {
  onLogout?: () => void;
  materials?: CourseMaterial[];
  setMaterials?: (materials: CourseMaterial[]) => void;
  userName?: string;
}

const navItems: { key: ViewKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Tổng quan', icon: '📊' },
  { key: 'courses', label: 'Khóa học', icon: '📚' },
  { key: 'questions', label: 'Ngân hàng câu hỏi', icon: '❓' },
  { key: 'exams', label: 'Bài kiểm tra', icon: '📝' },
  { key: 'results', label: 'Kết quả học tập', icon: '📈' },
  { key: 'reports', label: 'Báo cáo', icon: '📄' },
];

const fallbackCourses: Course[] = [
  { id: 1, code: 'CNTT2026', title: 'Công nghệ thông tin', description: 'Chương trình đào tạo ngành Công nghệ thông tin' },
  { id: 2, code: 'SE2026', title: 'Kỹ thuật phần mềm', description: 'Chương trình đào tạo Kỹ thuật phần mềm' },
];

const fallbackSubjects: Subject[] = [
  { id: 1, courseId: 1, code: 'JAVA01', title: 'Lập trình Java' },
  { id: 2, courseId: 1, code: 'DB01', title: 'Cơ sở dữ liệu' },
  { id: 3, courseId: 1, code: 'WEB01', title: 'Lập trình Web' },
  { id: 4, courseId: 2, code: 'SE01', title: 'Công nghệ phần mềm' },
];

const fallbackQuestions: Question[] = [
  { id: 1, subjectId: 1, content: 'Java được phát triển bởi công ty nào?', chapterTopic: 'Java cơ bản', difficulty: 'EASY' },
  { id: 2, subjectId: 1, content: 'Tính chất nào cho phép một lớp kế thừa thuộc tính và phương thức?', chapterTopic: 'OOP', difficulty: 'EASY' },
  { id: 6, subjectId: 2, content: 'Lệnh SQL nào dùng để lấy dữ liệu từ bảng?', chapterTopic: 'SQL', difficulty: 'EASY' },
  { id: 9, subjectId: 3, content: 'Thẻ HTML nào dùng để tạo liên kết?', chapterTopic: 'HTML', difficulty: 'EASY' },
];

const fallbackExams: Exam[] = [
  { id: 1, subjectId: 1, title: 'Kiểm tra Java cơ bản', durationMinutes: 30, startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 90000000).toISOString(), status: 'Sắp diễn ra', questions: 5 },
  { id: 2, subjectId: 2, title: 'Kiểm tra Cơ sở dữ liệu', durationMinutes: 45, startTime: new Date(Date.now() + 172800000).toISOString(), endTime: new Date(Date.now() + 175200000).toISOString(), status: 'Sắp diễn ra', questions: 3 },
];

// =============================================================================
// 2. COMPONENT CON (Phải khai báo trước)
// =============================================================================

const TeacherOverview: React.FC<{ courses: Course[]; questions: Question[]; exams: Exam[]; onOpenCourse: (courseId: number) => void; }> = ({ courses, questions, exams, onOpenCourse }) => {
  const avatarText = 'GV';

  return (
  <div className="teacher-overview">
    <div className="teacher-overview-greeting">
      <div className="teacher-greeting-content">
        <div className="teacher-greeting-avatar">{avatarText}</div>
        <div>
          <h2 className="teacher-greeting-title">Xin chào, Giảng viên!</h2>
          <p className="teacher-greeting-meta">Tổng quan hoạt động dạy học của bạn</p>
        </div>
      </div>
    </div>
    <div className="teacher-dashboard-stats">
      <div className="teacher-dashboard-stat-item">
        <div className="teacher-dashboard-stat-number">{courses?.length || 0}</div>
        <div className="teacher-dashboard-stat-label">Khóa học</div>
      </div>
      <div className="teacher-dashboard-stat-item">
        <div className="teacher-dashboard-stat-number">{questions?.length || 0}</div>
        <div className="teacher-dashboard-stat-label">Câu hỏi</div>
      </div>
      <div className="teacher-dashboard-stat-item">
        <div className="teacher-dashboard-stat-number">{exams?.length || 0}</div>
        <div className="teacher-dashboard-stat-label">Bài thi hiện có</div>
      </div>
    </div>
    <section className="teacher-overview-courses">
      <div className="teacher-section-heading"><h2>Khóa học của bạn</h2><span>{courses.length} khóa học</span></div>
      <div className="teacher-course-cards">
        {courses.length === 0 ? <p className="teacher-simple-table__empty">Chưa có khóa học nào.</p> : courses.map(course => (
          <button key={course.id} className="teacher-course-card" onClick={() => onOpenCourse(course.id)} type="button">
            <strong>{course.code}</strong><h3>{course.title}</h3><p>{course.description || 'Chưa có mô tả khóa học.'}</p><span>Xem môn học →</span>
          </button>
        ))}
      </div>
    </section>
  </div>
  );
};

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
];

const QUESTION_TYPE_OPTIONS = [
  { value: 'SINGLE_CHOICE', label: 'Một đáp án đúng' },
  { value: 'MULTIPLE_CHOICE', label: 'Nhiều đáp án đúng' },
];

const emptyOptions = (): QuestionOption[] => [
  { content: '', isCorrect: false },
  { content: '', isCorrect: false },
];

const emptyNewQuestion = () => ({
  subjectId: 0,
  chapterTopic: '',
  content: '',
  questionType: 'SINGLE_CHOICE',
  difficulty: 'EASY',
  options: emptyOptions(),
});

const TeacherDashboardStats: React.FC<{ coursesCount: number; questionsCount: number; examsCount: number; }> = ({ coursesCount, questionsCount, examsCount }) => (
  <div className="teacher-dashboard-stats">
    <div className="teacher-dashboard-stat-item">
      <div className="teacher-dashboard-stat-number">{coursesCount}</div>
      <div className="teacher-dashboard-stat-label">Khóa học</div>
    </div>
    <div className="teacher-dashboard-stat-item">
      <div className="teacher-dashboard-stat-number">{questionsCount}</div>
      <div className="teacher-dashboard-stat-label">Câu hỏi</div>
    </div>
    <div className="teacher-dashboard-stat-item">
      <div className="teacher-dashboard-stat-number">{examsCount}</div>
      <div className="teacher-dashboard-stat-label">Bài thi</div>
    </div>
  </div>
);

const TeacherQuestionBank: React.FC<{ questions: Question[]; setQuestions: (qs: Question[]) => void; subjects: Subject[]; showToast: (m: string) => void }> = ({ questions, setQuestions, subjects, showToast }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newQ, setNewQ] = useState(emptyNewQuestion());
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  useEffect(() => {
    if (subjects.length > 0 && newQ.subjectId === 0) {
      setNewQ(prev => ({ ...prev, subjectId: subjects[0].id }));
    }
  }, [subjects, newQ.subjectId]);

  const updateOption = (index: number, changes: Partial<QuestionOption>) => {
    setNewQ(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => {
        if (i !== index) {
          // Chỉ 1 đáp án đúng khi là câu hỏi 1 lựa chọn
          return prev.questionType === 'SINGLE_CHOICE' && changes.isCorrect ? { ...opt, isCorrect: false } : opt;
        }
        return { ...opt, ...changes };
      }),
    }));
  };

  const addOption = () => setNewQ(prev => ({ ...prev, options: [...prev.options, { content: '', isCorrect: false }] }));

  const removeOption = (index: number) => setNewQ(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));

  const resetForm = () => {
    setNewQ(emptyNewQuestion());
    setEditingQuestionId(null);
    setShowForm(false);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestionId(question.id);
    setNewQ({
      subjectId: question.subjectId,
      chapterTopic: question.chapterTopic || '',
      content: question.content,
      questionType: question.questionType || 'SINGLE_CHOICE',
      difficulty: question.difficulty,
      options: question.options?.map(option => ({ content: option.content, isCorrect: option.isCorrect })) || emptyOptions(),
    });
    setShowForm(true);
  };

  const handleDelete = async (question: Question) => {
    if (!window.confirm('Xóa câu hỏi này? Hành động này không thể hoàn tác.')) return;
    try {
      await questionsApiService.deleteQuestion(question.id);
      setQuestions(questions.filter(item => item.id !== question.id));
      showToast('Đã xóa câu hỏi.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi khi xóa câu hỏi.');
    }
  };

  const handleSave = async () => {
    const filledOptions = newQ.options.filter(opt => opt.content.trim() !== '');
    if (!newQ.content.trim() || !newQ.chapterTopic.trim() || newQ.subjectId === 0) {
      return showToast('Vui lòng điền đủ thông tin.');
    }
    if (filledOptions.length < 2) {
      return showToast('Cần ít nhất 2 đáp án.');
    }
    if (!filledOptions.some(opt => opt.isCorrect)) {
      return showToast('Hãy chọn ít nhất 1 đáp án đúng.');
    }
    setLoading(true);
    try {
      const payload = { ...newQ, options: filledOptions };
      const saved = editingQuestionId
        ? await questionsApiService.updateQuestion(editingQuestionId, payload)
        : await questionsApiService.createQuestion(payload);
      setQuestions(editingQuestionId
        ? questions.map(question => question.id === editingQuestionId ? saved : question)
        : [saved, ...questions]);
      resetForm();
      showToast(editingQuestionId ? 'Đã cập nhật câu hỏi!' : 'Đã lưu câu hỏi thành công!');
    } catch (e) { showToast(e instanceof Error ? e.message : 'Lỗi khi lưu câu hỏi.'); } finally { setLoading(false); }
  };

  return (
    <div className="teacher-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Ngân hàng câu hỏi</h2>
        <button className="teacher-button teacher-button--primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Thêm câu hỏi</button>
      </div>
      {showForm && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal">
            <h3>{editingQuestionId ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}</h3>

            <div className="teacher-question-form-table">
              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Môn học</label>
                <div className="teacher-question-form-value">
                  <select value={newQ.subjectId} onChange={e => setNewQ({ ...newQ, subjectId: parseInt(e.target.value) })}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Chủ đề / chương</label>
                <div className="teacher-question-form-value">
                  <input placeholder="Ví dụ: OOP, SQL..." value={newQ.chapterTopic} onChange={e => setNewQ({ ...newQ, chapterTopic: e.target.value })} />
                </div>
              </div>

              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Nội dung câu hỏi</label>
                <div className="teacher-question-form-value">
                  <textarea placeholder="Nhập nội dung câu hỏi..." value={newQ.content} onChange={e => setNewQ({ ...newQ, content: e.target.value })} />
                </div>
              </div>

              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Loại câu hỏi</label>
                <div className="teacher-question-form-value">
                  <select
                    value={newQ.questionType}
                    onChange={e => {
                      const questionType = e.target.value;
                      setNewQ(prev => ({
                        ...prev,
                        questionType,
                        options: questionType === 'SINGLE_CHOICE'
                          ? prev.options.map((opt, i) => ({ ...opt, isCorrect: i === prev.options.findIndex(o => o.isCorrect) }))
                          : prev.options,
                      }));
                    }}
                  >
                    {QUESTION_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Độ khó</label>
                <div className="teacher-question-form-value">
                  <select value={newQ.difficulty} onChange={e => setNewQ({ ...newQ, difficulty: e.target.value })}>
                    {DIFFICULTY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Đáp án</label>
                <div className="teacher-question-form-value">
                  <div className="teacher-answer-table">
                    <div className="teacher-answer-table__head">
                      <span>{newQ.questionType === 'SINGLE_CHOICE' ? 'Đúng (1 lựa chọn)' : 'Đúng (nhiều lựa chọn)'}</span>
                      <span>Nội dung đáp án</span>
                      <span>Thao tác</span>
                    </div>
                    {newQ.options.map((opt, index) => (
                      <div key={index} className="teacher-answer-table__row">
                        <div className="teacher-answer-table__flag">
                          <input
                            type={newQ.questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                            name="correct-option"
                            checked={opt.isCorrect}
                            onChange={e => updateOption(index, { isCorrect: e.target.checked })}
                          />
                        </div>
                        <input
                          placeholder={`Đáp án ${index + 1}`}
                          value={opt.content}
                          onChange={e => updateOption(index, { content: e.target.value })}
                        />
                        <button
                          type="button"
                          className="teacher-button"
                          onClick={() => removeOption(index)}
                          disabled={newQ.options.length <= 2}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    <button type="button" className="teacher-button teacher-answer-table__add" onClick={addOption}>+ Thêm đáp án</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '10px' }}>
              <button className="teacher-button teacher-button--primary" onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : (editingQuestionId ? 'Lưu thay đổi' : 'Lưu vào Database')}</button>
              <button className="teacher-button" onClick={resetForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}
      <div className="teacher-questions-list">
        {questions.map(q => (
          <div key={q.id} className="teacher-question-item">
            <strong>{q.content}</strong>
            <p>Môn: {subjects.find(s => s.id === q.subjectId)?.title || 'N/A'} | Chủ đề: {q.chapterTopic || 'N/A'}</p>
            <p>Loại: {QUESTION_TYPE_OPTIONS.find(o => o.value === q.questionType)?.label || q.questionType || 'N/A'} | Độ khó: {DIFFICULTY_OPTIONS.find(o => o.value === q.difficulty)?.label || q.difficulty}</p>
            {q.options && q.options.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                {q.options.map((opt, i) => (
                  <li key={i} style={{ color: opt.isCorrect ? '#16a34a' : 'inherit', fontWeight: opt.isCorrect ? 600 : 400 }}>
                    {opt.content}{opt.isCorrect ? ' (đúng)' : ''}
                  </li>
                ))}
              </ul>
            )}
            <div className="teacher-row-actions" style={{ marginTop: '10px' }}>
              <button className="teacher-button" onClick={() => handleEdit(q)}>Sửa</button>
              <button className="teacher-button teacher-button--danger" onClick={() => handleDelete(q)}>Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const toDatetimeLocal = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const emptyNewExam = () => ({ title: '', durationMinutes: 30, startTime: '', endTime: '', subjectId: 0 });

const TeacherExamsPanel: React.FC<{ exams: Exam[]; questions: Question[]; setExams: (exs: Exam[]) => void; subjects: Subject[]; showToast: (m: string) => void }> = ({ exams, questions, setExams, subjects, showToast }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newExam, setNewExam] = useState(emptyNewExam());
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [submissionSummary, setSubmissionSummary] = useState<Record<number, { count: number; names: string[]; scores: Array<{ name: string; score: number | null }> }>>({});

  useEffect(() => {
    const loadSummaries = async () => {
      const summaries: Record<number, { count: number; names: string[]; scores: Array<{ name: string; score: number | null }> }> = {};
      for (const exam of exams) {
        try {
          const submissions = await examApiService.getExamResults(exam.id);
          const scoreEntries = Array.isArray(submissions)
            ? submissions.map((item: any) => {
                const name = item.student?.fullName || item.student?.username || item.studentName || 'Sinh viên';
                const rawScore = item.score ?? item.finalScore ?? item.totalScore ?? null;
                const numericScore = rawScore === null || rawScore === undefined || rawScore === '' ? null : Number(rawScore);
                return {
                  name,
                  score: Number.isFinite(numericScore) ? numericScore : null,
                };
              })
            : [];

          summaries[exam.id] = {
            count: scoreEntries.length,
            names: scoreEntries.map(entry => entry.name),
            scores: scoreEntries,
          };
        } catch {
          summaries[exam.id] = { count: 0, names: [], scores: [] };
        }
      }
      setSubmissionSummary(summaries);
    };

    if (exams.length > 0) {
      void loadSummaries();
    }
  }, [exams]);

  useEffect(() => {
    if (subjects.length > 0 && newExam.subjectId === 0) {
      setNewExam(prev => ({ ...prev, subjectId: subjects[0].id }));
    }
  }, [subjects, newExam.subjectId]);

  const resetForm = () => {
    setNewExam(emptyNewExam());
    setSelectedIds([]);
    setEditingExamId(null);
    setShowForm(false);
  };

  const handleEdit = async (exam: Exam) => {
    setNewExam({
      title: exam.title,
      durationMinutes: exam.durationMinutes,
      startTime: toDatetimeLocal(exam.startTime),
      endTime: toDatetimeLocal(exam.endTime),
      subjectId: exam.subjectId,
    });
    setEditingExamId(exam.id);
    setShowForm(true);
    try {
      const examQuestions = await examApiService.getExamQuestions(exam.id);
      setSelectedIds(examQuestions.map((eq: any) => eq.question?.id).filter(Boolean));
    } catch {
      setSelectedIds([]);
      showToast('Không thể tải danh sách câu hỏi hiện có của bài thi.');
    }
  };

  const handleDelete = async (exam: Exam) => {
    if (!window.confirm(`Xóa bài kiểm tra "${exam.title}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await examApiService.deleteExam(exam.id);
      setExams(exams.filter(e => e.id !== exam.id));
      showToast('Đã xóa bài kiểm tra.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi khi xóa bài thi.');
    }
  };

  const handleCreate = async () => {
    if (!newExam.title || !newExam.startTime || !newExam.endTime || newExam.subjectId === 0) return showToast('Vui lòng nhập đủ thông tin.');
    if (selectedIds.length === 0) return showToast('Hãy chọn ít nhất 1 câu hỏi.');
    setLoading(true);
    try {
      const payload = { ...newExam, selectedQuestionIds: selectedIds };
      if (editingExamId) {
        const saved = await examApiService.updateExam(editingExamId, payload);
        setExams(exams.map(e => (e.id === editingExamId ? { ...e, ...saved, subjectId: saved.subject?.id ?? newExam.subjectId, questions: selectedIds.length } : e)));
        showToast('Đã cập nhật bài kiểm tra!');
      } else {
        const saved = await examApiService.createExam(payload);
        setExams([{ ...saved, subjectId: saved.subject?.id ?? newExam.subjectId, questions: selectedIds.length }, ...exams]);
        showToast('Bài thi đã được lưu vĩnh viễn!');
      }
      resetForm();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi khi lưu bài thi.');
    } finally { setLoading(false); }
  };

  return (
    <div className="teacher-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Bài kiểm tra</h2>
        <button className="teacher-button teacher-button--primary" onClick={() => setShowForm(true)}>+ Tạo bài thi mới</button>
      </div>
      {showForm && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal">
            <h3>{editingExamId ? 'Chỉnh sửa đề thi' : 'Cấu hình đề thi'}</h3>
            <select value={newExam.subjectId} onChange={e => setNewExam({ ...newExam, subjectId: parseInt(e.target.value) })}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <input placeholder="Tiêu đề..." value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} style={{ width: '100%', margin: '10px 0' }} />
            <input type="datetime-local" value={newExam.startTime} onChange={e => setNewExam({ ...newExam, startTime: e.target.value })} style={{ width: '100%' }} />
            <input type="datetime-local" value={newExam.endTime} onChange={e => setNewExam({ ...newExam, endTime: e.target.value })} style={{ width: '100%', margin: '10px 0' }} />
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
              {questions.filter(q => q.subjectId === newExam.subjectId).map(q => (
                <label key={q.id} style={{ display: 'block', fontSize: '12px' }}>
                  <input type="checkbox" checked={selectedIds.includes(q.id)} onChange={e => e.target.checked ? setSelectedIds([...selectedIds, q.id]) : setSelectedIds(selectedIds.filter(id => id !== q.id))} />
                  {q.content}
                </label>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: '10px' }}>
              <button className="teacher-button teacher-button--primary" onClick={handleCreate} disabled={loading}>{loading ? 'Đang lưu...' : (editingExamId ? 'Lưu thay đổi' : 'Tạo bài thi')}</button>
              <button className="teacher-button" onClick={resetForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}
      <div className="teacher-simple-table">
        <table>
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Môn học</th>
              <th>Thời lượng</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Số câu hỏi</th>
              <th>Sinh viên làm</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr><td colSpan={8} className="teacher-simple-table__empty">Chưa có bài kiểm tra nào.</td></tr>
            ) : exams.map(exam => (
              <tr key={exam.id}>
                <td>{exam.title}</td>
                <td>{subjects.find(s => s.id === exam.subjectId)?.title || 'Đang tải...'}</td>
                <td>{exam.durationMinutes} phút</td>
                <td>{new Date(exam.startTime).toLocaleString('vi-VN')}</td>
                <td>{new Date(exam.endTime).toLocaleString('vi-VN')}</td>
                <td>{exam.questions ?? '-'}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
                    <strong>{submissionSummary[exam.id]?.count ?? 0} sinh viên</strong>
                    {submissionSummary[exam.id]?.scores?.length ? (
                      <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {submissionSummary[exam.id].scores.slice(0, 3).map((item, idx) => (
                          <span key={`${exam.id}-${item.name}-${idx}`}>
                            {item.name}: <strong>{item.score !== null ? `${item.score}/10` : 'Chưa chấm'}</strong>
                          </span>
                        ))}
                        {(submissionSummary[exam.id].scores.length > 3) && <span>...</span>}
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Chưa có sinh viên nào</span>
                    )}
                  </div>
                </td>
                <td><span className="teacher-status-badge">{exam.status}</span></td>
                <td>
                  <div className="teacher-row-actions">
                    <button className="teacher-button" onClick={() => handleEdit(exam)}>Sửa</button>
                    <button className="teacher-button teacher-button--danger" onClick={() => handleDelete(exam)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const emptyNewUmlAssignment = () => ({
  subjectId: 0,
  title: '',
  description: '',
  dueDate: '',
  rubricCriteria: '',
  maxScore: '10.00',
});

const TeacherUmlPanel: React.FC<{ assignments: UmlAssignment[]; setAssignments: (a: UmlAssignment[]) => void; subjects: Subject[]; showToast: (m: string) => void }> = ({ assignments, setAssignments, subjects, showToast }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAssignment, setNewAssignment] = useState(emptyNewUmlAssignment());
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  useEffect(() => {
    if (subjects.length > 0 && newAssignment.subjectId === 0) {
      setNewAssignment(prev => ({ ...prev, subjectId: subjects[0].id }));
    }
  }, [subjects, newAssignment.subjectId]);

  const resetForm = () => {
    setNewAssignment(emptyNewUmlAssignment());
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!newAssignment.title.trim() || !newAssignment.description.trim() || !newAssignment.dueDate || newAssignment.subjectId === 0) {
      return showToast('Vui lòng nhập đủ thông tin.');
    }
    setLoading(true);
    try {
      // Backend dùng OffsetDateTime.parse nên bắt buộc chuỗi phải có offset (Z)
      const dueDateIso = new Date(newAssignment.dueDate).toISOString();
      const saved = await umlApiService.createAssignment({ ...newAssignment, dueDate: dueDateIso });
      const normalized: UmlAssignment = {
        id: saved.id,
        subjectId: saved.subject?.id ?? newAssignment.subjectId,
        title: saved.title,
        description: saved.description,
        dueDate: saved.dueDate,
        maxScore: Number(saved.maxScore),
        rubricCriteria: saved.rubricCriteria,
      };
      setAssignments([normalized, ...assignments]);
      resetForm();
      showToast('Đã tạo bài kiểm tra UML thành công!');
    } catch (e) {
      console.error('Lỗi khi tạo bài kiểm tra UML:', e);
      showToast(e instanceof Error ? e.message : 'Lỗi khi tạo bài kiểm tra UML.');
    } finally { setLoading(false); }
  };

  return (
    <div className="teacher-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Bài kiểm tra UML</h2>
        <button className="teacher-button teacher-button--primary" onClick={() => setShowForm(true)}>+ Tạo bài kiểm tra UML</button>
      </div>
      {showForm && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal">
            <h3>Tạo bài kiểm tra UML</h3>
            <div className="teacher-question-form-table">
              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Môn học</label>
                <div className="teacher-question-form-value">
                  <select value={newAssignment.subjectId} onChange={e => setNewAssignment({ ...newAssignment, subjectId: parseInt(e.target.value) })}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Tiêu đề</label>
                <div className="teacher-question-form-value">
                  <input placeholder="Ví dụ: Thiết kế UML hệ thống bán hàng" value={newAssignment.title} onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })} />
                </div>
              </div>
              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Mô tả đề bài</label>
                <div className="teacher-question-form-value">
                  <textarea placeholder="Yêu cầu chi tiết cho sinh viên..." value={newAssignment.description} onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })} />
                </div>
              </div>
              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Tiêu chí chấm điểm</label>
                <div className="teacher-question-form-value">
                  <textarea placeholder="Ví dụ: Đầy đủ lớp; quan hệ kế thừa; multiplicity..." value={newAssignment.rubricCriteria} onChange={e => setNewAssignment({ ...newAssignment, rubricCriteria: e.target.value })} />
                </div>
              </div>
              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Điểm tối đa</label>
                <div className="teacher-question-form-value">
                  <input type="number" min="1" max="10" step="0.5" value={newAssignment.maxScore} onChange={e => setNewAssignment({ ...newAssignment, maxScore: e.target.value })} />
                </div>
              </div>
              <div className="teacher-question-form-row">
                <label className="teacher-question-form-key">Hạn nộp</label>
                <div className="teacher-question-form-value">
                  <input type="datetime-local" value={newAssignment.dueDate} onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '10px' }}>
              <button className="teacher-button teacher-button--primary" onClick={handleCreate} disabled={loading}>{loading ? 'Đang lưu...' : 'Tạo bài kiểm tra UML'}</button>
              <button className="teacher-button" onClick={resetForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}
      <div className="teacher-simple-table">
        <table>
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Môn học</th>
              <th>Hạn nộp</th>
              <th>Điểm tối đa</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr><td colSpan={4} className="teacher-simple-table__empty">Chưa có bài kiểm tra UML nào.</td></tr>
            ) : assignments.map(a => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{subjects.find(s => s.id === a.subjectId)?.title || 'N/A'}</td>
                <td>{new Date(a.dueDate).toLocaleString('vi-VN')}</td>
                <td>{a.maxScore}</td>
                <td>
                  <button className="teacher-button" onClick={() => setSelectedAssignmentId(a.id)}>Xem nộp bài</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedAssignmentId && (
        <div style={{ marginTop: 12 }}>
          <h3>Danh sách nộp bài</h3>
          <button onClick={() => setSelectedAssignmentId(null)} style={{ marginBottom: 8 }}>Đóng</button>
          <TeacherUmlSubmissionsView assignmentId={selectedAssignmentId} maxScore={assignments.find(x => x.id === selectedAssignmentId)?.maxScore} />
        </div>
      )}
    </div>
  );
};

// Renders PlantUML source as an image via the public PlantUML server.
// Using a direct image URL avoids browser fetch/CORS issues that caused 'Failed to fetch'.
const PlantUmlImage: React.FC<{ source: string }> = ({ source }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [source]);

  if (!source || !source.trim()) {
    return <div style={{ color: '#64748b', marginTop: 8 }}>Không có mã PlantUML để hiển thị.</div>;
  }

  try {
    const hex = Array.from(new TextEncoder().encode(source))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    const imgUrl = `https://www.plantuml.com/plantuml/png/~h${hex}`;

    return (
      <img
        src={imgUrl}
        alt="PlantUML render"
        style={{ maxWidth: '100%', border: '1px solid #e2e8f0', borderRadius: 6, marginTop: 8 }}
        onError={() => setError('Không thể dựng hình PlantUML từ mã nguồn. Vui lòng kiểm tra mã UML.')}
      />
    );
  } catch {
    return <div style={{ color: '#ef4444', marginTop: 8 }}>Lỗi dựng hình PlantUML.</div>;
  }
};

// Small sub-component for teacher to view submissions and grade
const TeacherResultsPanel: React.FC<{ courses: Course[]; subjects: Subject[]; exams: Exam[]; showToast: (m: string) => void }> = ({ courses, subjects, exams, showToast }) => {
  const [rows, setRows] = useState<Array<{ studentName: string; courseTitle: string; examsCompleted: number; averageScore: number; studentId: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      if (exams.length === 0) {
        setRows([]);
        return;
      }

      setLoading(true);
      try {
        // Map to store student results by studentId + courseId
        const studentResultsMap = new Map<string, { studentName: string; courseTitle: string; scores: number[]; studentId: number; courseId: number }>();

        for (const exam of exams) {
          const subject = subjects.find(s => s.id === exam.subjectId);
          const course = subject ? courses.find(c => c.id === subject.courseId) : undefined;
          const courseId = course?.id || 0;

          const results = await examApiService.getExamResults(exam.id).catch(() => []);
          for (const result of results) {
            const studentName = result.student?.fullName || result.student?.username || 'Sinh viên';
            const studentId = result.student?.id || 0;
            const scoreValue = result.score !== null && result.score !== undefined ? Number(result.score) : null;
            
            // Only include if score is not null
            if (scoreValue !== null && Number.isFinite(scoreValue)) {
              const key = `${studentId}-${courseId}`;
              if (!studentResultsMap.has(key)) {
                studentResultsMap.set(key, {
                  studentName,
                  courseTitle: course?.title || 'Không xác định',
                  scores: [],
                  studentId,
                  courseId,
                });
              }
              const entry = studentResultsMap.get(key);
              if (entry) entry.scores.push(scoreValue);
            }
          }
        }

        // Convert map to rows
        const aggregated = Array.from(studentResultsMap.values()).map(entry => ({
          studentName: entry.studentName,
          courseTitle: entry.courseTitle,
          examsCompleted: entry.scores.length,
          averageScore: entry.scores.length > 0 ? Number((entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length).toFixed(2)) : 0,
          studentId: entry.studentId,
        }));

        setRows(aggregated);
      } catch (error) {
        console.error('Lỗi tải bảng kết quả học tập:', error);
        setRows([]);
        showToast('Không thể tải dữ liệu kết quả học tập từ database.');
      } finally {
        setLoading(false);
      }
    };

    void loadResults();
  }, [courses, subjects, exams, showToast]);

  const totalStudents = rows.length;
  const totalExams = rows.reduce((sum, row) => sum + row.examsCompleted, 0);
  const overallAverage = rows.length > 0 ? (rows.reduce((sum, row) => sum + row.averageScore, 0) / rows.length).toFixed(1) : '0.0';

  if (loading) return <div className="teacher-section"><h2>Kết quả học tập</h2><p>Đang tải dữ liệu từ database...</p></div>;

  return (
    <div className="teacher-section">
      <h2>Kết quả học tập</h2>
      <div className="teacher-dashboard-stats" style={{ marginBottom: '16px' }}>
        <div className="teacher-dashboard-stat-item">
          <div className="teacher-dashboard-stat-number">{totalStudents}</div>
          <div className="teacher-dashboard-stat-label">Số sinh viên</div>
        </div>
        <div className="teacher-dashboard-stat-item">
          <div className="teacher-dashboard-stat-number">{totalExams}</div>
          <div className="teacher-dashboard-stat-label">Bài kiểm tra</div>
        </div>
        <div className="teacher-dashboard-stat-item">
          <div className="teacher-dashboard-stat-number">{overallAverage}</div>
          <div className="teacher-dashboard-stat-label">Điểm TB chung</div>
        </div>
      </div>

      <div className="teacher-simple-table">
        <table>
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Khóa học</th>
              <th>Số bài kiểm tra</th>
              <th>Điểm trung bình</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="teacher-simple-table__empty">Chưa có dữ liệu kết quả học tập từ database.</td></tr>
            ) : rows.map((row) => (
              <tr key={`${row.studentId}-${row.courseTitle}`}>
                <td>{row.studentName}</td>
                <td>{row.courseTitle}</td>
                <td>{row.examsCompleted}</td>
                <td><strong>{row.averageScore}/10</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TeacherUmlSubmissionsView: React.FC<{ assignmentId: number; maxScore?: number }> = ({ assignmentId, maxScore = 10 }) => {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Record<number, { finalScore: string; teacherFeedback: string }>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await umlApiService.getSubmissionsByAssignment(assignmentId);
      setSubs(res);
    } catch (e) {
      setSubs([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [assignmentId]);

  const handleGrade = async (id: number) => {
    const data = editing[id];
    if (!data) return;
    const parsed = Number(data.finalScore);
    if (Number.isNaN(parsed)) return alert('Vui lòng nhập một số hợp lệ cho điểm.');
    if (parsed < 0 || parsed > Number(maxScore)) return alert(`Điểm phải trong khoảng 0 - ${maxScore}.`);
    try {
      await umlApiService.gradeSubmission(id, { finalScore: parsed, teacherFeedback: data.teacherFeedback });
      await load();
      alert('Đã lưu điểm.');
    } catch (e: any) { alert(e.message || 'Lỗi khi chấm bài'); }
  };

  if (loading) return <div>Đang tải danh sách nộp bài...</div>;
  if (subs.length === 0) return <div>Chưa có sinh viên nộp bài cho bài kiểm tra này.</div>;

  // Danh sách nộp bài
  if (selectedSubmissionId === null) {
    const graded = subs.filter(s => s.finalScore !== null && s.finalScore !== undefined).length;
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <strong>Tổng nộp:</strong> {subs.length} | <strong>Đã chấm:</strong> {graded}
          </div>
        </div>
        <div className="teacher-simple-table">
          <table>
            <thead>
              <tr>
                <th>Tên sinh viên</th>
                <th>Ngày nộp</th>
                <th>Trạng thái</th>
                <th>Điểm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>{s.student?.fullName || s.student?.username || s.student?.email || 'ID:' + s.student?.id}</td>
                  <td>{s.submittedAt ? new Date(s.submittedAt).toLocaleString('vi-VN') : 'N/A'}</td>
                  <td>{s.status || 'SUBMITTED'}</td>
                  <td>{s.finalScore !== null && s.finalScore !== undefined ? `${s.finalScore}/${maxScore}` : 'Chưa chấm'}</td>
                  <td>
                    <button className="teacher-button" onClick={() => setSelectedSubmissionId(s.id)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Chi tiết bài nộp
  const selectedSub = subs.find(s => s.id === selectedSubmissionId);
  if (!selectedSub) return <div>Bài nộp không tìm thấy.</div>;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <button className="teacher-button" onClick={() => setSelectedSubmissionId(null)} style={{ padding: '6px 12px' }}>
          ← Quay lại danh sách
        </button>
      </div>
      <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc' }}>
        <div><strong>Sinh viên:</strong> {selectedSub.student?.fullName || selectedSub.student?.username || selectedSub.student?.email || 'ID:' + selectedSub.student?.id}</div>
        <div><strong>Ngày nộp:</strong> {selectedSub.submittedAt ? new Date(selectedSub.submittedAt).toLocaleString('vi-VN') : 'N/A'}</div>
        <div><strong>Trạng thái:</strong> {selectedSub.status || 'SUBMITTED'}</div>
        {selectedSub.fileType === 'PLANTUML' ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 10, fontWeight: 600 }}>Sơ đồ UML (dựng từ PlantUML):</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Source code:</div>
                <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, margin: 0, maxHeight: 260, overflow: 'auto' }}>
                  {selectedSub.plantumlSource || 'Không có source code.'}
                </pre>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Hình UML:</div>
                <PlantUmlImage source={selectedSub.plantumlSource} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 8 }}><a href={selectedSub.fileUrl} target="_blank" rel="noreferrer">Xem tệp nộp</a></div>
        )}
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Điểm chính thức: </label>
          <input type="number" min="0" max={maxScore} step="0.5" value={editing[selectedSub.id]?.finalScore ?? (selectedSub.finalScore ?? '')} onChange={e => setEditing(prev => ({ ...prev, [selectedSub.id]: { ...(prev[selectedSub.id] || { finalScore: String(selectedSub.finalScore ?? ''), teacherFeedback: selectedSub.teacherFeedback || '' }), finalScore: e.target.value } }))} style={{ width: '100%', padding: '4px', borderRadius: 4, border: '1px solid #cbd5e1' }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Nhận xét giảng viên:</label>
          <textarea value={editing[selectedSub.id]?.teacherFeedback ?? (selectedSub.teacherFeedback ?? '')} onChange={e => setEditing(prev => ({ ...prev, [selectedSub.id]: { ...(prev[selectedSub.id] || { finalScore: String(selectedSub.finalScore ?? ''), teacherFeedback: selectedSub.teacherFeedback || '' }), teacherFeedback: e.target.value } }))} style={{ width: '100%', minHeight: '100px', padding: '6px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'monospace' }} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="teacher-button" onClick={() => handleGrade(selectedSub.id)} style={{ padding: '6px 12px' }}>Lưu điểm</button>
          <button className="teacher-button" onClick={() => setSelectedSubmissionId(null)} style={{ padding: '6px 12px', background: '#64748b' }}>Quay lại</button>
        </div>
      </div>
    </div>
  );
};

const emptyNewCourse = () => ({ code: '', title: '', description: '' });

const TeacherCoursesPanel: React.FC<{ courses: Course[]; setCourses: (courses: Course[]) => void; showToast: (message: string) => void; initialCourseId?: number | null; materials?: CourseMaterial[]; setMaterials?: (materials: CourseMaterial[]) => void }> = ({ courses, setCourses, showToast, initialCourseId = null, materials = [], setMaterials }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState(emptyNewCourse());
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(initialCourseId);
  const [courseSubjects, setCourseSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>(safeMaterials);
  const [materialForm, setMaterialForm] = useState({ subjectId: 0, fileName: '', fileType: 'PDF', fileSize: 0, filePath: '', description: '' });
  const [materialLoading, setMaterialLoading] = useState(false);

  useEffect(() => {
    if (initialCourseId) setSelectedCourseId(initialCourseId);
  }, [initialCourseId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setCourseSubjects([]);
      setSelectedSubject(null);
      return;
    }
    coursesApiService.getSubjectsByCourseId(selectedCourseId)
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setCourseSubjects(list);
        if (list.length > 0 && (!selectedSubject || !list.some(item => item.id === selectedSubject.id))) {
          setSelectedSubject(list[0]);
        }
      })
      .catch(() => showToast('Không thể tải danh sách môn học.'));
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedSubject) {
      setCourseMaterials([]);
      return;
    }
    materialsApiService.getMaterialsBySubject(selectedSubject.id)
      .then(data => setCourseMaterials(Array.isArray(data) ? data : []))
      .catch(() => setCourseMaterials([]));
    setMaterialForm(prev => ({ ...prev, subjectId: selectedSubject.id }));
  }, [selectedSubject]);

  const resetForm = () => {
    setCourseForm(emptyNewCourse());
    setEditingCourseId(null);
    setShowForm(false);
  };

  const handleEdit = (course: Course) => {
    setEditingCourseId(course.id);
    setCourseForm({ code: course.code, title: course.title, description: course.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Xóa khóa học "${course.title}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await coursesApiService.deleteCourse(course.id);
      setCourses(courses.filter(item => item.id !== course.id));
      showToast('Đã xóa khóa học.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi khi xóa khóa học.');
    }
  };

  const handleSave = async () => {
    if (!courseForm.code.trim() || !courseForm.title.trim()) {
      showToast('Vui lòng nhập mã và tên khóa học.');
      return;
    }
    setLoading(true);
    try {
      const saved = editingCourseId
        ? await coursesApiService.updateCourse(editingCourseId, courseForm)
        : await coursesApiService.createCourse(courseForm);
      setCourses(editingCourseId
        ? courses.map(course => course.id === editingCourseId ? saved : course)
        : [saved, ...courses]);
      resetForm();
      showToast(editingCourseId ? 'Đã cập nhật khóa học!' : 'Đã tạo khóa học!');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi khi lưu khóa học.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async () => {
    if (!selectedCourseId || !selectedSubject || !materialForm.fileName.trim() || !materialForm.filePath.trim()) {
      showToast('Vui lòng chọn môn học, nhập tên và đường dẫn/link tài liệu.');
      return;
    }
    setMaterialLoading(true);
    try {
      const payload = {
        courseId: selectedCourseId,
        subjectId: selectedSubject.id,
        fileName: materialForm.fileName,
        fileType: materialForm.fileType,
        fileSize: materialForm.fileSize || 0,
        filePath: materialForm.filePath,
        description: materialForm.description,
      };
      const saved = await materialsApiService.createMaterial(payload);
      setCourseMaterials(previous => [saved, ...previous]);
      const nextMaterials = Array.isArray(materials) ? [saved, ...materials] : [saved];
      setMaterials?.(nextMaterials);
      setMaterialForm({ subjectId: selectedSubject.id, fileName: '', fileType: 'PDF', fileSize: 0, filePath: '', description: '' });
      showToast('Đã đăng tài liệu cho môn học này.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi khi đăng tài liệu.');
    } finally {
      setMaterialLoading(false);
    }
  };

  return (
    <div className="teacher-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div><h2>Khóa học</h2><p>Quản lý khóa học trong hệ thống.</p></div>
        <button className="teacher-button teacher-button--primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Thêm khóa học</button>
      </div>
      {showForm && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal" style={{ maxWidth: '620px' }}>
            <h3>{editingCourseId ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}</h3>
            <label className="teacher-form-label">Mã khóa học</label>
            <input value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} placeholder="Ví dụ: CNTT2026" />
            <label className="teacher-form-label">Tên khóa học</label>
            <input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Nhập tên khóa học" />
            <label className="teacher-form-label">Mô tả</label>
            <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Mô tả khóa học" />
            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button className="teacher-button teacher-button--primary" onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              <button className="teacher-button" onClick={resetForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}
      <div className="teacher-simple-table">
        <table>
          <thead><tr><th>Mã khóa học</th><th>Tên khóa học</th><th>Mô tả</th><th>Thao tác</th></tr></thead>
          <tbody>
            {courses.length === 0 ? <tr><td colSpan={4} className="teacher-simple-table__empty">Chưa có khóa học nào.</td></tr> : courses.map(course => (
              <tr key={course.id}>
                <td>{course.code}</td><td><button className="teacher-link-button" onClick={() => setSelectedCourseId(course.id)}>{course.title}</button></td><td>{course.description || '-'}</td>
                <td><div className="teacher-row-actions"><button className="teacher-button" onClick={() => handleEdit(course)}>Sửa</button><button className="teacher-button teacher-button--danger" onClick={() => handleDelete(course)}>Xóa</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCourseId && (
        <section className="teacher-course-workspace">
          <div className="teacher-section-heading">
            <div><h2>{courses.find(course => course.id === selectedCourseId)?.title || 'Chi tiết khóa học'}</h2><span>Danh sách môn học</span></div>
            <button className="teacher-button" onClick={() => setSelectedCourseId(null)}>Đóng</button>
          </div>
          <div className="teacher-subject-grid">
            {courseSubjects.length === 0 ? <p className="teacher-simple-table__empty">Khóa học chưa có môn học.</p> : courseSubjects.map(subject => (
              <button key={subject.id} className={`teacher-subject-card ${selectedSubject?.id === subject.id ? 'teacher-subject-card--active' : ''}`} onClick={() => setSelectedSubject(subject)} type="button">
                <strong>{subject.code}</strong><span>{subject.title}</span><small>Giảng viên: {subject.teacherName || 'Chưa cập nhật'}</small>
              </button>
            ))}
          </div>
          {selectedSubject && (
            <div className="teacher-subject-detail">
              <h3>{selectedSubject.code} - {selectedSubject.title}</h3>
              <div className="teacher-subject-meta"><span><strong>Giảng viên:</strong> {selectedSubject.teacherName || 'Chưa cập nhật'}</span><span><strong>Thời gian học:</strong> Chưa cập nhật</span></div>
              <p>{selectedSubject.description || 'Môn học chưa có mô tả.'}</p>
              <div className="teacher-material-manager">
                <h3>Tài liệu khóa học</h3>
                <div className="teacher-material-form">
                  <input placeholder="Tên tài liệu" value={materialForm.fileName} onChange={e => setMaterialForm({ ...materialForm, fileName: e.target.value })} />
                  <select value={materialForm.fileType} onChange={e => setMaterialForm({ ...materialForm, fileType: e.target.value })}><option>PDF</option><option>DOCX</option><option>VIDEO</option><option>LINK</option></select>
                  <input type="url" placeholder="Đường dẫn tải lên hoặc link tài liệu" value={materialForm.filePath} onChange={e => setMaterialForm({ ...materialForm, filePath: e.target.value })} />
                  <input placeholder="Mô tả ngắn" value={materialForm.description} onChange={e => setMaterialForm({ ...materialForm, description: e.target.value })} />
                  <button className="teacher-button teacher-button--primary" onClick={handleCreateMaterial} disabled={materialLoading}>{materialLoading ? 'Đang đăng...' : 'Đăng tài liệu'}</button>
                </div>
                {courseMaterials.length === 0 ? <p className="teacher-simple-table__empty">Chưa có tài liệu cho môn này.</p> : <ul className="teacher-material-list">{courseMaterials.map(material => <li key={material.id}><a href={material.filePath} target="_blank" rel="noreferrer">{material.fileName}</a><span>{material.fileType}</span></li>)}</ul>}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

// =============================================================================
// 3. COMPONENT CHÍNH
// =============================================================================
const TeacherInterface: React.FC<TeacherInterfaceProps> = ({
  onLogout, userName = 'Nguyễn Văn Toàn', materials, setMaterials
}) => {
  const [activeView, setActiveView] = useState<ViewKey>('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [umlAssignments, setUmlAssignments] = useState<UmlAssignment[]>([]);
  const [selectedCourseFromOverview, setSelectedCourseFromOverview] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cData, eData, qData] = await Promise.all([
          coursesApiService.getAllCourses(),
          examApiService.getAllExams(),
          questionsApiService.getAllQuestions()
        ]);

        setCourses(Array.isArray(cData) ? cData : []);
        setExams(Array.isArray(eData) ? eData : []);
        setQuestions(Array.isArray(qData) ? qData : []);

        const allSubs: Subject[] = [];
        for (const course of cData) {
          const subs = await coursesApiService.getSubjectsByCourseId(course.id);
          if (Array.isArray(subs)) allSubs.push(...subs);
        }
        setSubjects(allSubs);

        const allUmlAssignments: UmlAssignment[] = [];
        for (const subject of allSubs) {
          const items = await umlApiService.getAssignmentsBySubject(subject.id).catch(() => []);
          if (Array.isArray(items)) {
            allUmlAssignments.push(...items.map((item: any) => ({
              id: item.id,
              subjectId: item.subject?.id ?? subject.id,
              title: item.title,
              description: item.description,
              dueDate: item.dueDate,
              maxScore: Number(item.maxScore),
              rubricCriteria: item.rubricCriteria,
            })));
          }
        }
        setUmlAssignments(allUmlAssignments);
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        setCourses([]);
        setSubjects([]);
        setQuestions([]);
        setExams([]);
        setUmlAssignments([]);
        setToast('Không thể tải dữ liệu từ backend/database. Vui lòng đăng nhập lại hoặc kiểm tra server.');
      }
    };
    void loadData();
  }, []);

  const handleOpenCourse = (courseId: number) => {
    setSelectedCourseFromOverview(courseId);
    setActiveView('courses');
  };

  const pageTitle = useMemo(() => navItems.find(item => item.key === activeView)?.label || 'Tổng quan', [activeView]);

  return (
    <div className="teacher-shell">
      <aside className="teacher-sidebar">
        <div className="teacher-brand"><div className="teacher-brand__mark">QL</div><div className="teacher-brand__name">QL Học Tập</div></div>
        <nav className="teacher-nav">
          {navItems.map((item) => (
            <button key={item.key} className={`teacher-nav__item ${activeView === item.key ? 'teacher-nav__item--active' : ''}`} onClick={() => setActiveView(item.key)}>
              <span className="teacher-nav__icon">{item.icon}</span><span className="teacher-nav__label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="teacher-main">
        <header className="teacher-page-header">
          <h1>{pageTitle}</h1>
          <div className="teacher-account"><span>Chào, <strong>{userName}</strong></span><button className="teacher-button teacher-button--logout" onClick={onLogout}>Đăng xuất</button></div>
        </header>
        <div className="teacher-content">
          {activeView === 'overview' && <TeacherOverview courses={courses} questions={questions} exams={exams} onOpenCourse={handleOpenCourse} />}
          {activeView === 'courses' && <TeacherCoursesPanel courses={courses} setCourses={setCourses} showToast={showToast} initialCourseId={selectedCourseFromOverview} materials={materials} setMaterials={setMaterials} />}
          {activeView === 'questions' && <TeacherQuestionBank questions={questions} setQuestions={setQuestions} subjects={subjects} showToast={showToast} />}
          {activeView === 'exams' && (
            <>
              <TeacherExamsPanel exams={exams} questions={questions} setExams={setExams} subjects={subjects} showToast={showToast} />
              <TeacherUmlPanel assignments={umlAssignments} setAssignments={setUmlAssignments} subjects={subjects} showToast={showToast} />
            </>
          )}
          {activeView === 'results' && <TeacherResultsPanel courses={courses} subjects={subjects} exams={exams} showToast={showToast} />}
          {activeView === 'reports' && <div className="teacher-section"><h2>Báo cáo hệ thống</h2></div>}
        </div>
        {toast && <div className="teacher-toast">{toast}</div>}
      </main>
    </div>
  );
};

export default TeacherInterface;
