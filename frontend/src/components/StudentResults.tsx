import React, { useState, useEffect } from 'react';
import type { ExamResult } from '../types/student';
import { studentDashboardApiService } from '../services/apiService';
import '../styles/StudentResults.css';

const StudentResults: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [answerDetails, setAnswerDetails] = useState<any>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const resultsData = await studentDashboardApiService.getExamResults();
        const examResults: ExamResult[] = resultsData.map((result: any) => {
          const submitTimeRaw = result.submitTime || result.startTime;
          return {
            id: result.resultId,
            examTitle: result.examTitle,
            courseCode: 'N/A',
            courseName: result.subjectTitle,
            score: result.score,
            maxScore: 10,
            percentage: (result.score / 10) * 100,
            submittedAt: submitTimeRaw ? new Date(submitTimeRaw).toLocaleString('vi-VN') : 'N/A',
            submitTime: submitTimeRaw,
            status: result.status === 'SUBMITTED' ? 'Đã chấm' : 'Chờ chấm',
            teacherComment: ''
          };
        });

        // Sort results
        const sorted = [...examResults].sort((a, b) => {
          if (sortBy === 'date') {
            const timeA = a.submitTime ? new Date(a.submitTime).getTime() : 0;
            const timeB = b.submitTime ? new Date(b.submitTime).getTime() : 0;
            return timeB - timeA;
          } else {
            return b.percentage - a.percentage;
          }
        });

        setResults(sorted);
      } catch (err: any) {
        setError(err.message || 'Lỗi tải kết quả thi');
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sortBy]);

  const calculateAverageScore = () => {
    const gradedResults = results.filter(r => r.status === 'Đã chấm');
    if (gradedResults.length === 0) return 0;
    return (gradedResults.reduce((sum, r) => sum + r.score, 0) / gradedResults.length).toFixed(1);
  };

  const calculatePassRate = () => {
    const gradedResults = results.filter(r => r.status === 'Đã chấm');
    if (gradedResults.length === 0) return 0;
    const passed = gradedResults.filter(r => r.percentage >= 50).length;
    return ((passed / gradedResults.length) * 100).toFixed(0);
  };

  const handleViewDetails = async (examId: number) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/v1/student/exams/${examId}/answer-details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnswerDetails(data);
        setSelectedExamId(examId);
      } else {
        alert('Không thể tải chi tiết đáp án');
      }
    } catch (err) {
      console.error('Error loading details:', err);
      alert('Lỗi khi tải chi tiết đáp án');
    } finally {
      setDetailLoading(false);
    }
  };

  const getResultColor = (percentage: number) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Đã chấm':
        return '✓';
      case 'Chờ chấm':
        return '⏳';
      case 'Vắng':
        return '✗';
      default:
        return '•';
    }
  };

  if (loading) {
    return <div className="loading">Đang tải kết quả...</div>;
  }

  if (error) {
    return <div className="error">Lỗi: {error}</div>;
  }

  return (
    <div className="student-results">
      <div className="results-header">
        <h1>Kết quả thi của tôi</h1>
      </div>

      {/* Thống kê tổng quát */}
      <div className="results-stats">
        <div className="stat-box">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-label">Điểm trung bình</span>
            <span className="stat-value">{calculateAverageScore()}/10</span>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-label">Tỉ lệ đạt</span>
            <span className="stat-value">{calculatePassRate()}%</span>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-label">Tổng kỳ thi</span>
            <span className="stat-value">{results.filter(r => r.status === 'Đã chấm').length}/{results.length}</span>
          </div>
        </div>
      </div>

      {/* Bộ lọc và sắp xếp */}
      <div className="results-controls">
        <div className="sort-controls">
          <label>Sắp xếp theo:</label>
          <button 
            className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
            onClick={() => setSortBy('date')}
          >
            Ngày thi
          </button>
          <button 
            className={`sort-btn ${sortBy === 'score' ? 'active' : ''}`}
            onClick={() => setSortBy('score')}
          >
            Điểm số
          </button>
        </div>
      </div>

      {/* Danh sách kết quả */}
      <div className="results-container">
        {results.length === 0 ? (
          <div className="no-results">
            <p>Chưa có kết quả thi</p>
          </div>
        ) : (
          results.map(result => (
            <div key={result.id} className="result-card">
              <div className="result-card-header">
                <div className="result-title-section">
                  <h3>{result.examTitle}</h3>
                  <p className="result-course">{result.courseName} ({result.courseCode})</p>
                </div>
                <div className="result-status-badge">
                  <span className={`status-icon status-${result.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {getStatusIcon(result.status)}
                  </span>
                  <span className="status-text">{result.status}</span>
                </div>
              </div>

              <div className="result-details">
                <div className="detail-left">
                  <div className="detail-item">
                    <span className="detail-label">Thời gian nộp</span>
                    <span className="detail-value">
                      {result.submitTime 
                        ? new Date(result.submitTime).toLocaleString('vi-VN') 
                        : result.submittedAt}
                    </span>
                  </div>
                </div>

                {result.status === 'Đã chấm' && (
                  <div className="result-score-section">
                    <div className={`score-circle ${getResultColor(result.percentage)}`}>
                      <div className="score-number">{result.percentage}%</div>
                      <div className="score-fraction">{result.score}/{result.maxScore}</div>
                    </div>
                    <div className="score-rating">
                      {result.percentage >= 80 && <span>Xuất sắc 🌟</span>}
                      {result.percentage >= 70 && result.percentage < 80 && <span>Tốt 👍</span>}
                      {result.percentage >= 50 && result.percentage < 70 && <span>Bình thường 👌</span>}
                      {result.percentage < 50 && <span>Cần cải thiện 📖</span>}
                    </div>
                  </div>
                )}

                {result.status === 'Chờ chấm' && (
                  <div className="pending-section">
                    <p>Bài thi của bạn đang được chấm</p>
                    <p className="pending-note">Kết quả sẽ được công bố sớm</p>
                  </div>
                )}
              </div>

              {result.teacherComment && (
                <div className="teacher-comment">
                  <h4>Nhận xét của giáo viên:</h4>
                  <p>{result.teacherComment}</p>
                </div>
              )}

              {result.wrongQuestions && result.wrongQuestions.length > 0 && (
                <div className="wrong-questions">
                  <h4>Câu hỏi trả lời sai:</h4>
                  <div className="wrong-list">
                    {result.wrongQuestions.map(q => (
                      <span key={q} className="wrong-item">Câu {q}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="result-actions">
                {result.status === 'Đã chấm' && (
                  <button className="btn-secondary" onClick={() => handleViewDetails(result.id)}>
                    Xem chi tiết đáp án →
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentResults;
