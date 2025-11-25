// Generated database types from Drizzle schemas

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      payments: {
        Row: {
          payment_id: number;
          payment_key: string;
          order_id: string;
          order_name: string;
          total_amount: number;
          metadata: Json;
          raw_data: Json;
          receipt_url: string;
          status: string;
          user_id: string;
          approved_at: string;
          requested_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          payment_id?: number;
          payment_key: string;
          order_id: string;
          order_name: string;
          total_amount: number;
          metadata: Json;
          raw_data: Json;
          receipt_url: string;
          status: string;
          user_id?: string;
          approved_at: string;
          requested_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          payment_id?: number;
          payment_key?: string;
          order_id?: string;
          order_name?: string;
          total_amount?: number;
          metadata?: Json;
          raw_data?: Json;
          receipt_url?: string;
          status?: string;
          user_id?: string;
          approved_at?: string;
          requested_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          profile_id: string;
          name: string;
          marketing_consent: boolean;
          avatar_url: string | null;
          is_super_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          name: string;
          marketing_consent: boolean;
          avatar_url?: string | null;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          name?: string;
          marketing_consent?: boolean;
          avatar_url?: string | null;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
