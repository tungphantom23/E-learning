import React, { useState, useEffect } from 'react';
import StudentInterface from './components/StudentInterface';
import TeacherInterface from './components/TeacherInterface';
import type { CourseMaterial } from './types/material';
import { authApiService, materialsApiService } from './services/apiService';
import './App.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [toast, setToast] = useState('');
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);

  // Khởi tạo trạng thái từ localStorage an toàn
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('userRole');
      const storedName = localStorage.getItem('username');

      if (token && role) {
        setIsAuthenticated(true);
        setUserRole(role === 'ROLE_STUDENT' ? 'student' : 'teacher');
        setUserName(storedName || 'Người dùng');
      }
    } catch (e) {
      console.error("Lỗi đọc localStorage:", e);
    }
  }, []);

  // Fetch materials khi đã auth
  useEffect(() => {
    if (isAuthenticated) {
      const materialRequest = localStorage.getItem('userRole') === 'ROLE_STUDENT'
        ? materialsApiService.getAllActiveMaterials()
        : materialsApiService.getMyMaterials();
      materialRequest
        .then((data: CourseMaterial[]) => setMaterials(data || []))
        .catch((err: unknown) => {
          console.error('Lỗi lấy tài liệu:', err);
          setMaterials([]);
        });
    }
  }, [isAuthenticated]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const data = await authApiService.login(email.trim(), password);
      const roles = data.roles || [];
      const nameToShow = data.username || email;

      setUserName(nameToShow);
      localStorage.setItem('username', nameToShow);

      if (roles.includes('ROLE_TEACHER') || roles.includes('ROLE_ADMIN')) {
        setUserRole('teacher');
        setIsAuthenticated(true);
        localStorage.setItem('userRole', 'ROLE_TEACHER');
      } else {
        setUserRole('student');
        setIsAuthenticated(true);
        localStorage.setItem('userRole', 'ROLE_STUDENT');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Đăng nhập thất bại.');
    }
  };

  const handleDemoLogin = async (email: string) => {
    await handleLogin(email, '123456');
  };

  const handleLogout = () => {
    authApiService.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName('');
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onDemoLogin={handleDemoLogin} showToast={showToast} />;
  }

  return (
    <>
      {userRole === 'student' ? (
        <StudentInterface userRole="student" onLogout={handleLogout} materials={materials} userName={userName} />
      ) : (
        <TeacherInterface onLogout={handleLogout} materials={materials} setMaterials={setMaterials} userName={userName} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
};

const LoginScreen: React.FC<{
  onLogin: (email: string, password: string) => Promise<void>;
  onDemoLogin: (email: string) => Promise<void>;
  showToast: (message: string) => void;
}> = ({ onLogin, onDemoLogin, showToast }) => {
  const [email, setEmail] = useState('gv01@gmail.com');
  const [password, setPassword] = useState('123456');

  const submit = () => {
    if (!email.trim() || !password.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    const demoAccounts = ['gv01@gmail.com', 'gv02@gmail.com', 'sv001@gmail.com', 'gv@demo.vn', 'hs@demo.vn'];
    if (demoAccounts.includes(email.trim().toLowerCase()) && password === '123456') {
      void onDemoLogin(email);
    } else {
      void onLogin(email, password);
    }
  };

  return (
    <main className="login">
      <section className="login__intro">
        <div className="brand">
          <div className="brand__mark">QL</div>
          <div className="brand__name">QL Học Tập</div>
        </div>
        <h1>Hệ thống quản lý học tập và đánh giá tự động</h1>
        <p>
          Đăng nhập theo vai trò để quản lý câu hỏi, bài kiểm tra hoặc tham gia khóa học và xem kết quả.
        </p>
        <div className="feature-row">
          <span>Quản lý môn học</span>
          <span>Ngân hàng câu hỏi</span>
          <span>Chấm điểm tự động</span>
        </div>
      </section>

      <section className="auth-card" aria-label="Đăng nhập hệ thống">
        <div className="auth-tabs">
          <button className="auth-tabs__item auth-tabs__item--active" type="button">Đăng nhập</button>
          <button className="auth-tabs__item" type="button">Đăng ký</button>
        </div>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="gv01@gmail.com" />
        </label>
        <label>
          Mật khẩu
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
        </label>
        <button className="button button--primary button--block" onClick={submit} type="button">
          Đăng nhập hệ thống
        </button>
        <p className="auth-card__hint">Tài khoản: gv01@gmail.com, sv001@gmail.com (MK: 123456)</p>
      </section>
    </main>
  );
};

export default App;
