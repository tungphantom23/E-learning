import React, { useState, useEffect } from 'react';
import StudentDashboard from './StudentDashboard';
import StudentCourses from './StudentCourses';
import StudentExams from './StudentExams';
import StudentResults from './StudentResults';
import StudentUmlAssignments from './StudentUmlAssignments';
import { materialsApiService } from '../services/apiService';
import type { CourseMaterial } from '../types/shared';
import './styles/StudentInterface.css';

type StudentView = 'dashboard' | 'courses' | 'exams' | 'results' | 'materials' | 'uml';

interface StudentInterfaceProps {
  onLogout?: () => void;
  userRole?: 'teacher' | 'student';
  materials?: CourseMaterial[];
  userName?: string;
}

const navItems: Array<{ key: StudentView; label: string; icon: string }> = [
  { key: 'dashboard', label: 'Trang chủ', icon: '🏠' },
  { key: 'courses', label: 'Khóa học', icon: '📚' },
  { key: 'exams', label: 'Bài kiểm tra', icon: '📝' },
  { key: 'uml', label: 'Bài tập UML', icon: '🧩' },
  { key: 'materials', label: 'Tài liệu học', icon: '📑' },
  { key: 'results', label: 'Kết quả', icon: '📈' },
];

const StudentInterface: React.FC<StudentInterfaceProps> = ({
  onLogout,
  userRole = 'student',
  materials = [],
  userName = 'Sinh viên'
}) => {
  const [currentView, setCurrentView] = useState<StudentView>('dashboard');
  const [studentMaterials, setStudentMaterials] = useState<CourseMaterial[]>(materials);

  useEffect(() => {
    setStudentMaterials(Array.isArray(materials) ? materials : []);
  }, [materials]);

  useEffect(() => {
    if (userRole !== 'student' || currentView !== 'materials') return;

    let ignore = false;
    materialsApiService.getAllActiveMaterials()
      .then((data) => {
        if (!ignore) setStudentMaterials(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setStudentMaterials([]);
      });

    return () => {
      ignore = true;
    };
  }, [userRole, currentView]);

  const handleViewChange = (view: StudentView) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const pageTitle = navItems.find((item) => item.key === currentView)?.label ?? 'Trang chủ';

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <StudentDashboard />;
      case 'courses':
        return <StudentCourses />;
      case 'exams':
        return <StudentExams />;
      case 'uml':
        return <StudentUmlAssignments />;
      case 'materials':
        return <StudentMaterials materials={studentMaterials} />;
      case 'results':
        return <StudentResults />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="student-shell">
      <aside className="student-sidebar">
        <StudentBrand />
        <nav className="student-nav" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`student-nav__item ${currentView === item.key ? 'student-nav__item--active' : ''}`}
              onClick={() => handleViewChange(item.key)}
              type="button"
              title={item.label}
            >
              <span className="student-nav__icon">{item.icon}</span>
              <span className="student-nav__label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="student-main">
        <StudentHeader title={pageTitle} onLogout={onLogout} userName={userName} />
        <div className="student-content">{renderView()}</div>
      </main>
    </div>
  );
};

const StudentBrand: React.FC = () => (
  <div className="student-brand">
    <div className="student-brand__mark">QL</div>
    <div>
      <p className="student-brand__name">QL Học Tập</p>
      <p className="student-brand__caption">Sinh viên</p>
    </div>
  </div>
);

const StudentHeader: React.FC<{ title: string; onLogout?: () => void; userName: string }> = ({ title, onLogout, userName }) => {
  const avatarText = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SV';

  return (
    <header className="student-page-header">
      <div>
        <p className="student-eyebrow">KHU VỰC SINH VIÊN</p>
        <h1>{title}</h1>
      </div>
      <div className="student-account">
        <div className="student-account__user">
          <span className="student-avatar">{avatarText}</span>
          <div>
            <p className="student-account__name">{userName}</p>
            <p className="student-account__role">Sinh viên</p>
          </div>
        </div>
        <button className="student-button student-button--logout" onClick={onLogout} type="button">
          Đăng xuất
        </button>
      </div>
    </header>
  );
};

const StudentMaterials: React.FC<{ materials: CourseMaterial[] }> = ({ materials }) => {
  const [filter, setFilter] = React.useState<string>('all');

  const filteredMaterials =
    filter === 'all' ? materials : materials.filter((m) => m.courseCode === filter);

  const courses = Array.from(new Set(materials.map((m) => m.courseCode)));

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ marginBottom: '20px', color: '#1e293b' }}>Tài liệu Học tập</h1>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
          Lọc theo Khóa học
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="all">Tất cả khóa học</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
      </div>

      {filteredMaterials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <p style={{ fontSize: '16px' }}>Chưa có tài liệu nào cho khóa học này.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
                    📄 {material.fileName}
                  </h3>
                  <p style={{ margin: '0', color: '#64748b', fontSize: '13px' }}>
                    {material.courseCode} - {material.subjectTitle || material.courseName}
                  </p>
                </div>
                <a
                  href={material.filePath}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '8px 12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  📥 Xem tài liệu
                </a>
              </div>

              {material.description && (
                <p style={{ margin: '12px 0', color: '#475569', fontSize: '14px' }}>{material.description}</p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '13px',
                  color: '#64748b',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <span>📅 {formatDate(material.createdAt)}</span>
                <span>💾 {formatFileSize(material.fileSize)}</span>
                <span>👤 {material.uploadedByName}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentInterface;
