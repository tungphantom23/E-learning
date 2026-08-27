// Shared types between teacher and student interfaces

export interface CourseMaterial {
  id: number;
  courseId: number;
  subjectId?: number;
  courseCode: string;
  courseName: string;
  subjectCode?: string;
  subjectTitle?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description?: string;
  uploadedById: number;
  uploadedByName: string;
  uploadedByEmail: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SharedAppState {
  materials: CourseMaterial[];
  setMaterials: (materials: CourseMaterial[]) => void;
}
