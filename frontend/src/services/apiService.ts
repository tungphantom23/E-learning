import type { ExamSubmissionRequest, ExamResultResponse, ExamInfo } from '../types/exam';
import type { CourseMaterial, CreateCourseMaterialRequest } from '../types/material';

const API_BASE_URL = '/api';

function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
}

function createAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Chưa đăng nhập. Vui lòng đăng nhập trước khi thực hiện thao tác.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export const examApiService = {
  async getExamForStudent(examId: number): Promise<ExamInfo> {
    // Server exposes questions for student at /api/v1/student/exams/{examId}/questions
    const response = await fetch(`/api/v1/student/exams/${examId}/questions`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Lỗi lấy thông tin đề thi.`);

    // Backend returns ExamQuestionForStudentDto[] with options array; map it to frontend ExamInfo shape
    const questionDtos = await response.json();
    const mappedQuestions = questionDtos.map((q: any) => {
      const opts = q.options || [];
      return {
        id: q.id,
        content: q.content,
        optionA: opts[0] ? opts[0].content : '',
        optionB: opts[1] ? opts[1].content : '',
        optionC: opts[2] ? opts[2].content : '',
        optionD: opts[3] ? opts[3].content : '',
        questionOrder: 0,
        options: opts.map((o: any) => ({ id: o.id, content: o.content })),
        questionType: q.questionType,
      };
    });

    const examInfo: ExamInfo = {
      examId,
      examTitle: `Bài thi ${examId}`,
      durationMinutes: 30,
      maxTabSwitches: 3,
      questions: mappedQuestions,
    };

    return examInfo;
  },

  async submitExam(submission: ExamSubmissionRequest): Promise<ExamResultResponse> {
    // Transform frontend submission to backend DTO shape: selectedOptionIds: number[]
    const backendPayload = {
      examId: submission.examId,
      tabSwitchCount: submission.tabSwitchCount,
      // studentId will be set by server from token
      answers: (submission.answers || []).map(a => ({
        questionId: a.questionId,
        selectedOptionIds: a.selectedOption
          ? String(a.selectedOption).split(',').filter(Boolean).map(Number)
          : []
      }))
    };

    console.debug('[DEBUG] submitExam payload (backend):', backendPayload);

    const response = await fetch(`/api/v1/student/exams/submit`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(backendPayload),
    });
    if (!response.ok) throw new Error(`Lỗi nộp bài thi.`);
    const result = await response.json();
    // Backend trả về correctCount, frontend dùng totalCorrect
    return { ...result, totalCorrect: result.correctCount };
  },

  async getAllExams(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/exams`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy danh sách bài thi');
    return response.json();
  },

  async createExam(examData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/exams`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(examData),
    });
    if (!response.ok) throw new Error('Lỗi khi lưu bài thi');
    return response.json();
  },

  async updateExam(id: number, examData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/exams/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(examData),
    });
    if (!response.ok) throw new Error('Lỗi khi cập nhật bài thi');
    return response.json();
  },

  async deleteExam(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/exams/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Lỗi khi xóa bài thi');
  },

  async getExamQuestions(examId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/exams/${examId}/questions`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy danh sách câu hỏi của bài thi');
    return response.json();
  },

  async getExamResults(examId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/exams/${examId}/results`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy danh sách sinh viên đã làm bài');
    return response.json();
  },
};

export const umlApiService = {
  async getAssignmentsBySubject(subjectId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/subjects/${subjectId}/uml-assignments`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy danh sách bài kiểm tra UML');
    return response.json();
  },

  async createAssignment(payload: {
    subjectId: number; title: string; description: string; dueDate: string;
    rubricCriteria?: string; maxScore?: string;
  }): Promise<any> {
    const token = getAuthToken();
    if (!token) throw new Error('Chưa đăng nhập. Vui lòng đăng nhập trước khi thực hiện thao tác.');

    const form = new URLSearchParams();
    form.set('subjectId', String(payload.subjectId));
    form.set('title', payload.title);
    form.set('description', payload.description);
    form.set('dueDate', payload.dueDate);
    if (payload.rubricCriteria) form.set('rubricCriteria', payload.rubricCriteria);
    if (payload.maxScore) form.set('maxScore', payload.maxScore);

    const response = await fetch(`${API_BASE_URL}/v1/teacher/uml-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: form.toString(),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || `Lỗi khi tạo bài kiểm tra UML (mã ${response.status})`);
    }
    return response.json();
  },

  async getStudentSubmissions(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/student/uml-submissions`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy danh sách bài đã nộp.');
    return response.json();
  },

  async submitAssignment(payload: { assignmentId: number; fileUrl?: string; fileType?: string; file?: File; plantumlSource?: string }): Promise<any> {
    const token = getAuthToken();
    if (!token) throw new Error('Chưa đăng nhập. Vui lòng đăng nhập trước khi thực hiện thao tác.');

    // 1. Trường hợp nộp tệp (ảnh/PDF)
    if (payload.file) {
      const form = new FormData();
      form.append('assignmentId', String(payload.assignmentId));
      form.append('file', payload.file, payload.file.name);

      const response = await fetch(`${API_BASE_URL}/v1/student/uml-submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form,
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(detail || `Lỗi khi nộp bài tập UML (mã ${response.status})`);
      }
      return response.json();
    }

    // 2. Trường hợp nộp mã PlantUML (Text)
    const form = new URLSearchParams();
    form.set('assignmentId', String(payload.assignmentId));
    if (payload.plantumlSource) {
      form.set('plantumlSource', payload.plantumlSource);
      form.set('fileType', 'PLANTUML');
    } else {
      form.set('fileUrl', payload.fileUrl || '');
      form.set('fileType', payload.fileType || 'IMAGE');
    }

    const response = await fetch(`${API_BASE_URL}/v1/student/uml-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: form.toString(),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || `Lỗi khi nộp bài tập UML (mã ${response.status})`);
    }
    return response.json();
  },

  async getSubmissionsByAssignment(assignmentId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/uml-assignments/${assignmentId}/submissions`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy danh sách nộp bài cho bài kiểm tra này.');
    return response.json();
  },

  async gradeSubmission(submissionId: number, payload: { finalScore: number; teacherFeedback?: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/uml-submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || `Lỗi khi chấm bài (mã ${response.status})`);
    }
    return response.json();
  },

  async analyzeSubmission(submissionId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/student/uml-submissions/${submissionId}/analyze`, {
      method: 'POST',
      headers: createAuthHeaders(),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || `Lỗi khi AI chấm bài (mã ${response.status})`);
    }
    return response.json();
  }
};

export const questionsApiService = {
  async getAllQuestions(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/questions`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Lỗi lấy ngân hàng câu hỏi');
    return response.json();
  },

  async createQuestion(questionData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/questions`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(questionData),
    });
    if (!response.ok) throw new Error('Lỗi tạo câu hỏi');
    return response.json();
  },

  async updateQuestion(id: number, questionData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/questions/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(questionData),
    });
    if (!response.ok) throw new Error('Lỗi cập nhật câu hỏi');
    return response.json();
  },

  async deleteQuestion(id: number): Promise<void> {
    await fetch(`${API_BASE_URL}/v1/teacher/questions/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
  }
};

export const authApiService = {
  async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });
    if (!response.ok) throw new Error('Sai email hoặc mật khẩu.');
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('userRole', data.roles?.[0] || '');
    localStorage.setItem('username', data.username);
    return data;
  },
  logout(): void {
    localStorage.clear();
  }
};

export const coursesApiService = {
  async getAllCourses(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/courses`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return response.json();
  },

  async createCourse(courseData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/courses`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(courseData),
    });
    if (!response.ok) throw new Error('Lỗi tạo khóa học');
    return response.json();
  },

  async updateCourse(id: number, courseData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/courses/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(courseData),
    });
    if (!response.ok) throw new Error('Lỗi cập nhật khóa học');
    return response.json();
  },

  async deleteCourse(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/courses/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Lỗi xóa khóa học');
  },

  async getSubjectsByCourseId(courseId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/courses/${courseId}/subjects`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return response.json();
  },
  async getLessonsBySubjectId(subjectId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/subjects/${subjectId}/lessons`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return response.json();
  }
};

export const materialsApiService = {
  async createMaterial(request: CreateCourseMaterialRequest): Promise<CourseMaterial> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/materials`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(request),
    });
    return response.json();
  },
  async getMaterialsBySubject(subjectId: number): Promise<CourseMaterial[]> {
    const response = await fetch(`${API_BASE_URL}/v1/subjects/${subjectId}/materials`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy tài liệu của môn học');
    return response.json();
  },
  async getMyMaterials(): Promise<CourseMaterial[]> {
    const response = await fetch(`${API_BASE_URL}/v1/teacher/materials`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return response.json();
  },
  async getAllActiveMaterials(): Promise<CourseMaterial[]> {
    const response = await fetch(`${API_BASE_URL}/v1/materials`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy tài liệu học tập');
    return response.json();
  },
  async getMaterialsByCourse(courseId: number): Promise<CourseMaterial[]> {
    const response = await fetch(`${API_BASE_URL}/v1/courses/${courseId}/materials`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy tài liệu của khóa học');
    return response.json();
  }
};

export const studentDashboardApiService = {
  async getStudentInfo(): Promise<{ userId: number; fullName: string; studentId?: string; email: string }> {
    const response = await fetch(`${API_BASE_URL}/v1/student/info`, {
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy thông tin sinh viên');
    return response.json();
  },

  async getDashboardStats(): Promise<{ totalCourses: number; completedExams: number; averageScore: number }> {
    const response = await fetch(`${API_BASE_URL}/v1/student/stats`, {
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy thống kê học tập');
    return response.json();
  },

  async getUpcomingExams(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/student/upcoming-exams`, {
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy danh sách bài kiểm tra');
    return response.json();
  },

  async getEnrolledCourses(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/student/courses`, {
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy danh sách khóa học');
    return response.json();
  },

  async getExamResults(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/v1/student/exam-results`, {
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy kết quả học tập');
    return response.json();
  }
};
