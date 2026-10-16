import { createServerFn } from '@tanstack/react-start'

import { requireCmsAccess, requireCmsWrite } from '#/auth/admin-access.server'
import { actorHasVerifiedMfaFactor } from '#/auth/mfa-gate.server'
import { assertMfaPolicyAllowsSave, parseMfaPolicy } from '#/auth/mfa-policy'
import { safeInternalPath } from '#/auth/path'
import { parseEmail, quotePostgrestFilterValue } from '#/auth/validators'
import { PERMISSIONS } from '#/auth/permissions'
import { writeAuditLog } from '#/lib/cms/audit.server'
import { escapeLike } from '#/auth/validators'
import { getRequestClient, markPrivateNoStore } from '#/auth/session.server'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'
import { invalidatePublishedContentCache } from '#/lib/api-runtime-cache.server'
import { clearPublicCache } from '#/lib/public-cache.server'
import { publicMediaUrl } from '#/lib/media/public-media-url'
import {
  parseCmsImageUrlForSave,
  sanitizeCanonicalUrl,
  SOCIAL_IMAGE_URL_SAVE_ERROR,
} from '#/lib/url-security'
import {
  parseSiteSeoSaveInput,
  siteSeoRowFromInput,
} from '#/lib/cms/site-settings-seo'
import { clearRedirectCache } from '#/lib/seo/redirect-cache.server'
import { clearPublicSeoSettingsCache } from '#/lib/seo/public-settings.server'
import { assertRateLimit, RATE_LIMIT_MESSAGE } from '#/lib/rate-limit.server'
import {
  DEFAULT_BRAND_HEX,
  DEFAULT_PUBLIC_SITE_NAME,
  resolvePublicBrandHex,
  resolvePublicSiteName,
} from '#/lib/cms/brand-defaults'
import { parseSiteTimezoneForSave } from '#/lib/iana-timezones'

import { slugifyEditorTitle } from '#/lib/cms/editor-slug'
import { ensureUniqueContentSlug } from '#/lib/cms/slug-uniqueness.server'
import {
  parseBrandHex,
  parseContentId,
  parseContentKind,
  parseContentListQuery,
  parseContentStatus,
  parseCanonicalUrl,
  parseMetaDescription,
  parseMetaTitle,
  parseSlug,
  parseTags,
  parseTitle,
} from './validators'

async function recordActivity(
  summary: string,
  action: string,
  entityType: string,
  entityId: string | null,
  actorId: string,
) {
  const supabase = getRequestClient()
  const { error } = await supabase.from('content_activity').insert({
    actor_id: actorId,
    action,
    summary,
    entity_type: entityType,
    entity_id: entityId,
  })
  if (error) {
    console.error(error)
  }
}

export const getAdminDashboardFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const { user } = await requireCmsAccess(
      PERMISSIONS.adminAccess,
      PERMISSIONS.contentRead,
    )
    const supabase = getRequestClient()

    const [
      recentPages,
      recentPosts,
      draftPages,
      draftPosts,
      recentActivity,
      mediaPing,
      settings,
    ] = await Promise.all([
      supabase
        .from('content_entries')
        .select('id, title, kind, status, updated_at, slug')
        .order('updated_at', { ascending: false })
        .limit(6),
      supabase
        .from('posts')
        .select('id, title, status, updated_at, slug')
        .order('updated_at', { ascending: false })
        .limit(6),
      supabase
        .from('content_entries')
        .select('id, title, kind, status, updated_at, slug')
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('posts')
        .select('id, title, status, updated_at, slug')
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('content_activity')
        .select('id, summary, created_at, action')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('media_assets')
        .select('id', { count: 'exact', head: true }),
      supabase.from('site_settings').select('contact_email').maybeSingle(),
    ])

    const err =
      recentPages.error ??
      recentPosts.error ??
      draftPages.error ??
      draftPosts.error ??
      recentActivity.error ??
      mediaPing.error ??
      settings.error
    if (err) {
      console.error(err)
      throw new Error('Unable to load dashboard')
    }

    type RecentRow = {
      id: string
      title: string
      status: string
      updated_at: string
      path: string
      kindLabel: string
      editor: 'content' | 'post'
    }

    const pageRows: RecentRow[] = (recentPages.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      updated_at: row.updated_at,
      path: `/${row.slug}`,
      kindLabel: row.kind === 'page' ? 'Page' : 'Post',
      editor: 'content' as const,
    }))
    const postRows: RecentRow[] = (recentPosts.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      updated_at: row.updated_at,
      path: `/blog/${row.slug}`,
      kindLabel: 'Post',
      editor: 'post' as const,
    }))
    const recentContent = [...pageRows, ...postRows]
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      .slice(0, 6)

    const draftAttention = [
      ...(draftPages.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        updated_at: row.updated_at,
        editor: 'content' as const,
      })),
      ...(draftPosts.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        updated_at: row.updated_at,
        editor: 'post' as const,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      .slice(0, 5)

    const contactEmail = settings.data?.contact_email?.trim() ?? ''

    return {
      viewerId: user.id,
      recentContent,
      draftAttention,
      recentActivity: recentActivity.data ?? [],
      systemStatus: [
        {
          id: 'database',
          label: 'Database',
          status: 'Connected',
          level: 'ok' as const,
        },
        {
          id: 'storage',
          label: 'Storage',
          status: mediaPing.error ? 'Unavailable' : 'Ready',
          level: mediaPing.error ? ('warn' as const) : ('ok' as const),
        },
        {
          id: 'api',
          label: 'API and MCP',
          status: 'Enabled',
          level: 'ok' as const,
        },
        {
          id: 'email',
          label: 'Email delivery',
          status: contactEmail ? 'Configured' : 'Check provider',
          level: contactEmail ? ('ok' as const) : ('warn' as const),
        },
      ],
    }
  },
)

export const listContentFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => parseContentListQuery(input))
  .handler(async ({ data: query }) => {
    markPrivateNoStore()
    await requireCmsAccess(PERMISSIONS.contentRead)
    const supabase = getRequestClient()
    const from = (query.page - 1) * query.pageSize
    const to = from + query.pageSize - 1

    let builder = supabase
      .from('content_entries')
      .select('id, title, slug, kind, status, updated_at', { count: 'exact' })

    if (query.kind) {
      builder = builder.eq('kind', query.kind)
    }
    if (query.status === 'pages') {
      builder = builder.eq('kind', 'page')
    } else if (query.status === 'posts') {
      builder = builder.eq('kind', 'post')
    } else if (
      query.status === 'draft' ||
      query.status === 'published' ||
      query.status === 'scheduled'
    ) {
      builder = builder.eq('status', query.status)
    }
    if (query.q) {
      builder = builder.or(
        `title.ilike.%${escapeLike(query.q)}%,slug.ilike.%${escapeLike(query.q)}%`,
      )
    }

    const [
      listResult,
      allCount,
      pagesCount,
      postsCount,
      draftCount,
      schedCount,
    ] = await Promise.all([
      builder.order('updated_at', { ascending: false }).range(from, to),
      supabase
        .from('content_entries')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('content_entries')
        .select('id', { count: 'exact', head: true })
        .eq('kind', 'page'),
      supabase
        .from('content_entries')
        .select('id', { count: 'exact', head: true })
        .eq('kind', 'post'),
      supabase
        .from('content_entries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
      supabase
        .from('content_entries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled'),
    ])

    if (listResult.error) {
      console.error(listResult.error)
      throw new Error('Unable to load content')
    }

    return {
      items: listResult.data ?? [],
      total: listResult.count ?? 0,
      page: query.page,
      pageSize: query.pageSize,
      counts: {
        all: allCount.count ?? 0,
        pages: pagesCount.count ?? 0,
        posts: postsCount.count ?? 0,
        drafts: draftCount.count ?? 0,
        scheduled: schedCount.count ?? 0,
      },
    }
  })

export const getContentFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Invalid request')
    }
    return { id: parseContentId((input as Record<string, unknown>).id) }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    await requireCmsAccess(PERMISSIONS.contentRead)
    if (data.id === 'new') {
      return {
        id: 'new',
        kind: 'page' as const,
        title: '',
        slug: '',
        status: 'draft' as const,
        body: [],
        show_in_nav: false,
        published_at: null,
        scheduled_at: null,
        tags: [] as string[],
        featured_media_id: null,
        cover_image_url: null,
        meta_title: null,
        meta_description: null,
        canonical_url: null,
        og_image_alt: null,
        noindex: false,
        sitemap_exclude: false,
      }
    }
    const supabase = getRequestClient()
    const { data: row, error } = await supabase
      .from('content_entries')
      .select(
        'id, kind, title, slug, status, body, show_in_nav, published_at, scheduled_at, tags, featured_media_id, meta_title, meta_description, canonical_url, og_image_alt, noindex, sitemap_exclude',
      )
      .eq('id', data.id)
      .maybeSingle()
    if (error) {
      console.error(error)
      throw new Error('Unable to load content')
    }
    if (!row) {
      throw new Error('Content not found')
    }
    let cover_image_url: string | null = null
    if (row.featured_media_id) {
      const { data: asset } = await supabase
        .from('media_assets')
        .select('storage_path')
        .eq('id', row.featured_media_id)
        .maybeSingle()
      if (asset?.storage_path) {
        cover_image_url = publicMediaUrl(asset.storage_path)
      }
    }
    return {
      ...row,
      canonical_url: sanitizeCanonicalUrl(row.canonical_url),
      cover_image_url,
    }
  })

export const saveContentFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to save')
    }
    const raw = input as Record<string, unknown>
    return {
      id: parseContentId(raw.id),
      kind: parseContentKind(raw.kind),
      title: parseTitle(raw.title),
      slug: parseSlug(
        raw.slug ||
          slugifyEditorTitle(
            typeof raw.title === 'string' ? raw.title : String(raw.title ?? ''),
          ),
      ),
      status: parseContentStatus(raw.status),
      body: Array.isArray(raw.body) ? raw.body : [],
      showInNav: Boolean(raw.showInNav),
      publishedAt: typeof raw.publishedAt === 'string' ? raw.publishedAt : null,
      scheduledAt: typeof raw.scheduledAt === 'string' ? raw.scheduledAt : null,
      tags: parseTags(raw.tags),
      featuredMediaId:
        typeof raw.featuredMediaId === 'string' ? raw.featuredMediaId : null,
      metaTitle: parseMetaTitle(raw.metaTitle),
      metaDescription: parseMetaDescription(raw.metaDescription),
      canonicalUrl: parseCanonicalUrl(raw.canonicalUrl),
      ogImageAlt:
        String(raw.ogImageAlt ?? '')
          .trim()
          .slice(0, 200) || null,
      noindex: raw.noindex === true,
      sitemapExclude: raw.sitemapExclude === true,
      createSlugRedirect: raw.createSlugRedirect === true,
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireCmsWrite(PERMISSIONS.contentWrite)
    let uniqueSlug: string
    try {
      uniqueSlug = await ensureUniqueContentSlug(
        supabase,
        data.slug,
        data.id === 'new' ? undefined : data.id,
      )
    } catch {
      return { error: 'Unable to allocate a unique slug' }
    }
    const payload = {
      kind: data.kind,
      title: data.title,
      slug: uniqueSlug,
      status: data.status,
      body: data.body,
      show_in_nav: data.showInNav,
      published_at: data.publishedAt,
      scheduled_at: data.scheduledAt,
      tags: data.tags,
      featured_media_id: data.featuredMediaId,
      meta_title: data.metaTitle,
      meta_description: data.metaDescription,
      canonical_url: data.canonicalUrl,
      og_image_alt: data.ogImageAlt,
      noindex: data.noindex,
      sitemap_exclude: data.sitemapExclude,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    if (data.id === 'new') {
      const { data: inserted, error } = await supabase
        .from('content_entries')
        .insert({ ...payload, created_by: user.id })
        .select('id')
        .single()
      if (error) {
        console.error(error)
        return { error: 'Unable to create content' }
      }
      clearPublicCache('public')
      await invalidatePublishedContentCache(inserted.id)
      await recordActivity(
        `Created ${data.title}`,
        'create',
        'content',
        inserted.id,
        user.id,
      )
      return { ok: true as const, id: inserted.id, slug: uniqueSlug }
    }

    const { data: previous, error: prevError } = await supabase
      .from('content_entries')
      .select('slug, status')
      .eq('id', data.id)
      .maybeSingle()
    if (prevError) {
      console.error(prevError)
      return { error: 'Unable to save content' }
    }
    const { error } = await supabase
      .from('content_entries')
      .update(payload)
      .eq('id', data.id)
    if (error) {
      console.error(error)
      return { error: 'Unable to save content' }
    }
    if (
      data.createSlugRedirect &&
      previous &&
      previous.slug !== uniqueSlug &&
      previous.status === 'published' &&
      data.status === 'published'
    ) {
      const fromPath = `/${previous.slug}`
      const toPath = `/${uniqueSlug}`
      await supabase.from('url_redirects').upsert(
        {
          from_path: fromPath,
          to_path: toPath,
          status_code: 301,
          enabled: true,
          is_external: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'from_path' },
      )
      clearRedirectCache()
    }
    clearPublicCache('public')
    await invalidatePublishedContentCache(data.id)
    await recordActivity(
      `Updated ${data.title}`,
      'update',
      'content',
      data.id,
      user.id,
    )
    return { ok: true as const, id: data.id, slug: uniqueSlug }
  })

export const listMediaFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => {
    const data =
      typeof input === 'object' && input !== null
        ? (input as Record<string, unknown>)
        : {}
    const limit = Math.min(
      200,
      Math.max(1, Number.parseInt(String(data.limit ?? '60'), 10) || 60),
    )
    const q = String(data.q ?? '')
      .trim()
      .slice(0, 120)
    return { limit, q }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { supabase } = await requireCmsAccess(PERMISSIONS.mediaRead)
    let query = supabase
      .from('media_assets')
      .select(
        'id, filename, mime_type, byte_size, alt_text, storage_path, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(data.limit)
    if (data.q) {
      query = query.ilike('filename', `%${escapeLike(data.q)}%`)
    }
    const { data: rows, error } = await query
    if (error) {
      console.error(error)
      throw new Error('Unable to load media')
    }
    return { items: rows ?? [] }
  })

export const createMediaUploadFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to prepare upload')
    }
    const raw = input as Record<string, unknown>
    const filename = String(raw.filename ?? '')
      .trim()
      .slice(0, 255)
    const mimeType = String(raw.mimeType ?? '')
      .trim()
      .slice(0, 120)
    const byteSize = Number(raw.byteSize ?? 0)
    if (
      filename.length < 1 ||
      mimeType.length < 1 ||
      !Number.isFinite(byteSize) ||
      byteSize < 1 ||
      byteSize > 8_000_000
    ) {
      throw new Error('Unable to prepare upload')
    }
    if (!/^image\//.test(mimeType)) {
      throw new Error('Unable to prepare upload')
    }
    return { filename, mimeType, byteSize }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireCmsWrite(PERMISSIONS.mediaWrite)
    const {
      isAllowedImageMime,
      mintUploadTicket,
      uploadTicketSecretConfigured,
    } = await import('#/lib/cms/media-upload.server')
    if (!uploadTicketSecretConfigured()) {
      return {
        error:
          'Media uploads are not available on this site yet. Contact the site administrator.',
      }
    }
    if (!isAllowedImageMime(data.mimeType)) {
      return { error: 'Unsupported file type' }
    }
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, '-')
    const storagePath = `${Date.now()}-${safeName}`
    const { data: signed, error } = await supabase.storage
      .from('media')
      .createSignedUploadUrl(storagePath)
    if (error || !signed) {
      console.error(error)
      return { error: 'Unable to prepare upload' }
    }
    const uploadTicket = mintUploadTicket({
      userId: user.id,
      storagePath,
      mimeType: data.mimeType,
      byteSize: data.byteSize,
    })
    return {
      ok: true as const,
      storagePath,
      signedUrl: signed.signedUrl,
      token: signed.token,
      mimeType: data.mimeType,
      byteSize: data.byteSize,
      uploadTicket,
    }
  })

export const registerMediaFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to register media')
    }
    const raw = input as Record<string, unknown>
    const filename = String(raw.filename ?? '')
      .trim()
      .slice(0, 255)
    const storagePath = String(raw.storagePath ?? '')
      .trim()
      .slice(0, 512)
    const mimeType = String(raw.mimeType ?? '')
      .trim()
      .slice(0, 120)
    const byteSize = Number(raw.byteSize ?? 0)
    const uploadTicket = String(raw.uploadTicket ?? '').trim()
    if (
      filename.length < 1 ||
      storagePath.length < 1 ||
      mimeType.length < 1 ||
      uploadTicket.length < 1 ||
      !Number.isFinite(byteSize) ||
      byteSize < 0
    ) {
      throw new Error('Unable to register media')
    }
    return { filename, storagePath, mimeType, byteSize, uploadTicket }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireCmsWrite(PERMISSIONS.mediaWrite)
    const { verifyUploadTicket, isAllowedImageMime, mimeMatchesImageBytes } =
      await import('#/lib/cms/media-upload.server')
    const claims = verifyUploadTicket(data.uploadTicket, user.id)
    if (
      !claims ||
      claims.storagePath !== data.storagePath ||
      claims.mimeType !== data.mimeType ||
      claims.byteSize !== data.byteSize
    ) {
      return { error: 'Upload session expired. Try uploading again.' }
    }
    if (!isAllowedImageMime(data.mimeType)) {
      return { error: 'Unsupported file type' }
    }
    const { data: blob, error: downloadError } = await supabase.storage
      .from('media')
      .download(data.storagePath)
    if (downloadError || !blob) {
      console.error(downloadError)
      return { error: 'Unable to verify upload' }
    }
    if (blob.size !== data.byteSize || blob.size > 8_000_000) {
      await supabase.storage.from('media').remove([data.storagePath])
      return { error: 'File size does not match' }
    }
    const bytes = new Uint8Array(await blob.arrayBuffer())
    if (!mimeMatchesImageBytes(data.mimeType, bytes)) {
      await supabase.storage.from('media').remove([data.storagePath])
      return { error: 'File contents do not match the declared image type.' }
    }
    const { data: row, error } = await supabase
      .from('media_assets')
      .insert({
        filename: data.filename,
        storage_path: data.storagePath,
        mime_type: data.mimeType,
        byte_size: data.byteSize,
        created_by: user.id,
      })
      .select('id')
      .single()
    if (error) {
      console.error(error)
      return { error: 'Unable to register media' }
    }
    clearPublicCache('public')
    return { ok: true as const, id: row.id }
  })

export const updateMediaAltFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to update media')
    }
    const raw = input as Record<string, unknown>
    const id = String(raw.id ?? '').trim()
    const altText = String(raw.altText ?? '')
      .trim()
      .slice(0, 500)
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      throw new Error('Unable to update media')
    }
    return { id, altText }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireCmsWrite(PERMISSIONS.mediaWrite)
    const { error } = await supabase
      .from('media_assets')
      .update({ alt_text: data.altText.length > 0 ? data.altText : null })
      .eq('id', data.id)
    if (error) {
      console.error(error)
      return { error: 'Unable to update alt text' }
    }
    await writeAuditLog(supabase, {
      actorUserId: user.id,
      action: 'media.update',
      targetType: 'media',
      targetId: data.id,
      metadata: { altText: data.altText },
    })
    clearPublicCache('public')
    return { ok: true as const }
  })

export const deleteMediaFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to delete media')
    }
    const id = String((input as Record<string, unknown>).id ?? '').trim()
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      throw new Error('Unable to delete media')
    }
    return { id }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { supabase } = await requireCmsWrite(PERMISSIONS.mediaWrite)
    const { data: row, error: readError } = await supabase
      .from('media_assets')
      .select('storage_path')
      .eq('id', data.id)
      .maybeSingle()
    if (readError) {
      console.error(readError)
      return { error: 'Unable to delete media' }
    }
    if (!row) {
      return { ok: true as const }
    }
    await supabase.storage.from('media').remove([row.storage_path])
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', data.id)
    if (error) {
      console.error(error)
      return { error: 'Unable to delete media' }
    }
    clearPublicCache('public')
    return { ok: true as const }
  })

export const getSiteSettingsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const { supabase } = await requireCmsAccess(PERMISSIONS.settingsRead)
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (error) {
      console.error(error)
      throw new Error('Unable to load settings')
    }
    return data
  },
)

export const saveSiteSettingsFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to save settings')
    }
    const raw = input as Record<string, unknown>
    return {
      siteName: String(raw.siteName ?? '')
        .trim()
        .slice(0, 120),
      siteUrl: String(raw.siteUrl ?? '')
        .trim()
        .slice(0, 255),
      timezone: String(raw.timezone ?? 'UTC').trim(),
      language: String(raw.language ?? 'en')
        .trim()
        .slice(0, 16),
      brandHex: parseBrandHex(raw.brandHex ?? DEFAULT_BRAND_HEX),
      logoUrl:
        String(raw.logoUrl ?? '')
          .trim()
          .slice(0, 512) || null,
      seoTitleTemplate: String(raw.seoTitleTemplate ?? '')
        .trim()
        .slice(0, 160),
      seoDefaultDescription:
        String(raw.seoDefaultDescription ?? '')
          .trim()
          .slice(0, 320) || null,
      socialImageUrl: parseCmsImageUrlForSave(
        String(raw.socialImageUrl ?? '').trim() || null,
        SOCIAL_IMAGE_URL_SAVE_ERROR,
      ),
      analyticsId:
        String(raw.analyticsId ?? '')
          .trim()
          .slice(0, 64) || null,
      webhookUrl:
        String(raw.webhookUrl ?? '')
          .trim()
          .slice(0, 512) || null,
      redirectAfterSignInAdmin:
        safeInternalPath(String(raw.redirectAfterSignInAdmin ?? '/admin')) ??
        '/admin',
      redirectAfterSignInUser:
        safeInternalPath(String(raw.redirectAfterSignInUser ?? '/')) ?? '/',
      redirectAfterSignUp:
        safeInternalPath(String(raw.redirectAfterSignUp ?? '/')) ?? '/',
      redirectAfterPasswordReset:
        safeInternalPath(
          String(raw.redirectAfterPasswordReset ?? '/account'),
        ) ?? '/account',
      redirectAfterSignOut:
        safeInternalPath(String(raw.redirectAfterSignOut ?? '/login')) ??
        '/login',
      contactEmail: (() => {
        const value = String(raw.contactEmail ?? '').trim()
        if (!value) {
          return ''
        }
        return parseEmail(value)
      })(),
      mfaEnabled: raw.mfaEnabled !== false,
      mfaPolicy: parseMfaPolicy(raw.mfaPolicy),
      siteSeo: (() => {
        try {
          return parseSiteSeoSaveInput(raw)
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message)
          }
          throw new Error('Unable to save settings')
        }
      })(),
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireCmsWrite(PERMISSIONS.settingsWrite)
    const lockoutMessage = assertMfaPolicyAllowsSave({
      nextPolicy: data.mfaPolicy,
      actorHasVerifiedFactor: await actorHasVerifiedMfaFactor(supabase),
    })
    if (lockoutMessage) {
      return { error: lockoutMessage }
    }
    const { data: previous, error: readError } = await supabase
      .from('site_settings')
      .select('mfa_enabled, mfa_policy, timezone')
      .eq('id', 1)
      .maybeSingle()
    if (readError) {
      console.error(readError)
      return { error: 'Unable to save settings' }
    }
    let timezone: string
    try {
      timezone = parseSiteTimezoneForSave(data.timezone, {
        previousTimezone: previous?.timezone,
      })
    } catch {
      return { error: 'Choose a valid timezone from the list.' }
    }
    const { error } = await supabase
      .from('site_settings')
      .update({
        site_name: data.siteName,
        site_url: data.siteUrl || null,
        timezone,
        language: data.language,
        brand_hex: data.brandHex,
        logo_url: data.logoUrl,
        seo_title_template: data.seoTitleTemplate,
        seo_default_description: data.seoDefaultDescription,
        social_image_url: data.socialImageUrl,
        analytics_id: data.analyticsId,
        webhook_url: data.webhookUrl,
        redirect_after_sign_in_admin: data.redirectAfterSignInAdmin,
        redirect_after_sign_in_user: data.redirectAfterSignInUser,
        redirect_after_sign_up: data.redirectAfterSignUp,
        redirect_after_password_reset: data.redirectAfterPasswordReset,
        redirect_after_sign_out: data.redirectAfterSignOut,
        contact_email: data.contactEmail || null,
        mfa_enabled: data.mfaEnabled,
        mfa_policy: data.mfaPolicy,
        ...siteSeoRowFromInput(data.siteSeo),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
    if (error) {
      console.error(error)
      return { error: 'Unable to save settings' }
    }
    if (
      previous &&
      (previous.mfa_enabled !== data.mfaEnabled ||
        previous.mfa_policy !== data.mfaPolicy)
    ) {
      await writeAuditLog(supabase, {
        actorUserId: user.id,
        action: 'site_settings.mfa_update',
        targetType: 'site_settings',
        targetId: '1',
        metadata: {
          mfa_enabled: data.mfaEnabled,
          mfa_policy: data.mfaPolicy,
          previous_mfa_enabled: previous.mfa_enabled,
          previous_mfa_policy: previous.mfa_policy,
        },
      })
    }
    clearPublicCache('public')
    clearPublicSeoSettingsCache()
    clearRedirectCache()
    return { ok: true as const }
  })

export const searchAdminCommandFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => {
    const q =
      typeof input === 'object' && input !== null
        ? String((input as Record<string, unknown>).q ?? '')
            .trim()
            .slice(0, 80)
        : ''
    return { q }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, access } = await requireCmsAccess(PERMISSIONS.adminAccess)

    type SearchResult = {
      content: Array<{ id: string; title: string; status: string }>
      users: Array<{
        userId: string
        email: string | null
        displayName: string | null
      }>
      message: string | null
    }

    const emptyResult = (message: string | null = null): SearchResult => ({
      content: [],
      users: [],
      message,
    })

    try {
      assertRateLimit(`admin:search:${user.id}`, 60, 60_000)
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        return emptyResult(RATE_LIMIT_MESSAGE)
      }
      throw error
    }

    if (data.q.length < 2) {
      return emptyResult()
    }
    const supabase = getRequestClient()
    const pattern = quotePostgrestFilterValue(`%${escapeLike(data.q)}%`)
    const { data: rows, error } = await supabase
      .from('content_entries')
      .select('id, title, status')
      .or(`title.ilike.${pattern},slug.ilike.${pattern}`)
      .order('updated_at', { ascending: false })
      .limit(8)
    if (error) {
      console.error(error)
    }

    let users: Array<{
      userId: string
      email: string | null
      displayName: string | null
    }> = []
    if (access.permissions.includes(PERMISSIONS.profilesReadAll)) {
      const service = createServiceRoleClient()
      const { data: profiles, error: usersError } = await service
        .from('profiles')
        .select('user_id, email, display_name')
        .or(`email.ilike.${pattern},display_name.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(8)
      if (usersError) {
        console.error(usersError)
      } else {
        users = (profiles ?? []).map((row) => ({
          userId: row.user_id,
          email: row.email,
          displayName: row.display_name,
        }))
      }
    }

    return { content: rows ?? [], users, message: null }
  })

export const getAdminShellSettingsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  markPrivateNoStore()
  const { supabase } = await requireCmsAccess(PERMISSIONS.adminAccess)
  const { data, error } = await supabase
    .from('site_settings')
    .select('site_name, brand_hex, logo_url')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    console.error(error)
    return {
      siteName: DEFAULT_PUBLIC_SITE_NAME,
      brandHex: DEFAULT_BRAND_HEX,
      logoUrl: null,
    }
  }
  return {
    siteName: resolvePublicSiteName(data?.site_name),
    brandHex: resolvePublicBrandHex(data?.brand_hex),
    logoUrl: data?.logo_url ?? null,
  }
})
