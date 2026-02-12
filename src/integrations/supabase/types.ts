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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_configs: {
        Row: {
          brand_personality: string
          created_at: string
          id: string
          product_service: string
          target_audience: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_personality?: string
          created_at?: string
          id?: string
          product_service?: string
          target_audience?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_personality?: string
          created_at?: string
          id?: string
          product_service?: string
          target_audience?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_profiles: {
        Row: {
          audience_summary: string
          brand_identity: Json
          brand_voice: Json
          created_at: string
          credentials: Json
          id: string
          is_default: boolean
          name: string
          personality_summary: string
          product_service: Json
          product_summary: string
          target_audience: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          audience_summary?: string
          brand_identity?: Json
          brand_voice?: Json
          created_at?: string
          credentials?: Json
          id?: string
          is_default?: boolean
          name?: string
          personality_summary?: string
          product_service?: Json
          product_summary?: string
          target_audience?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          audience_summary?: string
          brand_identity?: Json
          brand_voice?: Json
          created_at?: string
          credentials?: Json
          id?: string
          is_default?: boolean
          name?: string
          personality_summary?: string
          product_service?: Json
          product_summary?: string
          target_audience?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          avoid_real_names: boolean
          copy_results: Json
          created_at: string
          cultural_region: string | null
          id: string
          language_code: string
          name: string
          product_input: string
          research_data: Json | null
          tone_formality: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avoid_real_names?: boolean
          copy_results?: Json
          created_at?: string
          cultural_region?: string | null
          id?: string
          language_code?: string
          name: string
          product_input?: string
          research_data?: Json | null
          tone_formality?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avoid_real_names?: boolean
          copy_results?: Json
          created_at?: string
          cultural_region?: string | null
          id?: string
          language_code?: string
          name?: string
          product_input?: string
          research_data?: Json | null
          tone_formality?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_generations: {
        Row: {
          branding: Json | null
          created_at: string
          cultural_region: string | null
          generated_assets: Json | null
          generated_html: string | null
          id: string
          include_upsells: boolean | null
          language_code: string | null
          locale_code: string | null
          project_id: string
          status: string
          template_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branding?: Json | null
          created_at?: string
          cultural_region?: string | null
          generated_assets?: Json | null
          generated_html?: string | null
          id?: string
          include_upsells?: boolean | null
          language_code?: string | null
          locale_code?: string | null
          project_id: string
          status?: string
          template_key?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branding?: Json | null
          created_at?: string
          cultural_region?: string | null
          generated_assets?: Json | null
          generated_html?: string | null
          id?: string
          include_upsells?: boolean | null
          language_code?: string | null
          locale_code?: string | null
          project_id?: string
          status?: string
          template_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
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
