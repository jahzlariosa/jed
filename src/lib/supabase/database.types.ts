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
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      permissions: {
        Row: {
          code: string
          description: string
        }
        Insert: {
          code: string
          description: string
        }
        Update: {
          code?: string
          description?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_code: string
          role_code: string
        }
        Insert: {
          permission_code: string
          role_code: string
        }
        Update: {
          permission_code?: string
          role_code?: string
        }
        Relationships: [
          {
            foreignKeyName: 'role_permissions_permission_code_fkey'
            columns: ['permission_code']
            isOneToOne: false
            referencedRelation: 'permissions'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'role_permissions_role_code_fkey'
            columns: ['role_code']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['code']
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string
          is_system: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          is_system?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          message: string
          ip_hash: string | null
          user_agent: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          message: string
          ip_hash?: string | null
          user_agent?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          message?: string
          ip_hash?: string | null
          user_agent?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      content_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          summary: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          summary: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string
        }
        Relationships: []
      }
      content_entries: {
        Row: {
          body: Json
          created_at: string
          created_by: string | null
          featured_media_id: string | null
          id: string
          kind: string
          meta_description: string | null
          meta_title: string | null
          canonical_url: string | null
          og_image_id: string | null
          og_image_alt: string | null
          noindex: boolean
          sitemap_exclude: boolean
          published_at: string | null
          scheduled_at: string | null
          show_in_nav: boolean
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: Json
          created_at?: string
          created_by?: string | null
          featured_media_id?: string | null
          id?: string
          kind: string
          meta_description?: string | null
          meta_title?: string | null
          canonical_url?: string | null
          og_image_id?: string | null
          og_image_alt?: string | null
          noindex?: boolean
          sitemap_exclude?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          show_in_nav?: boolean
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: Json
          created_at?: string
          created_by?: string | null
          featured_media_id?: string | null
          id?: string
          kind?: string
          meta_description?: string | null
          meta_title?: string | null
          canonical_url?: string | null
          og_image_id?: string | null
          og_image_alt?: string | null
          noindex?: boolean
          sitemap_exclude?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          show_in_nav?: boolean
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          byte_size: number
          created_at: string
          created_by: string | null
          filename: string
          id: string
          mime_type: string
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          byte_size: number
          created_at?: string
          created_by?: string | null
          filename: string
          id?: string
          mime_type: string
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          byte_size?: number
          created_at?: string
          created_by?: string | null
          filename?: string
          id?: string
          mime_type?: string
          storage_path?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          body_blocks: Json
          body_html: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          featured_media_id: string | null
          id: string
          kind: string
          meta_description: string | null
          meta_title: string | null
          canonical_url: string | null
          og_image_id: string | null
          og_image_alt: string | null
          cover_image_alt: string | null
          noindex: boolean
          sitemap_exclude: boolean
          published_at: string | null
          slug: string
          speaker: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id?: string | null
          body_blocks?: Json
          body_html?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          featured_media_id?: string | null
          id?: string
          kind?: string
          meta_description?: string | null
          meta_title?: string | null
          canonical_url?: string | null
          og_image_id?: string | null
          og_image_alt?: string | null
          cover_image_alt?: string | null
          noindex?: boolean
          sitemap_exclude?: boolean
          published_at?: string | null
          slug: string
          speaker?: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string | null
          body_blocks?: Json
          body_html?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          featured_media_id?: string | null
          id?: string
          kind?: string
          meta_description?: string | null
          meta_title?: string | null
          canonical_url?: string | null
          og_image_id?: string | null
          og_image_alt?: string | null
          cover_image_alt?: string | null
          noindex?: boolean
          sitemap_exclude?: boolean
          published_at?: string | null
          slug?: string
          speaker?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          id: string
          user_id: string
          name: string
          prefix: string
          token_hash: string
          scopes: string[]
          expires_at: string
          revoked_at: string | null
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          prefix: string
          token_hash: string
          scopes?: string[]
          expires_at: string
          revoked_at?: string | null
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          prefix?: string
          token_hash?: string
          scopes?: string[]
          expires_at?: string
          revoked_at?: string | null
          last_used_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      api_idempotency: {
        Row: {
          id: string
          token_id: string
          key_hash: string
          status_code: number
          response_body: Json
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          token_id: string
          key_hash: string
          status_code: number
          response_body: Json
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          token_id?: string
          key_hash?: string
          status_code?: number
          response_body?: Json
          created_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          actor_user_id: string | null
          action: string
          target_type: string
          target_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          actor_user_id?: string | null
          action: string
          target_type: string
          target_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          actor_user_id?: string | null
          action?: string
          target_type?: string
          target_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      url_redirects: {
        Row: {
          id: string
          from_path: string
          to_path: string
          status_code: number
          enabled: boolean
          hit_count: number
          last_hit_at: string | null
          is_external: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_path: string
          to_path: string
          status_code?: number
          enabled?: boolean
          hit_count?: number
          last_hit_at?: string | null
          is_external?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_path?: string
          to_path?: string
          status_code?: number
          enabled?: boolean
          hit_count?: number
          last_hit_at?: string | null
          is_external?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          analytics_id: string | null
          brand_hex: string
          id: number
          language: string
          logo_url: string | null
          redirect_after_password_reset: string
          redirect_after_sign_in_admin: string
          redirect_after_sign_in_user: string
          redirect_after_sign_out: string
          redirect_after_sign_up: string
          contact_email: string | null
          mfa_enabled: boolean
          mfa_policy: string
          seo_default_description: string | null
          seo_title_template: string
          site_name: string
          site_url: string | null
          social_image_url: string | null
          og_locale: string
          twitter_handle: string | null
          allow_search_indexing: boolean
          robots_extra_rules: string
          sitemap_include_blog: boolean
          sitemap_include_pages: boolean
          sitemap_include_docs: boolean
          sitemap_excluded_paths: Json
          google_site_verification: string | null
          bing_site_verification: string | null
          ga4_measurement_id: string | null
          gtm_container_id: string | null
          plausible_domain: string | null
          vercel_analytics_enabled: boolean
          default_og_image_alt: string | null
          org_schema_type: string
          org_legal_name: string | null
          org_logo_url: string | null
          org_address: string | null
          org_phone: string | null
          org_email: string | null
          org_opening_hours: string | null
          org_same_as: Json
          redirect_external_hosts: Json
          timezone: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          analytics_id?: string | null
          brand_hex?: string
          contact_email?: string | null
          id?: number
          language?: string
          logo_url?: string | null
          redirect_after_password_reset?: string
          redirect_after_sign_in_admin?: string
          redirect_after_sign_in_user?: string
          redirect_after_sign_out?: string
          redirect_after_sign_up?: string
          mfa_enabled?: boolean
          mfa_policy?: string
          seo_default_description?: string | null
          seo_title_template?: string
          site_name?: string
          site_url?: string | null
          social_image_url?: string | null
          og_locale?: string
          twitter_handle?: string | null
          allow_search_indexing?: boolean
          robots_extra_rules?: string
          sitemap_include_blog?: boolean
          sitemap_include_pages?: boolean
          sitemap_include_docs?: boolean
          sitemap_excluded_paths?: Json
          google_site_verification?: string | null
          bing_site_verification?: string | null
          ga4_measurement_id?: string | null
          gtm_container_id?: string | null
          plausible_domain?: string | null
          vercel_analytics_enabled?: boolean
          default_og_image_alt?: string | null
          org_schema_type?: string
          org_legal_name?: string | null
          org_logo_url?: string | null
          org_address?: string | null
          org_phone?: string | null
          org_email?: string | null
          org_opening_hours?: string | null
          org_same_as?: Json
          redirect_external_hosts?: Json
          timezone?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          analytics_id?: string | null
          brand_hex?: string
          contact_email?: string | null
          id?: number
          language?: string
          logo_url?: string | null
          redirect_after_password_reset?: string
          redirect_after_sign_in_admin?: string
          redirect_after_sign_in_user?: string
          redirect_after_sign_out?: string
          redirect_after_sign_up?: string
          mfa_enabled?: boolean
          mfa_policy?: string
          seo_default_description?: string | null
          seo_title_template?: string
          site_name?: string
          site_url?: string | null
          social_image_url?: string | null
          og_locale?: string
          twitter_handle?: string | null
          allow_search_indexing?: boolean
          robots_extra_rules?: string
          sitemap_include_blog?: boolean
          sitemap_include_pages?: boolean
          sitemap_include_docs?: boolean
          sitemap_excluded_paths?: Json
          google_site_verification?: string | null
          bing_site_verification?: string | null
          ga4_measurement_id?: string | null
          gtm_container_id?: string | null
          plausible_domain?: string | null
          vercel_analytics_enabled?: boolean
          default_og_image_alt?: string | null
          org_schema_type?: string
          org_legal_name?: string | null
          org_logo_url?: string | null
          org_address?: string | null
          org_phone?: string | null
          org_email?: string | null
          org_opening_hours?: string | null
          org_same_as?: Json
          redirect_external_hosts?: Json
          timezone?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role_code: string
          user_id: string
        }
        Update: {
          created_at?: string
          role_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_roles_role_code_fkey'
            columns: ['role_code']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: { requested_permission: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_site_auth_redirects: {
        Args: Record<PropertyKey, never>
        Returns: {
          redirect_after_sign_in_admin: string
          redirect_after_sign_in_user: string
          redirect_after_sign_up: string
          redirect_after_password_reset: string
          redirect_after_sign_out: string
        }[]
      }
      get_site_mfa_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          mfa_enabled: boolean
          mfa_policy: string
        }[]
      }
      set_user_role_atomic: {
        Args: { target_user_id: string; new_role_code: string }
        Returns: undefined
      }
      admin_list_directory_users: {
        Args: {
          p_q?: string | null
          p_role?: string | null
          p_status?: string | null
          p_mfa?: string | null
          p_created_from?: string | null
          p_created_to?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          user_id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          profile_created_at: string
          banned_until: string | null
          email_confirmed_at: string | null
          has_mfa: boolean
          total_count: number
        }[]
      }
      lookup_url_redirect: {
        Args: { request_path: string }
        Returns: {
          to_path: string
          status_code: number
          is_external: boolean
        }[]
      }
      get_public_seo_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      record_url_redirect_hit: {
        Args: { request_path: string }
        Returns: undefined
      }
      import_url_redirects_csv: {
        Args: { rows: Json }
        Returns: number
      }
      search_published_content: {
        Args: {
          search_query: string
          page_limit?: number
          page_offset?: number
        }
        Returns: {
          result_kind: string
          slug: string
          title: string
          excerpt: string
          rank: number
          headline: string
        }[]
      }
      lookup_api_token_by_hash: {
        Args: { p_token_hash: string }
        Returns: {
          token_id: string
          user_id: string
          scopes: string[]
          expires_at: string
        }[]
      }
      list_applied_schema_migrations: {
        Args: Record<PropertyKey, never>
        Returns: { version: string; name: string }[]
      }
      admin_database_overview: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_database_tables: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_database_diagram: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_database_activity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_update_role_catalog: {
        Args: {
          p_actor_user_id: string
          p_code: string
          p_name: string
          p_description: string
          p_permission_codes: string[]
        }
        Returns: undefined
      }
      admin_delete_role_catalog: {
        Args: {
          p_actor_user_id: string
          p_code: string
          p_reassign_to_role_code?: string | null
        }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          p_actor_user_id: string
          p_target_user_id: string
          p_role_code: string
        }
        Returns: undefined
      }
      list_my_api_token_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          token_id: string
          token_name: string
          call_count: number
          last_called_at: string | null
        }[]
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
