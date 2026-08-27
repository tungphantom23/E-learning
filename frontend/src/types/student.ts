/**
 * Định nghĩa các kiểu dữ liệu cho giao diện sinh viên
 */

export interface StudentInfo {
  id: number;
  fullName: string;
  studentCode: string;
  email: string;
  phone: string;
  className: string;
  avatar?: string;
}

export interface EnrolledCourse {
  id: number;
  code: string;
  title: string;
  instructor: string;
  schedule: string;
  room: string;
  credits: number;
  status: 'Đang học' | 'Hoàn thành' | 'Bị trì hoãn';
  progress: number;
  grade?: number;
}

export interface ExamForStudent {
  id: number;
  title: string;
  courseCode: string;
  courseName: string;
  type: 'Kiểm tra' | 'Thi giữa kỳ' | 'Thi cuối kỳ';
  startTime: string;
  endTime: string;
  duration: number; // phút
  status: 'Sắp tới' | 'Đang diễn ra' | 'Đã kết thúc' | 'Vắng';
  questions: number;
  score?: number;
}

export interface ExamResult {
  id: number;
  examTitle: string;
  courseCode: string;
  courseName: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  submitTime?: string | number; // raw timestamp for formatting
  status: 'Đã chấm' | 'Chờ chấm' | 'Vắng';
  teacherComment?: string;
  wrongQuestions?: number[];
}

export interface ActivityLog {
  id: number;
  type: 'exam' | 'course' | 'assignment' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  totalExams: number;
  upcomingExams: number;
  averageGrade: number;
  passedExams: number;
}
