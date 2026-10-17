export type MigrationExplanation = {
  /** Plain English, 1-3 sentences. */
  summary: string
  /** When an operator should run this file. */
  whenToRun: string
}

/** One entry per file in `supabase/migrations/`. */
export const MIGRATION_EXPLANATIONS: Record<string, MigrationExplanation> = {
  '20260918171246_create_profiles.sql': {
    summary:
      'Creates the profiles table and syncs email from auth users on signup and update.',
    whenToRun: 'On every new database before RBAC and CMS migrations.',
  },
  '20260918172700_create_rbac.sql': {
    summary:
      'Adds roles, permissions, and user_roles with seed data for member and admin.',
    whenToRun: 'Immediately after profiles on a fresh project.',
  },
  '20260918190000_add_admin_access.sql': {
    summary:
      'Introduces the admin.access permission and attaches it to the admin role.',
    whenToRun: 'After RBAC on existing installs that predate admin access.',
  },
  '20261004100000_harden_system_roles_and_profiles.sql': {
    summary:
      'Locks system roles from API edits and prevents direct profile email changes.',
    whenToRun:
      'On hosted databases that already ran the original RBAC migration.',
  },
  '20261010120000_admin_query_indexes.sql': {
    summary:
      'Adds indexes that speed up admin directory and role listing queries.',
    whenToRun: 'On any environment with the admin users screen.',
  },
  '20261016020000_admin_directory_users_rpc.sql': {
    summary:
      'Adds admin_list_directory_users for filtered, paginated user directory reads (auth status, MFA, role, dates).',
    whenToRun: 'Before using advanced filters on /admin/users.',
  },
  '20261016030000_audit_directory_indexes.sql': {
    summary:
      'Adds optional composite indexes on audit_log for actor, action, and target type filters with created_at ordering.',
    whenToRun:
      'When /admin/audit filters feel slow on large audit tables; created_at is already indexed.',
  },
  '20261014120000_cms_admin_modern.sql': {
    summary:
      'Creates site settings, content entries, media assets, and activity tables with RLS.',
    whenToRun: 'Before blog posts and public page policies.',
  },
  '20261014130000_is_admin_and_cms_rls.sql': {
    summary:
      'Adds is_admin helper and tightens CMS RLS so only admins manage settings and content.',
    whenToRun: 'Right after the CMS tables migration.',
  },
  '20261014143000_blog_posts.sql': {
    summary:
      'Adds the posts table for the public blog with publish and admin policies.',
    whenToRun: 'When enabling the blog feature on an existing CMS database.',
  },
  '20261014160000_content_entries_public_pages.sql': {
    summary:
      'Allows anonymous read of published pages while keeping drafts admin-only.',
    whenToRun: 'Before serving marketing pages from content_entries.',
  },
  '20261014170000_site_settings_auth_redirects.sql': {
    summary:
      'Stores post sign-in redirect paths on site_settings with path validation.',
    whenToRun: 'When customizing where sign-in sends members and admins.',
  },
  '20261014180000_profiles_display_name.sql': {
    summary:
      'Adds optional display_name on profiles for friendlier admin labels.',
    whenToRun: 'On databases created before display names were introduced.',
  },
  '20261014190000_auth_redirect_settings_read.sql': {
    summary:
      'Exposes redirect paths through a SECURITY DEFINER RPC for sign-in flows.',
    whenToRun: 'After auth redirect columns exist on site_settings.',
  },
  '20261014220000_batch_security_product.sql': {
    summary:
      'Adds contact email, MFA admin flag, redirects, audit log, and related hardening.',
    whenToRun: 'On starter upgrades from early CMS-only snapshots.',
  },
  '20261014230000_grant_hygiene.sql': {
    summary:
      'Revokes overly broad grants and restores least-privilege table access.',
    whenToRun: 'After batch security migrations on hosted Supabase.',
  },
  '20261014240000_redirect_path_dot_and_policies.sql': {
    summary: 'Tightens redirect path rules and url_redirects RLS policies.',
    whenToRun: 'When redirects are enabled in admin.',
  },
  '20261015130000_site_settings_neutral_defaults.sql': {
    summary: 'Sets neutral default site name and brand color on site_settings.',
    whenToRun: 'Optional branding refresh for template defaults.',
  },
  '20261015153000_mfa_site_settings.sql': {
    summary:
      'Replaces require_mfa_for_admins with mfa_enabled and mfa_policy site settings.',
    whenToRun: 'Before deploying configurable MFA policy from admin settings.',
  },
  '20261015160000_public_content_search.sql': {
    summary:
      'Adds tsvector columns, GIN indexes, and search_published_content for public search.',
    whenToRun: 'Before enabling the /search page and FTS-backed queries.',
  },
  '20261015161000_admin_schema_migrations_rpc.sql': {
    summary:
      'Lets admins list applied versions from supabase_migrations.schema_migrations.',
    whenToRun: 'Before using the SQL templates screen in admin.',
  },
  '20261015170000_profiles_avatars.sql': {
    summary:
      'Adds profile avatar_url, the public avatars storage bucket, and owner-only RLS paths.',
    whenToRun: 'Before account photo upload or avatar URLs on profiles.',
  },
  '20261015180000_search_triggers_and_admin_rpc_grants.sql': {
    summary:
      'Revokes anon execute on list_applied_schema_migrations and sets search_path on FTS trigger functions.',
    whenToRun: 'On hosted databases that ran #18 search and SQL templates RPC.',
  },
  '20261015182000_api_tokens.sql': {
    summary:
      'Adds api_tokens, api_idempotency, and lookup_api_token_by_hash for REST/MCP personal access tokens.',
    whenToRun: 'Before using Admin → API and MCP or issuing bearer tokens.',
  },
  '20261015182100_avatars_bucket_limits.sql': {
    summary:
      'Sets the avatars storage bucket to 2 MB max and PNG, JPEG, or WebP only.',
    whenToRun:
      'After the avatars bucket exists (account photo upload). Safe to re-run; updates limits in place.',
  },
  '20261015191000_search_trigger_coalesce_fix.sql': {
    summary:
      'Recreates FTS trigger functions using coalesce instead of pg_catalog.coalesce.',
    whenToRun:
      'After 20261015180000 on databases where content or post writes fail with 42883.',
  },
  '20261015190000_api_token_usage.sql': {
    summary:
      'Adds list_my_api_token_usage and an audit_log index for API token call counts.',
    whenToRun: 'After API audit logging ships (admin API usage on /admin/api).',
  },
  '20261015183000_schema_migrations_name.sql': {
    summary:
      'Returns migration name from list_applied_schema_migrations for SQL template badges.',
    whenToRun:
      'After API SQL templates ship; safe to re-run (replaces the RPC).',
  },
  '20261015182200_profiles_email_visibility.sql': {
    summary:
      'Stops exposing profile email to every signed-in user; keeps display_name and avatar_url for bylines.',
    whenToRun:
      'Before API/MCP profile reads or any cross-user profile lookups in the app.',
  },
  '20261015194500_seo_readiness.sql': {
    summary:
      'Adds SEO site settings, per-entry SEO columns, redirect hit tracking, 410 support, and get_public_seo_settings.',
    whenToRun:
      'Before the SEO admin settings, sitemap, robots route, and global redirect middleware.',
  },
  '20261016010000_admin_database_insights.sql': {
    summary:
      'Adds service_role-only RPCs for the admin Database page (size, tables, ER diagram, activity).',
    whenToRun:
      'Before opening /admin/database on hosted Postgres. Safe to re-run (replaces the RPCs).',
  },
  '20261016040000_admin_roles_catalog_atomic.sql': {
    summary:
      'Adds service_role-only admin_update_role_catalog and admin_delete_role_catalog so permission and reassignment writes run in one transaction.',
    whenToRun:
      'Before using roles create/update/delete from the admin API or MCP on hosted Postgres.',
  },
  '20261016050000_admin_role_catalog_advisory_lock.sql': {
    summary:
      'Serializes admin_update_role_catalog and admin_delete_role_catalog with a transaction advisory lock on admin_role_catalog.',
    whenToRun:
      'After admin_roles_catalog_atomic on hosted Postgres when concurrent role catalog writes are possible.',
  },
  '20261016060000_admin_set_user_role_and_catalog_lock.sql': {
    summary:
      'Adds service_role-only admin_set_user_role for atomic user role changes with permission subset checks (uses the same advisory lock key as role catalog RPCs).',
    whenToRun:
      'After 20261016050000_admin_role_catalog_advisory_lock.sql on hosted Postgres, before assigning user roles from the admin UI, API, or MCP.',
  },
  '20261016070000_admin_database_activity_coalesce_fix.sql': {
    summary:
      'Replaces admin_database_activity so connection state grouping uses plain coalesce (pg_catalog.coalesce is invalid for text).',
    whenToRun:
      'After 20261016010000_admin_database_insights.sql on hosted Postgres when /admin/database activity fails with 42883.',
  },
  '20261016080000_contact_messages.sql': {
    summary:
      'Creates contact_messages for the public contact form. RLS is on with no public access; the server inserts with the service role and admins with admin.access can read and change status.',
    whenToRun:
      'Before using the contact form or Admin > Inbox. Safe to re-run.',
  },
  '20261016180000_jed_site_name.sql': {
    summary:
      'Renames the default site name to Jed and updates any site_settings row that still uses the previous starter name.',
    whenToRun:
      'After 20261015130000_site_settings_neutral_defaults.sql. Safe to re-run.',
  },
  '20261017090000_site_layout_widths.sql': {
    summary:
      'Adds navbar_width and footer_width to site_settings so admins can choose full width, contained, or full width with contained content for the public navbar and footer. Both default to full width.',
    whenToRun:
      'Before using the navbar and footer width options in Admin > Settings. Safe to re-run.',
  },
  '20261017100000_drop_set_user_role_atomic.sql': {
    summary:
      'Drops the legacy set_user_role_atomic RPC so role changes go only through service_role admin_set_user_role.',
    whenToRun:
      'After admin_set_user_role is live on hosted Postgres. Safe to re-run.',
  },
  '20261017101000_rls_mfa_aal2.sql': {
    summary:
      'Requires JWT AAL2 in is_admin() and has_permission() when site MFA policy requires step-up, so password-only sessions cannot write through PostgREST.',
    whenToRun: 'After MFA site settings on hosted Postgres. Safe to re-run.',
  },
  '20261017102000_profile_bylines_grants.sql': {
    summary:
      'Revokes broad grants on profile_bylines and grants SELECT only to anon and authenticated.',
    whenToRun: 'After profiles email visibility migration. Safe to re-run.',
  },
  '20261017103000_security_definer_search_path.sql': {
    summary:
      'Sets search_path to empty on get_site_mfa_settings, search_published_content, and list_applied_schema_migrations with schema-qualified references.',
    whenToRun: 'After those RPCs exist on hosted Postgres. Safe to re-run.',
  },
  '20261017104000_public_default_privileges.sql': {
    summary:
      'Revokes default public-schema grants to anon and authenticated from postgres and supabase_admin, then re-applies explicit table, sequence, and function grants.',
    whenToRun: 'After grant hygiene on hosted Postgres. Safe to re-run.',
  },
  '20261017105000_rate_limit_buckets.sql': {
    summary:
      'Adds private.rate_limit_buckets and service_role-only consume_rate_limit_bucket for shared server rate limits across instances.',
    whenToRun:
      'Before production traffic on Vercel when using contact, auth, or account rate limits. Safe to re-run.',
  },
  '20261017106000_pg_trgm_extensions_schema.sql': {
    summary:
      'Installs pg_trgm in the extensions schema and rebuilds profiles_email_trgm_idx with extensions.gin_trgm_ops.',
    whenToRun: 'After admin query indexes on hosted Postgres. Safe to re-run.',
  },
}
