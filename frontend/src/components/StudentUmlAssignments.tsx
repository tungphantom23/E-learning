import React, { useState, useEffect } from 'react';
import { studentDashboardApiService, coursesApiService, umlApiService } from '../services/apiService';

interface UmlAssignmentItem {
  id: number;
  title: string;
  description: string;
  rubricCriteria?: string;
  maxScore: number;
  dueDate: string;
  subjectTitle: string;
}

interface UmlSubmissionItem {
  id: number;
  assignmentId: number;
  fileUrl: string;
  fileType: string;
  submittedAt: string;
  status: string;
  aiSuggestedScore?: number;
  aiFeedback?: string;
  finalScore?: number;
  teacherFeedback?: string;
}

const StudentUmlAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<UmlAssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<UmlSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [fileObject, setFileObject] = useState<Record<number, File | null>>({});
  const [plantumlText, setPlantumlText] = useState<Record<number, string>>({});
  const [usePlantuml, setUsePlantuml] = useState<Record<number, boolean>>({});
  const [plantumlPreviewUrl, setPlantumlPreviewUrl] = useState<Record<number, string>>({});
  const [expandedAssignments, setExpandedAssignments] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const enrolledCourses = await studentDashboardApiService.getEnrolledCourses().catch(() => []);
      const allAssignments: UmlAssignmentItem[] = [];

      for (const course of enrolledCourses) {
        const courseId = course.courseId || course.id;
        const subjects = await coursesApiService.getSubjectsByCourseId(courseId).catch(() => []);
        for (const subject of subjects) {
          const items = await umlApiService.getAssignmentsBySubject(subject.id).catch(() => []);
          allAssignments.push(...items.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            rubricCriteria: item.rubricCriteria,
            maxScore: item.maxScore,
            dueDate: item.dueDate,
            subjectTitle: subject.title,
          })));
        }
      }
      setAssignments(allAssignments);

      const submissionsData = await umlApiService.getStudentSubmissions().catch(() => []);
      setSubmissions(submissionsData.map((s: any) => ({
        id: s.id,
        assignmentId: s.assignment?.id,
        fileUrl: s.fileUrl,
        fileType: s.fileType,
        submittedAt: s.submittedAt,
        status: s.status,
        aiSuggestedScore: s.aiSuggestedScore,
        aiFeedback: s.aiFeedback,
        finalScore: s.finalScore,
        teacherFeedback: s.teacherFeedback,
      })));
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách bài tập UML.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSubmissionKindLabel = (submission: UmlSubmissionItem) => {
    const fileType = (submission.fileType || '').toUpperCase();
    if (fileType === 'PLANTUML') return 'mã PlantUML';
    if (fileType === 'PDF') return 'file PDF';
    if (fileType === 'IMAGE' || fileType === 'PNG' || fileType === 'JPG' || fileType === 'JPEG') return 'hình ảnh';
    if (submission.fileUrl) return 'tệp đính kèm';
    return 'bài nộp';
  };

  const handlePreview = (assignmentId: number) => {
    const src = plantumlText[assignmentId] || '';
    if (!src.trim()) return showToast('Vui lòng nhập mã PlantUML.');

    try {
      // Sử dụng TextEncoder thay vì Buffer để an toàn trên trình duyệt
      const hex = Array.from(new TextEncoder().encode(src))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const url = `https://www.plantuml.com/plantuml/png/~h${hex}`;
      setPlantumlPreviewUrl(prev => ({ ...prev, [assignmentId]: url }));
    } catch (err) {
      showToast('Lỗi xử lý mã PlantUML.');
    }
  };

  const handleSubmit = async (assignmentId: number) => {
    const isUmlMode = !!usePlantuml[assignmentId];
    const fileObj = fileObject[assignmentId] || null;
    const plantuml = plantumlText[assignmentId] || '';

    if (!isUmlMode && !fileObj) return showToast('Vui lòng chọn tệp để nộp.');
    if (isUmlMode && !plantuml.trim()) return showToast('Vui lòng dán mã PlantUML.');

    setSubmittingId(assignmentId);
    try {
      await umlApiService.submitAssignment({
        assignmentId,
        file: isUmlMode ? undefined : fileObj,
        plantumlSource: isUmlMode ? plantuml : undefined
      });
      showToast('Đã nộp bài tập UML thành công!');
      setFileObject(prev => ({ ...prev, [assignmentId]: null }));
      setPlantumlText(prev => ({ ...prev, [assignmentId]: '' }));
      setPlantumlPreviewUrl(prev => ({ ...prev, [assignmentId]: '' }));
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi nộp bài tập.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}><h3>Đang tải bài tập UML...</h3></div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#10b981', color: 'white', padding: '12px 20px', borderRadius: '8px', zIndex: 100 }}>
          {toast}
        </div>
      )}
      {assignments.length === 0 ? (
        <p style={{ color: '#64748b', padding: '20px' }}>Hiện chưa có bài tập UML nào cho các môn học của bạn.</p>
      ) : (
        assignments.map(assignment => {
          const submission = submissions.find(s => s.assignmentId === assignment.id);
          const isPastDue = new Date(assignment.dueDate).getTime() < Date.now();
          const expanded = !!expandedAssignments[assignment.id];

          return (
            <div key={assignment.id} style={{ background: 'white', padding: '18px 20px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setExpandedAssignments(prev => ({ ...prev, [assignment.id]: !expanded }))}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', lineHeight: 1.3 }}>{assignment.title}</h3>
                    {submission ? <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>Đã nộp</span> : <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>Chưa nộp</span>}
                  </div>
                  <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>
                    Môn: {assignment.subjectTitle} | Hạn nộp: {new Date(assignment.dueDate).toLocaleString('vi-VN')} | Điểm tối đa: {assignment.maxScore}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedAssignments(prev => ({ ...prev, [assignment.id]: !expanded }));
                  }}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', cursor: 'pointer', fontWeight: 600 }}
                >
                  {expanded ? 'Thu gọn' : 'Chi tiết'}
                </button>
              </div>

              {expanded && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{assignment.description}</p>
                  {assignment.rubricCriteria && <p style={{ fontStyle: 'italic', color: '#475569', fontSize: '13px', marginTop: 8 }}>Tiêu chí chấm: {assignment.rubricCriteria}</p>}

                  {submission ? (
                    <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <p><strong>Trạng thái:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>Đã nộp bài</span></p>
                      <p><strong>Đã nộp:</strong> {getSubmissionKindLabel(submission)}</p>
                      <p><strong>Ngày nộp:</strong> {new Date(submission.submittedAt).toLocaleString('vi-VN')}</p>
                      {submission.finalScore != null ? (
                        <p style={{ fontSize: '18px', color: '#10b981' }}><strong>Điểm chính thức: {submission.finalScore}/{assignment.maxScore}</strong></p>
                      ) : (
                        <p><strong>Đang chờ chấm điểm.</strong></p>
                      )}
                      {submission.teacherFeedback && <div style={{ marginTop: '8px', padding: '10px', background: '#fff', borderRadius: '4px', border: '1px solid #10b981' }}><strong>Giảng viên Nhận xét:</strong> {submission.teacherFeedback}</div>}
                    </div>
                  ) : (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input type="radio" name={`mode-${assignment.id}`} checked={!usePlantuml[assignment.id]} onChange={() => setUsePlantuml(prev => ({ ...prev, [assignment.id]: false }))} />
                          <span>Upload ảnh/PDF</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input type="radio" name={`mode-${assignment.id}`} checked={!!usePlantuml[assignment.id]} onChange={() => setUsePlantuml(prev => ({ ...prev, [assignment.id]: true }))} />
                          <span>Dán PlantUML (Text)</span>
                        </label>
                      </div>

                      {!usePlantuml[assignment.id] ? (
                        <div style={{ padding: '16px', border: '2px dashed #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                          <input type="file" accept="image/*,application/pdf" disabled={isPastDue} onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setFileObject(prev => ({ ...prev, [assignment.id]: f }));
                          }} />
                          {fileObject[assignment.id] && <p style={{ marginTop: '8px', color: '#10b981' }}>Đã chọn: {fileObject[assignment.id]!.name}</p>}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <textarea
                            placeholder="Nhập mã PlantUML tại đây (ví dụ: @startuml ... @enduml)"
                            rows={8}
                            value={plantumlText[assignment.id] || ''}
                            onChange={(e) => setPlantumlText(prev => ({ ...prev, [assignment.id]: e.target.value }))}
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
                          />
                          <div>
                            <button type="button" onClick={() => handlePreview(assignment.id)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #3b82f6', background: 'white', color: '#3b82f6', cursor: 'pointer' }}>
                              Xem Preview hình vẽ
                            </button>
                          </div>
                          {plantumlPreviewUrl[assignment.id] && (
                            <div style={{ marginTop: '10px', textAlign: 'center', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
                              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Hình vẽ xem trước:</p>
                              <img src={plantumlPreviewUrl[assignment.id]} alt="PlantUML Preview" style={{ maxWidth: '100%', border: '1px solid #e2e8f0', borderRadius: '4px' }} onError={() => showToast('Mã PlantUML không hợp lệ hoặc quá dài để xem trước.')} />
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => handleSubmit(assignment.id)}
                        disabled={submittingId === assignment.id || isPastDue}
                        style={{
                          padding: '12px', borderRadius: '8px', border: 'none',
                          background: isPastDue ? '#94a3b8' : '#10b981',
                          color: 'white', cursor: isPastDue ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold', fontSize: '16px'
                        }}
                      >
                        {isPastDue ? 'Đã hết hạn nộp' : submittingId === assignment.id ? 'Đang gửi bài...' : 'Nộp bài ngay'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default StudentUmlAssignments;
