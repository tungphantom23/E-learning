-- =============================================================================
-- V2: PHẦN QUẢN LÝ TÀI LIỆU HỌC TẬP (Course Materials)
-- Cho phép giảng viên tải lên tài liệu cho khóa học
-- =============================================================================

CREATE TABLE IF NOT EXISTS course_materials (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index để tăng tốc độ tìm kiếm tài liệu theo khóa học
CREATE INDEX idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX idx_course_materials_subject_id ON course_materials(subject_id);
CREATE INDEX idx_course_materials_uploaded_by ON course_materials(uploaded_by);
CREATE INDEX idx_course_materials_is_active ON course_materials(is_active);
