// TypeScript interfaces for submission review functionality

export interface ProblemReview {
  problem_id: string;
  new_score: number;
  feedback?: string;
}

export interface SubmissionReviewUpdate {
  problem_reviews: ProblemReview[];
  general_feedback?: string;
}

export interface KeywordAnalysis {
  found_keywords: string[];
  missing_keywords: string[];
  match_details: Record<string, any>;
  auto_scored: boolean;
  scoring_method: 'manual' | 'keyword_based' | 'manual_fallback';
  manually_reviewed?: boolean;
  review_method?: string;
  error?: string;
}

export interface ReviewItem {
  problem_id: string;
  problem_title: string;
  student_answer: string;
  current_score: number;
  max_score: number;
  scoring_method: string;
  keyword_analysis: KeywordAnalysis;
  review_priority: 'low' | 'medium' | 'high';
}

export interface PendingReview {
  submission_id: string;
  contest_name: string;
  course_name: string;
  student_id: string;
  student_name: string;
  student_email: string;
  submitted_at: string;
  total_score: number;
  max_possible_score: number;
  review_items: ReviewItem[];
}

export interface PendingReviewsResponse {
  pending_reviews: PendingReview[];
  total_pending: number;
  filters_applied: {
    course_id?: string;
    contest_id?: string;
    scoring_method?: string;
  };
}

export interface DetailedProblem {
  problem_id: string;
  title: string;
  question: string;
  question_type: string;
  scoring_type?: string;
  marks: number;
  keywords_for_scoring?: string;
  student_answer: string;
  current_score: number;
  keyword_analysis?: KeywordAnalysis;
  needs_review: boolean;
}

export interface DetailedSubmission {
  id: string;
  contest_id: string;
  contest_name: string;
  course_name: string;
  student_email: string;
  submitted_at: string;
  time_taken_seconds: number;
  is_auto_submitted: boolean;
  total_score: number;
  max_possible_score: number;
}

export interface SubmissionDetailResponse {
  submission: DetailedSubmission;
  problems: DetailedProblem[];
}

export interface ReviewAnalytics {
  total_submissions: number;
  manual_review_pending: number;
  keyword_scored: number;
  manually_reviewed: number;
  scoring_failures: number;
  total_long_answer_questions: number;
  average_keyword_accuracy: number;
  scoring_method_breakdown: {
    manual: number;
    keyword_based: number;
    manual_fallback: number;
  };
}

export interface RescoreResult {
  submission_id: string;
  rescored_problems: Array<{
    problem_id: string;
    problem_title: string;
    old_score: number;
    new_score: number;
    score_change: number;
    found_keywords: string[];
    missing_keywords: string[];
  }>;
  total_score_change: number;
  new_total_score: number;
  rescored_by: string;
  rescored_at: string;
}

export interface SubmissionReviewResult {
  submission_id: string;
  old_total_score: number;
  new_total_score: number;
  score_change: number;
  updated_problems: Array<{
    problem_id: string;
    old_score: number;
    new_score: number;
    score_change: number;
  }>;
  reviewed_by: string;
  reviewed_at: string;
} 