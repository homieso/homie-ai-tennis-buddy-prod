export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          gender: string | null
          playing_years: string | null
          self_rated_ntrp: number | null
          created_at: string
          updated_at: string
          membership_valid_until: string | null
          nickname: string | null
          age: number | null
          message_to_homie: string | null
        }
        Insert: {
          id: string
          username?: string | null
          gender?: string | null
          playing_years?: string | null
          self_rated_ntrp?: number | null
          created_at?: string
          updated_at?: string
          membership_valid_until?: string | null
          nickname?: string | null
          age?: number | null
          message_to_homie?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          gender?: string | null
          playing_years?: string | null
          self_rated_ntrp?: number | null
          created_at?: string
          updated_at?: string
          membership_valid_until?: string | null
          nickname?: string | null
          age?: number | null
          message_to_homie?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      weekly_goals: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          next_lesson_time: string | null
          confusion: string | null
          core_goal: string | null
          micro_exercises: string[] | null
          emotion_reminder: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start_date: string
          next_lesson_time?: string | null
          confusion?: string | null
          core_goal?: string | null
          micro_exercises?: string[] | null
          emotion_reminder?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start_date?: string
          next_lesson_time?: string | null
          confusion?: string | null
          core_goal?: string | null
          micro_exercises?: string[] | null
          emotion_reminder?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_goals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      practice_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          coach_content: string | null
          best_shot: string | null
          worst_shot: string | null
          ai_companion_log: string | null
          next_reminder: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          coach_content?: string | null
          best_shot?: string | null
          worst_shot?: string | null
          ai_companion_log?: string | null
          next_reminder?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          coach_content?: string | null
          best_shot?: string | null
          worst_shot?: string | null
          ai_companion_log?: string | null
          next_reminder?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      risk_assessments: {
        Row: {
          id: string
          user_id: string
          risk_score: number | null
          last_active_date: string | null
          triggered_intervention: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          risk_score?: number | null
          last_active_date?: string | null
          triggered_intervention?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          risk_score?: number | null
          last_active_date?: string | null
          triggered_intervention?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      activation_codes: {
        Row: {
          id: string
          code: string
          used_at: string | null
          used_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          used_at?: string | null
          used_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          used_at?: string | null
          used_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activation_codes_used_by_fkey"
            columns: ["used_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      feedback: {
        Row: {
          id: string
          user_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}