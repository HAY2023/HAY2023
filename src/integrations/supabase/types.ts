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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_access_logs: {
        Row: {
          accessed_at: string
          asn: string | null
          browser: string | null
          city: string | null
          color_depth: number | null
          connection_type: string | null
          country: string | null
          device_memory: number | null
          device_type: string | null
          fingerprint_id: string | null
          hardware_concurrency: number | null
          id: string
          ip_address: string | null
          is_authorized: boolean | null
          isp: string | null
          language: string | null
          latitude: number | null
          longitude: number | null
          network_type: string | null
          org: string | null
          os: string | null
          password_attempted: boolean | null
          pixel_ratio: number | null
          postal: string | null
          referrer: string | null
          region: string | null
          screen_size: string | null
          timezone: string | null
          touch_support: boolean | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          asn?: string | null
          browser?: string | null
          city?: string | null
          color_depth?: number | null
          connection_type?: string | null
          country?: string | null
          device_memory?: number | null
          device_type?: string | null
          fingerprint_id?: string | null
          hardware_concurrency?: number | null
          id?: string
          ip_address?: string | null
          is_authorized?: boolean | null
          isp?: string | null
          language?: string | null
          latitude?: number | null
          longitude?: number | null
          network_type?: string | null
          org?: string | null
          os?: string | null
          password_attempted?: boolean | null
          pixel_ratio?: number | null
          postal?: string | null
          referrer?: string | null
          region?: string | null
          screen_size?: string | null
          timezone?: string | null
          touch_support?: boolean | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          asn?: string | null
          browser?: string | null
          city?: string | null
          color_depth?: number | null
          connection_type?: string | null
          country?: string | null
          device_memory?: number | null
          device_type?: string | null
          fingerprint_id?: string | null
          hardware_concurrency?: number | null
          id?: string
          ip_address?: string | null
          is_authorized?: boolean | null
          isp?: string | null
          language?: string | null
          latitude?: number | null
          longitude?: number | null
          network_type?: string | null
          org?: string | null
          os?: string | null
          password_attempted?: boolean | null
          pixel_ratio?: number | null
          postal?: string | null
          referrer?: string | null
          region?: string | null
          screen_size?: string | null
          timezone?: string | null
          touch_support?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_credentials: {
        Row: {
          created_at: string
          failed_attempts: number | null
          id: string
          locked_until: string | null
          password_hash: string
          security_failed_attempts: number | null
          security_locked_until: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          password_hash: string
          security_failed_attempts?: number | null
          security_locked_until?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          password_hash?: string
          security_failed_attempts?: number | null
          security_locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          type?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          fingerprint_id: string | null
          id: string
          ip_address: string | null
          reason: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          fingerprint_id?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          fingerprint_id?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      flash_messages: {
        Row: {
          color: string
          created_at: string
          end_date: string | null
          font_size: string | null
          id: string
          is_active: boolean
          message: string
          start_date: string | null
          text_direction: string
        }
        Insert: {
          color?: string
          created_at?: string
          end_date?: string | null
          font_size?: string | null
          id?: string
          is_active?: boolean
          message: string
          start_date?: string | null
          text_direction?: string
        }
        Update: {
          color?: string
          created_at?: string
          end_date?: string | null
          font_size?: string | null
          id?: string
          is_active?: boolean
          message?: string
          start_date?: string | null
          text_direction?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          body: string
          id: string
          recipients_count: number | null
          sent_at: string | null
          sent_by: string | null
          title: string
        }
        Insert: {
          body: string
          id?: string
          recipients_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          title: string
        }
        Update: {
          body?: string
          id?: string
          recipients_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          title?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          admin_fcm_token: string | null
          created_at: string | null
          id: string
          notify_every_n_questions: number | null
          notify_on_question: boolean | null
          questions_since_last_notification: number | null
          updated_at: string | null
        }
        Insert: {
          admin_fcm_token?: string | null
          created_at?: string | null
          id?: string
          notify_every_n_questions?: number | null
          notify_on_question?: boolean | null
          questions_since_last_notification?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_fcm_token?: string | null
          created_at?: string | null
          id?: string
          notify_every_n_questions?: number | null
          notify_on_question?: boolean | null
          questions_since_last_notification?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          device_type: string | null
          id: string
          is_admin: boolean | null
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          is_admin?: boolean | null
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          is_admin?: boolean | null
          token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          created_at: string
          id: string
          question_text: string
          review_status: string | null
          reviewed_text: string | null
          reviewer_notes: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          question_text: string
          review_status?: string | null
          reviewed_text?: string | null
          reviewer_notes?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          question_text?: string
          review_status?: string | null
          reviewed_text?: string | null
          reviewer_notes?: string | null
        }
        Relationships: []
      }
      security_credentials: {
        Row: {
          created_at: string | null
          failed_attempts: number | null
          id: string
          locked_until: string | null
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          content_filter_enabled: boolean | null
          countdown_bg_color: string | null
          countdown_border_color: string | null
          countdown_style: number | null
          countdown_text_color: string | null
          created_at: string
          id: string
          is_box_open: boolean
          maintenance_message: string | null
          maintenance_mode: boolean | null
          next_session_date: string | null
          show_countdown: boolean
          show_install_page: boolean | null
          show_question_count: boolean | null
          updated_at: string
          video_title: string | null
          video_url: string | null
        }
        Insert: {
          content_filter_enabled?: boolean | null
          countdown_bg_color?: string | null
          countdown_border_color?: string | null
          countdown_style?: number | null
          countdown_text_color?: string | null
          created_at?: string
          id?: string
          is_box_open?: boolean
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          next_session_date?: string | null
          show_countdown?: boolean
          show_install_page?: boolean | null
          show_question_count?: boolean | null
          updated_at?: string
          video_title?: string | null
          video_url?: string | null
        }
        Update: {
          content_filter_enabled?: boolean | null
          countdown_bg_color?: string | null
          countdown_border_color?: string | null
          countdown_style?: number | null
          countdown_text_color?: string | null
          created_at?: string
          id?: string
          is_box_open?: boolean
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          next_session_date?: string | null
          show_countdown?: boolean
          show_install_page?: boolean | null
          show_question_count?: boolean | null
          updated_at?: string
          video_title?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string | null
          device_info: Json | null
          email: string | null
          id: string
          message: string
          report_type: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          email?: string | null
          id?: string
          message: string
          report_type: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          email?: string | null
          id?: string
          message?: string
          report_type?: string
          status?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_announcement_authenticated: {
        Args: { p_message: string; p_password: string; p_type?: string }
        Returns: string
      }
      add_flash_message_authenticated:
        | {
            Args: {
              p_color?: string
              p_end_date?: string
              p_message: string
              p_password: string
              p_start_date?: string
              p_text_direction?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_color?: string
              p_end_date?: string
              p_font_size?: string
              p_message: string
              p_password: string
              p_start_date?: string
              p_text_direction?: string
            }
            Returns: string
          }
      add_notification_authenticated: {
        Args: {
          p_body: string
          p_password: string
          p_recipients_count?: number
          p_title: string
        }
        Returns: string
      }
      add_video_authenticated: {
        Args: { p_password: string; p_title: string; p_url: string }
        Returns: string
      }
      block_user_authenticated: {
        Args: {
          p_fingerprint_id: string
          p_ip_address: string
          p_password: string
          p_reason?: string
        }
        Returns: string
      }
      delete_access_log_authenticated: {
        Args: { p_log_id: string; p_password: string }
        Returns: boolean
      }
      delete_all_questions_authenticated: {
        Args: { p_password: string }
        Returns: boolean
      }
      delete_announcement_authenticated: {
        Args: { p_announcement_id: string; p_password: string }
        Returns: boolean
      }
      delete_flash_message_authenticated: {
        Args: { p_flash_message_id: string; p_password: string }
        Returns: boolean
      }
      delete_notification_authenticated: {
        Args: { p_notification_id: string; p_password: string }
        Returns: boolean
      }
      delete_selected_questions_authenticated: {
        Args: { p_password: string; p_question_ids: string[] }
        Returns: boolean
      }
      delete_user_report_authenticated: {
        Args: { p_password: string; p_report_id: string }
        Returns: boolean
      }
      delete_video_authenticated: {
        Args: { p_password: string; p_video_id: string }
        Returns: boolean
      }
      get_admin_access_logs_authenticated: {
        Args: { p_password: string }
        Returns: {
          accessed_at: string
          asn: string
          browser: string
          city: string
          color_depth: number
          connection_type: string
          country: string
          device_memory: number
          device_type: string
          fingerprint_id: string
          hardware_concurrency: number
          id: string
          ip_address: string
          is_authorized: boolean
          isp: string
          language: string
          latitude: number
          longitude: number
          network_type: string
          org: string
          os: string
          password_attempted: boolean
          pixel_ratio: number
          postal: string
          referrer: string
          region: string
          screen_size: string
          timezone: string
          touch_support: boolean
          user_agent: string
        }[]
      }
      get_blocked_users_authenticated: {
        Args: { p_password: string }
        Returns: {
          blocked_at: string
          fingerprint_id: string
          id: string
          ip_address: string
          reason: string
        }[]
      }
      get_notification_history_authenticated: {
        Args: { p_password: string }
        Returns: {
          body: string
          id: string
          recipients_count: number
          sent_at: string
          title: string
        }[]
      }
      get_public_questions_count: { Args: never; Returns: number }
      get_questions_authenticated: {
        Args: { p_password: string }
        Returns: {
          category: string
          created_at: string
          id: string
          question_text: string
          review_status: string
          reviewed_text: string
          reviewer_notes: string
        }[]
      }
      get_questions_count_authenticated: {
        Args: { p_password: string }
        Returns: number
      }
      get_security_logs_authenticated: {
        Args: { p_password: string }
        Returns: {
          accessed_at: string
          browser: string
          city: string
          country: string
          device_type: string
          fingerprint_id: string
          id: string
          ip_address: string
          is_authorized: boolean
          isp: string
          language: string
          org: string
          os: string
          password_attempted: boolean
          timezone: string
        }[]
      }
      get_user_reports_authenticated: {
        Args: { p_password: string }
        Returns: {
          created_at: string
          device_info: Json
          email: string
          id: string
          message: string
          report_type: string
          status: string
        }[]
      }
      is_user_blocked: {
        Args: { p_fingerprint_id?: string; p_ip_address?: string }
        Returns: boolean
      }
      log_admin_access: {
        Args: {
          p_asn?: string
          p_browser: string
          p_city: string
          p_color_depth?: number
          p_connection_type?: string
          p_country: string
          p_device_memory?: number
          p_device_type: string
          p_fingerprint_id?: string
          p_hardware_concurrency?: number
          p_ip_address: string
          p_is_authorized: boolean
          p_isp?: string
          p_language?: string
          p_latitude?: number
          p_longitude?: number
          p_network_type?: string
          p_org?: string
          p_os: string
          p_password_attempted?: boolean
          p_pixel_ratio?: number
          p_postal?: string
          p_referrer?: string
          p_region?: string
          p_screen_size: string
          p_timezone?: string
          p_touch_support?: boolean
          p_user_agent?: string
        }
        Returns: string
      }
      reorder_videos_authenticated: {
        Args: { p_password: string; p_video_ids: string[] }
        Returns: boolean
      }
      unblock_user_authenticated: {
        Args: { p_blocked_id: string; p_password: string }
        Returns: boolean
      }
      update_admin_password: {
        Args: { p_new_password: string; p_old_password: string }
        Returns: boolean
      }
      update_notification_settings_authenticated: {
        Args: {
          p_admin_fcm_token?: string
          p_notify_every_n_questions?: number
          p_notify_on_question?: boolean
          p_password: string
        }
        Returns: boolean
      }
      update_question_review_authenticated: {
        Args: {
          p_password: string
          p_question_id: string
          p_review_status: string
          p_reviewed_text?: string
          p_reviewer_notes?: string
        }
        Returns: boolean
      }
      update_report_status_authenticated: {
        Args: { p_password: string; p_report_id: string; p_status: string }
        Returns: boolean
      }
      update_settings_authenticated: {
        Args: {
          p_content_filter_enabled?: boolean
          p_countdown_bg_color?: string
          p_countdown_border_color?: string
          p_countdown_style?: number
          p_countdown_text_color?: string
          p_is_box_open?: boolean
          p_maintenance_message?: string
          p_maintenance_mode?: boolean
          p_next_session_date?: string
          p_password: string
          p_show_countdown?: boolean
          p_show_install_page?: boolean
          p_show_question_count?: boolean
          p_video_title?: string
          p_video_url?: string
        }
        Returns: boolean
      }
      update_video_authenticated: {
        Args: {
          p_password: string
          p_title?: string
          p_url?: string
          p_video_id: string
        }
        Returns: boolean
      }
      verify_admin_password: {
        Args: { input_password: string }
        Returns: boolean
      }
      verify_security_password: {
        Args: { input_password: string }
        Returns: boolean
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
