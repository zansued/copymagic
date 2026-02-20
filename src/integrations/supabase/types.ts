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
      ads: {
        Row: {
          ad_archive_id: string
          ad_creative_link_url: string | null
          ad_snapshot_url: string | null
          ad_text: string | null
          created_at: string
          cta: string | null
          ended_at: string | null
          id: string
          media_type: string | null
          niche: string | null
          page_id: string | null
          page_name: string
          platform: string | null
          raw_data: Json | null
          started_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_archive_id: string
          ad_creative_link_url?: string | null
          ad_snapshot_url?: string | null
          ad_text?: string | null
          created_at?: string
          cta?: string | null
          ended_at?: string | null
          id?: string
          media_type?: string | null
          niche?: string | null
          page_id?: string | null
          page_name?: string
          platform?: string | null
          raw_data?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_archive_id?: string
          ad_creative_link_url?: string | null
          ad_snapshot_url?: string | null
          ad_text?: string | null
          created_at?: string
          cta?: string | null
          ended_at?: string | null
          id?: string
          media_type?: string | null
          niche?: string | null
          page_id?: string | null
          page_name?: string
          platform?: string | null
          raw_data?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      agent_generations: {
        Row: {
          agent_id: string
          agent_name: string
          brand_profile_id: string | null
          created_at: string
          id: string
          inputs: Json
          output: string
          provider: string
          user_id: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          brand_profile_id?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          output?: string
          provider?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          brand_profile_id?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          output?: string
          provider?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_generations_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      collection_items: {
        Row: {
          ad_id: string
          collection_id: string
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          ad_id: string
          collection_id: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          ad_id?: string
          collection_id?: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funnels: {
        Row: {
          ad_id: string
          analysis: Json | null
          checkout_detected: boolean | null
          checkout_platform: string | null
          created_at: string
          final_url: string | null
          funnel_type: string | null
          id: string
          landing_h1: string | null
          landing_title: string | null
          landing_url: string | null
          steps: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id: string
          analysis?: Json | null
          checkout_detected?: boolean | null
          checkout_platform?: string | null
          created_at?: string
          final_url?: string | null
          funnel_type?: string | null
          id?: string
          landing_h1?: string | null
          landing_title?: string | null
          landing_url?: string | null
          steps?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          analysis?: Json | null
          checkout_detected?: boolean | null
          checkout_platform?: string | null
          created_at?: string
          final_url?: string | null
          funnel_type?: string | null
          id?: string
          landing_h1?: string | null
          landing_title?: string | null
          landing_url?: string | null
          steps?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_shares: {
        Row: {
          created_at: string
          generation_id: string
          id: string
          is_public: boolean
          owner_id: string
          share_token: string
          shared_with_email: string | null
        }
        Insert: {
          created_at?: string
          generation_id: string
          id?: string
          is_public?: boolean
          owner_id: string
          share_token?: string
          shared_with_email?: string | null
        }
        Update: {
          created_at?: string
          generation_id?: string
          id?: string
          is_public?: boolean
          owner_id?: string
          share_token?: string
          shared_with_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_shares_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "agent_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      lifetime_slots: {
        Row: {
          created_at: string
          id: string
          slots_sold: number
          total_slots: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          slots_sold?: number
          total_slots?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          slots_sold?: number
          total_slots?: number
          updated_at?: string
        }
        Relationships: []
      }
      mentor_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_flow_steps: {
        Row: {
          agent_id: string
          created_at: string
          description: string
          flow_id: string
          id: string
          output: string | null
          status: string
          step_order: number
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          description?: string
          flow_id: string
          id?: string
          output?: string | null
          status?: string
          step_order: number
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string
          flow_id?: string
          id?: string
          output?: string | null
          status?: string
          step_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_flow_steps_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "mentor_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_flows: {
        Row: {
          conversation_id: string
          created_at: string
          goal: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          goal?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          goal?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_flows_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mentor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mentor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          ad_id: string
          analysis: Json | null
          angle: string | null
          created_at: string
          cta: string | null
          format: string | null
          id: string
          mechanism: string | null
          promise: string | null
          proof: string | null
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id: string
          analysis?: Json | null
          angle?: string | null
          created_at?: string
          cta?: string | null
          format?: string | null
          id?: string
          mechanism?: string | null
          promise?: string | null
          proof?: string | null
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          analysis?: Json | null
          angle?: string | null
          created_at?: string
          cta?: string | null
          format?: string | null
          id?: string
          mechanism?: string | null
          promise?: string | null
          proof?: string | null
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shares: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          permission: string
          project_id: string
          shared_with_email: string
          shared_with_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          permission?: string
          project_id: string
          shared_with_email: string
          shared_with_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          permission?: string
          project_id?: string
          shared_with_email?: string
          shared_with_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      roadmaps: {
        Row: {
          brand_profile_id: string | null
          created_at: string
          id: string
          objective: string
          status: string
          steps: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_profile_id?: string | null
          created_at?: string
          id?: string
          objective: string
          status?: string
          steps?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_profile_id?: string | null
          created_at?: string
          id?: string
          objective?: string
          status?: string
          steps?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmaps_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_library: {
        Row: {
          agent_name: string | null
          category: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          tags: string[] | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          category?: string | null
          content?: string
          created_at?: string
          created_by: string
          id?: string
          tags?: string[] | null
          team_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          tags?: string[] | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_library_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
      subscriptions: {
        Row: {
          active_session_token: string | null
          agents_access: string
          brand_profiles_limit: number
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          generations_limit: number
          generations_used: number
          id: string
          mp_payer_email: string | null
          mp_subscription_id: string | null
          plan: string
          projects_limit: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_session_token?: string | null
          agents_access?: string
          brand_profiles_limit?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          generations_limit?: number
          generations_used?: number
          id?: string
          mp_payer_email?: string | null
          mp_subscription_id?: string | null
          plan?: string
          projects_limit?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_session_token?: string | null
          agents_access?: string
          brand_profiles_limit?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          generations_limit?: number
          generations_used?: number
          id?: string
          mp_payer_email?: string | null
          mp_subscription_id?: string | null
          plan?: string
          projects_limit?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          plan: string
          seats_limit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
          plan?: string
          seats_limit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan?: string
          seats_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_plan: {
        Args: {
          _generations_limit: number
          _plan: string
          _target_user_id: string
        }
        Returns: undefined
      }
      get_admin_metrics: { Args: never; Returns: Json }
      get_admin_users: {
        Args: never
        Returns: {
          current_period_end: string
          current_period_start: string
          email: string
          generations_limit: number
          generations_used: number
          last_sign_in_at: string
          mp_payer_email: string
          mp_subscription_id: string
          plan: string
          registered_at: string
          subscription_status: string
          user_id: string
        }[]
      }
      get_team_role: {
        Args: { _team_id: string; _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
