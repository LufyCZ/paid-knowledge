import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Database {
  public: {
    Tables: {
      bounty_forms: {
        Row: {
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
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          visibility: "Public" | "Private";
          reward_per_question: number;
          reward_token: "USDC" | "WLD";
          creator_id?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: "draft" | "active" | "completed" | "cancelled";
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          visibility?: "Public" | "Private";
          reward_per_question?: number;
          reward_token?: "USDC" | "WLD";
          creator_id?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: "draft" | "active" | "completed" | "cancelled";
        };
      };
      form_questions: {
        Row: {
          id: string;
          form_id: string;
          title: string;
          description: string | null;
          type: string;
          options: string[] | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          title: string;
          description?: string | null;
          type: string;
          options?: string[] | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          title?: string;
          description?: string | null;
          type?: string;
          options?: string[] | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      form_responses: {
        Row: {
          id: string;
          form_id: string;
          user_id: string | null;
          wallet_address: string | null;
          submitted_at: string;
          total_reward: number;
          reward_token: "USDC" | "WLD";
          status: "pending" | "approved" | "rejected" | "paid";
        };
        Insert: {
          id?: string;
          form_id: string;
          user_id?: string | null;
          wallet_address?: string | null;
          submitted_at?: string;
          total_reward: number;
          reward_token: "USDC" | "WLD";
          status?: "pending" | "approved" | "rejected" | "paid";
        };
        Update: {
          id?: string;
          form_id?: string;
          user_id?: string | null;
          wallet_address?: string | null;
          submitted_at?: string;
          total_reward?: number;
          reward_token?: "USDC" | "WLD";
          status?: "pending" | "approved" | "rejected" | "paid";
        };
      };
      question_answers: {
        Row: {
          id: string;
          response_id: string;
          question_id: string;
          answer_text: string | null;
          answer_options: string[] | null;
          file_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          question_id: string;
          answer_text?: string | null;
          answer_options?: string[] | null;
          file_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          question_id?: string;
          answer_text?: string | null;
          answer_options?: string[] | null;
          file_url?: string | null;
          created_at?: string;
        };
      };
      payment_references: {
        Row: {
          id: string;
          reference_id: string;
          transaction_id: string | null;
          status: string;
          form_id: string | null;
          response_id: string | null;
          metadata: any;
          verification_result: any;
          initiated_at: string;
          confirmed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_id: string;
          transaction_id?: string | null;
          status?: string;
          form_id?: string | null;
          response_id?: string | null;
          metadata?: any;
          verification_result?: any;
          initiated_at?: string;
          confirmed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_id?: string;
          transaction_id?: string | null;
          status?: string;
          form_id?: string | null;
          response_id?: string | null;
          metadata?: any;
          verification_result?: any;
          initiated_at?: string;
          confirmed_at?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

export type BountyForm = Database["public"]["Tables"]["bounty_forms"]["Row"];
export type FormQuestion =
  Database["public"]["Tables"]["form_questions"]["Row"];
export type FormResponse =
  Database["public"]["Tables"]["form_responses"]["Row"];
export type QuestionAnswer =
  Database["public"]["Tables"]["question_answers"]["Row"];
export type PaymentReference =
  Database["public"]["Tables"]["payment_references"]["Row"];
