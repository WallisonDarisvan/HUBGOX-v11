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
      affiliate_earnings: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          status: string
          transaction_id: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          transaction_id: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          transaction_id?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number
          created_at: string
          id: string
          status: string
          total_earnings: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number
          created_at?: string
          id?: string
          status?: string
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number
          created_at?: string
          id?: string
          status?: string
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      card_clicks: {
        Row: {
          card_id: string
          clicked_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          card_id: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          card_id?: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_clicks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_clicks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards_with_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          form_config_id: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          form_config_id?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          form_config_id?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "forms_with_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_configs: {
        Row: {
          background_image: string | null
          button_action: string | null
          button_action_form_id: string | null
          button_color: string
          button_text: string
          confirmation_button_action: string | null
          confirmation_button_form_id: string | null
          confirmation_button_link: string | null
          confirmation_button_text: string | null
          confirmation_message: string | null
          confirmation_title: string | null
          created_at: string
          description: string | null
          email_notification: string | null
          external_link_url: string | null
          form_position: string | null
          id: string
          is_active: boolean
          quote: string | null
          show_confirmation_button: boolean | null
          show_email: boolean
          show_name: boolean
          show_phone: boolean
          slug: string
          title: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          background_image?: string | null
          button_action?: string | null
          button_action_form_id?: string | null
          button_color?: string
          button_text?: string
          confirmation_button_action?: string | null
          confirmation_button_form_id?: string | null
          confirmation_button_link?: string | null
          confirmation_button_text?: string | null
          confirmation_message?: string | null
          confirmation_title?: string | null
          created_at?: string
          description?: string | null
          email_notification?: string | null
          external_link_url?: string | null
          form_position?: string | null
          id?: string
          is_active?: boolean
          quote?: string | null
          show_confirmation_button?: boolean | null
          show_email?: boolean
          show_name?: boolean
          show_phone?: boolean
          slug: string
          title?: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          background_image?: string | null
          button_action?: string | null
          button_action_form_id?: string | null
          button_color?: string
          button_text?: string
          confirmation_button_action?: string | null
          confirmation_button_form_id?: string | null
          confirmation_button_link?: string | null
          confirmation_button_text?: string | null
          confirmation_message?: string | null
          confirmation_title?: string | null
          created_at?: string
          description?: string | null
          email_notification?: string | null
          external_link_url?: string | null
          form_position?: string | null
          id?: string
          is_active?: boolean
          quote?: string | null
          show_confirmation_button?: boolean | null
          show_email?: boolean
          show_name?: boolean
          show_phone?: boolean
          slug?: string
          title?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_configs_button_action_form_id_fkey"
            columns: ["button_action_form_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_configs_button_action_form_id_fkey"
            columns: ["button_action_form_id"]
            isOneToOne: false
            referencedRelation: "forms_with_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_configs_confirmation_button_form_id_fkey"
            columns: ["confirmation_button_form_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_configs_confirmation_button_form_id_fkey"
            columns: ["confirmation_button_form_id"]
            isOneToOne: false
            referencedRelation: "forms_with_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          created_at: string
          field_type: string
          form_config_id: string
          id: string
          is_standard_field: boolean
          label: string
          options: string[] | null
          placeholder: string | null
          required: boolean
          sort_order: number
          standard_field_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_type: string
          form_config_id: string
          id?: string
          is_standard_field?: boolean
          label: string
          options?: string[] | null
          placeholder?: string | null
          required?: boolean
          sort_order?: number
          standard_field_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_type?: string
          form_config_id?: string
          id?: string
          is_standard_field?: boolean
          label?: string
          options?: string[] | null
          placeholder?: string | null
          required?: boolean
          sort_order?: number
          standard_field_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_fields_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "forms_with_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          custom_fields: Json | null
          email: string | null
          form_config_id: string
          id: string
          ip_address: string | null
          name: string | null
          phone: string | null
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          custom_fields?: Json | null
          email?: string | null
          form_config_id: string
          id?: string
          ip_address?: string | null
          name?: string | null
          phone?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          custom_fields?: Json | null
          email?: string | null
          form_config_id?: string
          id?: string
          ip_address?: string | null
          name?: string | null
          phone?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "forms_with_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      link_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          list_id: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          list_id: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          list_id?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "link_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_definitions: {
        Row: {
          allow_admin_mode: boolean
          allow_video_bg: boolean
          created_at: string | null
          limit_cards: number
          limit_forms: number
          limit_lists: number
          limit_profiles: number
          plan_id: string
          plan_name: string
          price_monthly: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          allow_admin_mode?: boolean
          allow_video_bg?: boolean
          created_at?: string | null
          limit_cards?: number
          limit_forms?: number
          limit_lists?: number
          limit_profiles?: number
          plan_id: string
          plan_name: string
          price_monthly?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_admin_mode?: boolean
          allow_video_bg?: boolean
          created_at?: string | null
          limit_cards?: number
          limit_forms?: number
          limit_lists?: number
          limit_profiles?: number
          plan_id?: string
          plan_name?: string
          price_monthly?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          id: string
          ip_address: string | null
          profile_id: string
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          profile_id: string
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          profile_id?: string
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          cover_type: string | null
          cover_video_url: string | null
          created_at: string | null
          created_by_admin_id: string | null
          custom_phrase: string | null
          display_name: string | null
          email: string | null
          footer_text_primary: string | null
          footer_text_secondary: string | null
          id: string
          instagram_url: string | null
          is_activated: boolean | null
          linkedin_url: string | null
          show_avatar: boolean | null
          show_verified_badge: boolean | null
          spotify_url: string | null
          theme: string | null
          updated_at: string | null
          username: string
          whatsapp_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          cover_type?: string | null
          cover_video_url?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          custom_phrase?: string | null
          display_name?: string | null
          email?: string | null
          footer_text_primary?: string | null
          footer_text_secondary?: string | null
          id: string
          instagram_url?: string | null
          is_activated?: boolean | null
          linkedin_url?: string | null
          show_avatar?: boolean | null
          show_verified_badge?: boolean | null
          spotify_url?: string | null
          theme?: string | null
          updated_at?: string | null
          username: string
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          cover_type?: string | null
          cover_video_url?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          custom_phrase?: string | null
          display_name?: string | null
          email?: string | null
          footer_text_primary?: string | null
          footer_text_secondary?: string | null
          id?: string
          instagram_url?: string | null
          is_activated?: boolean | null
          linkedin_url?: string | null
          show_avatar?: boolean | null
          show_verified_badge?: boolean | null
          spotify_url?: string | null
          theme?: string | null
          updated_at?: string | null
          username?: string
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          affiliate_commission: number | null
          affiliate_id: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          payment_method: string | null
          plan_id: string
          status: string
          stripe_payment_id: string | null
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_commission?: number | null
          affiliate_id?: string | null
          amount: number
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          plan_id: string
          status?: string
          stripe_payment_id?: string | null
          transaction_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_commission?: number | null
          affiliate_id?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          plan_id?: string
          status?: string
          stripe_payment_id?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          invitation_token: string
          invited_by_admin_id: string | null
          linked_profile_id: string | null
          profile_id: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by_admin_id?: string | null
          linked_profile_id?: string | null
          profile_id?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by_admin_id?: string | null
          linked_profile_id?: string | null
          profile_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          created_at: string | null
          plan_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          plan_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          plan_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan_definitions"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      cards_with_metrics: {
        Row: {
          click_count: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          form_config_id: string | null
          icon: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "forms_with_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forms_with_metrics: {
        Row: {
          background_image: string | null
          button_action: string | null
          button_action_form_id: string | null
          button_color: string | null
          button_text: string | null
          confirmation_button_action: string | null
          confirmation_button_form_id: string | null
          confirmation_button_link: string | null
          confirmation_button_text: string | null
          confirmation_message: string | null
          confirmation_title: string | null
          created_at: string | null
          description: string | null
          email_notification: string | null
          external_link_url: string | null
          form_position: string | null
          id: string | null
          is_active: boolean | null
          quote: string | null
          show_confirmation_button: boolean | null
          show_email: boolean | null
          show_name: boolean | null
          show_phone: boolean | null
          slug: string | null
          submission_count: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_configs_button_action_form_id_fkey"
            columns: ["button_action_form_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_configs_button_action_form_id_fkey"
            columns: ["button_action_form_id"]
            isOneToOne: false
            referencedRelation: "forms_with_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_configs_confirmation_button_form_id_fkey"
            columns: ["confirmation_button_form_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_configs_confirmation_button_form_id_fkey"
            columns: ["confirmation_button_form_id"]
            isOneToOne: false
            referencedRelation: "forms_with_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: {
        Args: { new_user_id: string; token: string }
        Returns: boolean
      }
      admin_delete_user: { Args: { user_id: string }; Returns: undefined }
      check_profile_creation_limit: {
        Args: { p_admin_id: string }
        Returns: boolean
      }
      check_profile_orphans: {
        Args: { p_profile_id: string }
        Returns: {
          has_cards: boolean
          has_forms: boolean
          has_lists: boolean
          has_views: boolean
          total_items: number
        }[]
      }
      expire_old_invitations: { Args: never; Returns: number }
      generate_slug: { Args: { text_input: string }; Returns: string }
      generate_unique_slug: {
        Args: { base_slug: string; form_id?: string }
        Returns: string
      }
      get_public_form_config: {
        Args: { form_slug: string }
        Returns: {
          background_image: string
          button_action: string
          button_action_form_id: string
          button_color: string
          button_text: string
          confirmation_button_action: string
          confirmation_button_form_id: string
          confirmation_button_link: string
          confirmation_button_text: string
          confirmation_message: string
          confirmation_title: string
          created_at: string
          description: string
          email_notification: string
          external_link_url: string
          form_position: string
          id: string
          is_active: boolean
          quote: string
          show_confirmation_button: boolean
          show_email: boolean
          show_name: boolean
          show_phone: boolean
          slug: string
          title: string
          updated_at: string
          user_id: string
          whatsapp_number: string
        }[]
      }
      get_public_list: {
        Args: { p_slug: string; p_username: string }
        Returns: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          slug: string
          title: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_emails: {
        Args: never
        Returns: {
          created_at: string
          email: string
          user_id: string
        }[]
      }
      get_user_plan_limits: {
        Args: { p_user_id: string }
        Returns: {
          allow_admin_mode: boolean
          allow_video_bg: boolean
          limit_cards: number
          limit_forms: number
          limit_lists: number
          limit_profiles: number
          plan_id: string
          plan_name: string
        }[]
      }
      has_admin_mode: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_cards_metrics: { Args: never; Returns: undefined }
      refresh_forms_metrics: { Args: never; Returns: undefined }
      validate_invitation_token: {
        Args: { token: string }
        Returns: {
          display_name: string
          email: string
          invitation_id: string
          profile_id: string
          username: string
        }[]
      }
    }
    Enums: {
      app_role: "user" | "dev"
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
      app_role: ["user", "dev"],
    },
  },
} as const
