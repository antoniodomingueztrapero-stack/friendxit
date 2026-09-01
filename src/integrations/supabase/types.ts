export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          created_at: string
          holder_id: string | null
          id: string
          image_path: string
          owner_id: string
          played: boolean
          room_id: string
        }
        Insert: {
          created_at?: string
          holder_id?: string | null
          id?: string
          image_path: string
          owner_id: string
          played?: boolean
          room_id: string
        }
        Update: {
          created_at?: string
          holder_id?: string | null
          id?: string
          image_path?: string
          owner_id?: string
          played?: boolean
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_cards: {
        Row: {
          created_at: string
          deck_id: string
          id: string
          image_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deck_id: string
          id?: string
          image_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          deck_id?: string
          id?: string
          image_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      room_players: {
        Row: {
          discards_used: number
          id: string
          is_ready: boolean
          joined_at: string
          room_id: string
          score: number
          user_id: string
        }
        Insert: {
          discards_used?: number
          id?: string
          is_ready?: boolean
          joined_at?: string
          room_id: string
          score?: number
          user_id: string
        }
        Update: {
          discards_used?: number
          id?: string
          is_ready?: boolean
          joined_at?: string
          room_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          clue_seconds: number
          code: string
          created_at: string
          host_id: string
          id: string
          mode: string
          status: string
          submit_seconds: number
          timers_enabled: boolean
          vote_seconds: number
        }
        Insert: {
          clue_seconds?: number
          code: string
          created_at?: string
          host_id: string
          id?: string
          mode?: string
          status?: string
          submit_seconds?: number
          timers_enabled?: boolean
          vote_seconds?: number
        }
        Update: {
          clue_seconds?: number
          code?: string
          created_at?: string
          host_id?: string
          id?: string
          mode?: string
          status?: string
          submit_seconds?: number
          timers_enabled?: boolean
          vote_seconds?: number
        }
        Relationships: []
      }
      round_scores: {
        Row: {
          created_at: string
          id: string
          player_id: string
          points: number
          room_id: string
          round_id: string
          total_after: number
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          points?: number
          room_id: string
          round_id: string
          total_after?: number
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          points?: number
          room_id?: string
          round_id?: string
          total_after?: number
        }
        Relationships: [
          {
            foreignKeyName: "round_scores_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          clue: string | null
          clue_at: string | null
          clue_auto: boolean
          clue_draft: string | null
          created_at: string
          id: string
          number: number
          phase: string
          phase_started_at: string
          room_id: string
          storyteller_id: string
          vote_at: string | null
        }
        Insert: {
          clue?: string | null
          clue_at?: string | null
          clue_auto?: boolean
          clue_draft?: string | null
          created_at?: string
          id?: string
          number: number
          phase?: string
          phase_started_at?: string
          room_id: string
          storyteller_id: string
          vote_at?: string | null
        }
        Update: {
          clue?: string | null
          clue_at?: string | null
          clue_auto?: boolean
          clue_draft?: string | null
          created_at?: string
          id?: string
          number?: number
          phase?: string
          phase_started_at?: string
          room_id?: string
          storyteller_id?: string
          vote_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          card_id: string | null
          created_at: string
          id: string
          image_path: string
          is_storyteller: boolean
          player_id: string
          room_id: string
          round_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          id?: string
          image_path: string
          is_storyteller?: boolean
          player_id: string
          room_id: string
          round_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string
          id?: string
          image_path?: string
          is_storyteller?: boolean
          player_id?: string
          room_id?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          room_id: string
          round_id: string
          submission_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          round_id: string
          submission_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          round_id?: string
          submission_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_round_phase: {
        Args: { _auto_clue?: string | null; _force?: boolean; _room_id: string }
        Returns: string
      }
      deal_shared_hands: {
        Args: { _hand_size?: number; _room_id: string }
        Returns: undefined
      }
      discard_card: {
        Args: { _card_id: string; _room_id: string }
        Returns: string
      }
      is_room_host: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      reset_room_ready: { Args: { _room_id: string }; Returns: undefined }
      set_player_ready: {
        Args: { _ready: boolean; _room_id: string }
        Returns: undefined
      }
      shared_pool_count: { Args: { _room_id: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
