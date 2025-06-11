import { API_BASE_URL } from '../config/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Question Type Enums
export enum QuestionType {
  MCQ = 'mcq',
  LONG_ANSWER = 'long_answer'
}

export enum ScoringType {
  MANUAL = 'manual',
  KEYWORD_BASED = 'keyword_based',
  AUTO = 'auto'
}

// Question interfaces
export interface QuestionData {
  title: string;
  description: string;
  question_type: QuestionType;
  explanation?: string;
  tag_ids?: string[];
  
  // MCQ-specific fields
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_options?: string[];
  
  // Long Answer specific fields
  max_word_count?: number;
  sample_answer?: string;
  scoring_type?: ScoringType;
  keywords_for_scoring?: string[];
}

export interface QuestionResponse {
  id: string;
  title: string;
  description: string;
  question_type: QuestionType;
  explanation?: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: TagInfo[];
  needs_tags: boolean;
  
  // MCQ-specific fields
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_options?: string[];
  
  // Long Answer specific fields
  max_word_count?: number;
  sample_answer?: string;
  scoring_type?: ScoringType;
  keywords_for_scoring?: string[];
}

export interface TagInfo {
  id: string;
  name: string;
  color: string;
}

class ApiService {
  private getHeaders(isFormData = false): HeadersInit {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
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
      
      // Check if response is HTML (common with proxy/server errors)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error(`Server returned HTML instead of JSON (${response.status})`);
        throw new Error(`Server error: HTTP ${response.status} - Please try again later`);
      }
      
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Server returned non-JSON response:', contentType);
      throw new Error('Server returned invalid response format');
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

  async completeAdminProfile(data: { name: string; mobile: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/complete-profile`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  // Question Management (updated from MCQ Management)
  async getQuestions(skip = 0, limit = 100, search?: string, tagIds?: string, tagNames?: string, createdBy?: string, needsTags?: boolean, questionType?: QuestionType) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    if (tagIds) {
      params.append('tag_ids', tagIds);
    }
    
    if (tagNames) {
      params.append('tag_names', tagNames);
    }
    
    if (createdBy) {
      params.append('created_by', createdBy);
    }
    
    if (needsTags !== undefined) {
      params.append('needs_tags', needsTags.toString());
    }
    
    if (questionType !== undefined) {
      params.append('question_type', questionType);
    }
    
    const response = await fetch(`${API_BASE_URL}/mcq/?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Backward compatibility - keep old method name
  async getMCQs(skip = 0, limit = 100, search?: string, tagIds?: string, tagNames?: string, createdBy?: string, needsTags?: boolean) {
    return this.getQuestions(skip, limit, search, tagIds, tagNames, createdBy, needsTags, QuestionType.MCQ);
  }

  async getQuestionsList(skip = 0, limit = 100, search?: string, tagIds?: string, questionType?: QuestionType) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    if (tagIds) {
      params.append('tag_ids', tagIds);
    }
    
    if (questionType !== undefined) {
      params.append('question_type', questionType);
    }
    
    const response = await fetch(`${API_BASE_URL}/mcq/list?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Backward compatibility
  async getMCQsList(skip = 0, limit = 100, search?: string, tagIds?: string) {
    return this.getQuestionsList(skip, limit, search, tagIds, QuestionType.MCQ);
  }

  async getQuestion(id: string): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE_URL}/mcq/${id}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Backward compatibility
  async getMCQ(id: string) {
    return this.getQuestion(id);
  }

  async createQuestion(data: QuestionData): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE_URL}/mcq`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create question');
    }

    return response.json();
  }

  // Backward compatibility
  async createMCQ(data: any): Promise<any> {
    return this.createQuestion({ ...data, question_type: QuestionType.MCQ });
  }

  async updateQuestion(id: string, data: Partial<QuestionData>): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE_URL}/mcq/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update question');
    }

    return response.json();
  }

  // Backward compatibility
  async updateMCQ(id: string, data: any): Promise<any> {
    return this.updateQuestion(id, data);
  }

  async uploadQuestionImage(id: string, imageFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/mcq/${id}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload image');
    }

    return response.json();
  }

  // Backward compatibility
  async uploadMCQImage(id: string, imageFile: File): Promise<any> {
    return this.uploadQuestionImage(id, imageFile);
  }

  async removeQuestionImage(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/mcq/${id}/remove-image`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to remove image');
    }

    return response.json();
  }

  // Backward compatibility
  async removeMCQImage(id: string): Promise<any> {
    return this.removeQuestionImage(id);
  }

  async deleteQuestion(id: string) {
    const response = await fetch(`${API_BASE_URL}/mcq/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Backward compatibility
  async deleteMCQ(id: string) {
    return this.deleteQuestion(id);
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

  // Tag Management
  async getTags(skip = 0, limit = 100, search?: string, createdBy?: string) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    if (createdBy) {
      params.append('created_by', createdBy);
    }
    
    const response = await fetch(`${API_BASE_URL}/tags/?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getTag(id: string) {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createTag(data: { name: string; description?: string; color?: string }) {
    const response = await fetch(`${API_BASE_URL}/tags/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async updateTag(id: string, data: { name?: string; description?: string; color?: string }) {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async deleteTag(id: string) {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getTagSuggestions(query: string, limit = 10) {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/tags/search/suggestions?${params}`, {
      headers: this.getHeaders(),
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

  async deleteCourse(id: string) {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
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

  async downloadCourseEnrollmentTemplate(courseId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enrollment-template`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.blob();
  }

  async bulkEnrollStudentsCSV(courseId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll-csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
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

  async deleteContest(id: string) {
    const response = await fetch(`${API_BASE_URL}/contests/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async toggleContestStatus(id: string, isActive: boolean) {
    const response = await fetch(`${API_BASE_URL}/contests/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ is_active: isActive }),
    });
    
    return this.handleResponse(response);
  }

  async submitContest(contestId: string, answers: Record<string, string[] | string>, timeTaken?: number) {
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
    
    // Handle 404 gracefully for submissions that don't exist
    if (response.status === 404) {
      return null;
    }
    
    return this.handleResponse(response);
  }

  async getMySubmissionDetails(contestId: string) {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/my-submission-details`, {
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

  // User Management (formerly Student Management)
  async getUsers(skip = 0, limit = 100, search?: string, role?: string) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    if (role) {
      params.append('role', role);
    }
    
    const response = await fetch(`${API_BASE_URL}/students/?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getUser(id: string) {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createUser(data: any) {
    const response = await fetch(`${API_BASE_URL}/students/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async updateUser(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async deleteUser(id: string) {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Keep backward compatibility methods
  async getStudents(skip = 0, limit = 100, search?: string) {
    return this.getUsers(skip, limit, search, 'student');
  }

  async getStudent(id: string) {
    return this.getUser(id);
  }

  async createStudent(data: any) {
    return this.createUser(data);
  }

  async updateStudent(id: string, data: any) {
    return this.updateUser(id, data);
  }

  async deleteStudent(id: string) {
    return this.deleteUser(id);
  }

  // Updated Course Enrollment (using student IDs instead of emails)
  async unenrollStudent(courseId: string, studentId: string) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/students/${studentId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Get all submissions for current student (optimized single API call)
  async getMySubmissions() {
    try {
      const response = await fetch(`${API_BASE_URL}/contests/my-submissions`, {
        headers: this.getHeaders(),
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      throw error;
    }
  }

  // Keep backward compatibility
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
      headers: this.getHeaders(true), // true for FormData
      body: formData,
    });
    
    return this.handleResponse(response);
  }

  // Alias for user management interface
  async downloadUserTemplate(): Promise<Blob> {
    return this.downloadStudentTemplate();
  }

  async bulkImportUsers(file: File) {
    return this.bulkImportStudents(file);
  }

  // Email Management API Methods
  async getStudentsWithEmailStatus(skip = 0, limit = 100, search?: string, emailStatus?: string) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    if (emailStatus) {
      params.append('email_status', emailStatus);
    }
    
    const response = await fetch(`${API_BASE_URL}/students/email-status?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getEmailOperationStatus(operationId: string) {
    const response = await fetch(`${API_BASE_URL}/students/email-operation/${operationId}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async bulkImportWithEmail(file: File, sendEmails = true, courseId?: string, emailDelaySeconds = 1) {
    const formData = new FormData();
    formData.append('file', file);
    
    const params = new URLSearchParams({
      send_emails: sendEmails.toString(),
      email_delay_seconds: emailDelaySeconds.toString(),
    });
    
    if (courseId) {
      params.append('course_id', courseId);
    }
    
    const response = await fetch(`${API_BASE_URL}/students/bulk-import-with-email?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    });
    
    return this.handleResponse(response);
  }

  async sendInvitationEmails(studentIds: string[], courseId?: string, customMessage?: string) {
    const response = await fetch(`${API_BASE_URL}/students/send-invitations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        student_ids: studentIds,
        course_id: courseId,
        custom_message: customMessage,
      }),
    });
    
    return this.handleResponse(response);
  }

  async sendBulkEmail(studentEmails: string[], subject: string, message: string, courseId?: string) {
    const response = await fetch(`${API_BASE_URL}/students/bulk-email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        student_emails: studentEmails,
        subject,
        message,
        course_id: courseId,
      }),
    });
    
    return this.handleResponse(response);
  }

  async updateStudentEmailStatus(studentId: string, emailSent?: boolean, emailVerified?: boolean) {
    const params = new URLSearchParams();
    
    if (emailSent !== undefined) {
      params.append('email_sent', emailSent.toString());
    }
    
    if (emailVerified !== undefined) {
      params.append('email_verified', emailVerified.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/email-status?${params}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }



  // Contest time synchronization and timezone support
  async getServerTime() {
    const response = await fetch(`${API_BASE_URL}/contests/time`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getContestTimeInfo(contestId: string) {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/time`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async autoSubmitContest(contestId: string, answers: Record<string, string[] | string>, timeTaken?: number) {
    const response = await fetch(`${API_BASE_URL}/contests/${contestId}/auto-submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ answers, time_taken: timeTaken }),
    });
    
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService(); 