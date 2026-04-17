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
      entities: {
        Row: {
          created_at: string
          date_of_formation: string | null
          entity_type: string
          equity_model: string
          id: string
          name: string
          notes: string | null
          show_committed_capital: boolean
          state_of_formation: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_formation?: string | null
          entity_type: string
          equity_model: string
          id?: string
          name: string
          notes?: string | null
          show_committed_capital?: boolean
          state_of_formation?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_formation?: string | null
          entity_type?: string
          equity_model?: string
          id?: string
          name?: string
          notes?: string | null
          show_committed_capital?: boolean
          state_of_formation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equity_classes: {
        Row: {
          display_order: number
          entity_id: string
          id: string
          is_active: boolean
          name: string
          unit_type: string
        }
        Insert: {
          display_order?: number
          entity_id: string
          id?: string
          is_active?: boolean
          name: string
          unit_type: string
        }
        Update: {
          display_order?: number
          entity_id?: string
          id?: string
          is_active?: boolean
          name?: string
          unit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "equity_classes_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      holders: {
        Row: {
          contact_email: string | null
          holder_type: string
          id: string
          name: string
          notes: string | null
          tax_id_last_four: string | null
        }
        Insert: {
          contact_email?: string | null
          holder_type: string
          id?: string
          name: string
          notes?: string | null
          tax_id_last_four?: string | null
        }
        Update: {
          contact_email?: string | null
          holder_type?: string
          id?: string
          name?: string
          notes?: string | null
          tax_id_last_four?: string | null
        }
        Relationships: []
      }
      holdings: {
        Row: {
          amount: number | null
          committed_capital: number | null
          entity_id: string
          equity_class_id: string
          holder_id: string
          holder_role: string | null
          id: string
        }
        Insert: {
          amount?: number | null
          committed_capital?: number | null
          entity_id: string
          equity_class_id: string
          holder_id: string
          holder_role?: string | null
          id?: string
        }
        Update: {
          amount?: number | null
          committed_capital?: number | null
          entity_id?: string
          equity_class_id?: string
          holder_id?: string
          holder_role?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_equity_class_id_fkey"
            columns: ["equity_class_id"]
            isOneToOne: false
            referencedRelation: "equity_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "holders"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          transaction_id: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          transaction_id: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          created_by: string
          description: string
          effective_date: string
          entity_id: string
          id: string
          metadata: Json
          transaction_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          effective_date: string
          entity_id: string
          id?: string
          metadata?: Json
          transaction_type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          effective_date?: string
          entity_id?: string
          id?: string
          metadata?: Json
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          must_change_password: boolean
          role: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          must_change_password?: boolean
          role?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          must_change_password?: boolean
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_users: { Args: never; Returns: boolean }
      upsert_holding_delta: {
        Args: {
          p_amount_delta: number
          p_committed_capital?: number
          p_entity_id: string
          p_equity_class_id: string
          p_holder_id: string
          p_holder_role?: string
        }
        Returns: {
          amount: number | null
          committed_capital: number | null
          entity_id: string
          equity_class_id: string
          holder_id: string
          holder_role: string | null
          id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "holdings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
