// Type definitions for our Walrus-based data structures

export interface BountyForm {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  visibility: "Public" | "Private";
  reward_per_question: number;
  reward_token: "USDC" | "WLD";
  creator_id: string | null;
  created_at: string;
  updated_at: string;
  status: "draft" | "active" | "completed" | "cancelled";
  user_eligibility: "Orb" | "Device" | "All";
  featured: boolean;
}

export interface FormQuestion {
  id: string;
  form_id: string;
  title: string;
  description: string | null;
  type: string;
  options: string[] | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  user_id: string | null;
  wallet_address: string | null;
  submitted_at: string;
  total_reward: number;
  created_at: string;
  updated_at: string;
}

export interface FormAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string | null;
  answer_number: number | null;
  answer_boolean: boolean | null;
  answer_json: any | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  wallet_address: string;
  world_id: string | null;
  verification_level: "unverified" | "device" | "orb" | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  total_earned: number;
  forms_completed: number;
  created_at: string;
  updated_at: string;
  location_latitude: number | null;
  location_longitude: number | null;
  location_accuracy: number | null;
  location_updated_at: string | null;
  eligibility_device: boolean;
  eligibility_orb: boolean;
}

export interface VerificationLog {
  id: string;
  user_id: string | null;
  wallet_address: string;
  world_id: string;
  verification_level: "device" | "orb";
  nullifier_hash: string;
  merkle_root: string;
  proof: string;
  verification_timestamp: string;
  created_at: string;
}

export interface PaymentReference {
  id: string;
  form_id: string;
  creator_wallet: string;
  amount: number;
  token: "USDC" | "WLD";
  transaction_hash: string | null;
  status: "pending" | "confirmed" | "failed";
  max_questions: number;
  created_at: string;
  updated_at: string;
}

// Legacy types for backward compatibility - will be removed
export type Database = any;
