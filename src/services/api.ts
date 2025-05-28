const API_BASE_URL = 'http://localhost:8000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    return this.handleResponse(response);
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createAdmin(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/create-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'admin' }),
    });
    
    return this.handleResponse(response);
  }

  // MCQ Management
  async getMCQs(skip = 0, limit = 100, search?: string) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await fetch(`${API_BASE_URL}/mcq/?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getMCQ(id: string) {
    const response = await fetch(`${API_BASE_URL}/mcq/${id}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createMCQ(data: any) {
    const response = await fetch(`${API_BASE_URL}/mcq/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async updateMCQ(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/mcq/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async deleteMCQ(id: string) {
    const response = await fetch(`${API_BASE_URL}/mcq/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async downloadMCQTemplate(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/mcq/template/download`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.blob();
  }

  async bulkImportMCQs(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/mcq/bulk-import`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    return this.handleResponse(response);
  }

  // Course Management
  async getCourses(skip = 0, limit = 100) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/courses/?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getCourse(id: string) {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createCourse(data: any) {
    const response = await fetch(`${API_BASE_URL}/courses/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async enrollStudents(courseId: string, studentIds: string[]) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ student_ids: studentIds }),
    });
    
    return this.handleResponse(response);
  }

  async getCourseStudents(courseId: string) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/students`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Contest Management
  async getContests(courseId?: string) {
    const params = new URLSearchParams();
    if (courseId) {
      params.append('course_id', courseId);
    }
    
    const response = await fetch(`${API_BASE_URL}/contests/?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getContest(id: string) {
    const response = await fetch(`${API_BASE_URL}/contests/${id}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createContest(data: any, courseId: string) {
    const params = new URLSearchParams({ course_id: courseId });
    
    const response = await fetch(`${API_BASE_URL}/contests/?${params}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async updateContest(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/contests/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async submitContest(contestId: string, answers: Record<string, string[]>, timeTaken?: number) {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        answers,
        time_taken_seconds: timeTaken,
      }),
    });
    
    return this.handleResponse(response);
  }

  async getContestSubmissions(contestId: string) {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/submissions`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getMySubmission(contestId: string) {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/my-submission`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Results Management
  async getContestResults(contestId: string) {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/submissions`, {
      headers: this.getHeaders(),
    });
    
    const data = await this.handleResponse(response) as any;
    
    // Extract submissions array from the response and format for Results component
    return data.submissions.map((submission: any) => ({
      id: submission.id,
      student_email: submission.student_email,
      score: submission.total_score,
      max_score: submission.max_possible_score,
      percentage: submission.percentage,
      submitted_at: submission.submitted_at,
      time_taken_seconds: submission.time_taken_seconds
    }));
  }

  // Export
  async exportResults(contestId: string, format: 'excel' | 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/${contestId}/${format}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.blob();
  }

  async downloadExcel(contestId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/${contestId}/excel`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.blob();
  }

  // Student Management
  async getStudents(skip = 0, limit = 100, search?: string) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await fetch(`${API_BASE_URL}/students/?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getStudent(id: string) {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createStudent(data: any) {
    const response = await fetch(`${API_BASE_URL}/students/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async updateStudent(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async deleteStudent(id: string) {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Updated Course Enrollment (using student IDs instead of emails)
  async unenrollStudent(courseId: string, studentId: string) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/students/${studentId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Get all submissions for current student
  async getMySubmissions() {
    try {
      // First get all contests the student has access to
      const contests = await this.getContests() as any[];
      
      // Then get submissions for each contest
      const submissions = [];
      for (const contest of contests) {
        try {
          const submission = await this.getMySubmission(contest.id) as any;
          
          // Get course name
          let courseName = 'Unknown Course';
          try {
            const course = await this.getCourse(contest.course_id) as { name: string };
            courseName = course.name;
          } catch (error) {
            // Course name fetch failed, use default
          }
          
          submissions.push({
            id: submission.id,
            contest_id: submission.contest_id,
            student_id: submission.student_id,
            total_score: submission.total_score,
            max_possible_score: submission.max_possible_score,
            submitted_at: submission.submitted_at,
            time_taken_seconds: submission.time_taken_seconds,
            is_auto_submitted: submission.is_auto_submitted,
            contest_name: contest.name,
            course_name: courseName,
            percentage: submission.max_possible_score > 0 
              ? (submission.total_score / submission.max_possible_score * 100) 
              : 0
          });
        } catch (error) {
          // Student hasn't submitted for this contest, skip
          continue;
        }
      }
      
      return submissions;
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      throw error;
    }
  }

  async downloadStudentTemplate(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/students/template/download`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.blob();
  }

  async bulkImportStudents(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/students/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    });
    
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService(); 