export interface Course {
  id: string;
  name: string;
  description?: string;
  instructor_id: string;
  enrollment_count: number;  // Backend field for student count
  created_at: string;
  updated_at: string;
}

export interface CourseStudentsResponse {
  course_id: string;
  course_name: string;
  students: EnrolledStudent[];
}

export interface EnrolledStudent {
  id: string;
  email: string;
  is_active: boolean;
  enrolled_at: string;
  enrollment_active: boolean;
} 