export interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export enum LetterCategory {
  GOVERNMENT = 'government',
  EDUCATION = 'education',
  BANK = 'bank',
  PURCHASE = 'purchase',
  UTILITY = 'utility',
  TAX = 'tax',
  INSURANCE = 'insurance',
  LEGAL = 'legal',
  PERSONAL = 'personal',
  SUBSCRIPTION = 'subscription',
  DELIVERY = 'delivery',
  GENERAL = 'general',
  OTHER = 'other',
}

export enum ActionStatus {
  NONE = 'none',
  WAIT_FOR_ACTION = 'wait_for_action',
  COMPLETE = 'complete',
  CANCELED = 'canceled',
}

export interface SenderInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Letter {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: LetterCategory;
  sender_info: SenderInfo;
  starred: boolean;
  reminder_active: boolean;
  ai_summary: string;
  ai_suggestion: string;
  ai_suggestion_action_deadline_date: string | null;
  action_status: ActionStatus;
  sent_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  images?: string[]; // base64 encoded images
  note?: string;
  reminder_at?: string | null;
  translations?: {
    [key: string]: {
        content: string;
        summary: string;
        suggestion: string;
    }
  };
}

export interface ChatMessage {
  id: string;
  letter_id: string;
  user_id: string;
  role: 'system' | 'user' | 'assistant';
  message: string;
  created_at: string;
  deleted_at: string | null;
}