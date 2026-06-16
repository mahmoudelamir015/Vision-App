export type QuestionType = 'mcq' | 'true_false';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
