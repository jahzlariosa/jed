import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Article, Gear, MagnifyingGlass, Trash } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { AdminEditorPreviewButtons } from '#/components/admin/admin-editor-preview-buttons.client'
import { AdminEditorSidebarIntro } from '#/components/admin/admin-editor-sidebar-intro.client'
import { BlockNoteRichTextEditor } from '#/components/admin/blocknote-editor'
import { AdminPublishPopover } from '#/components/admin/admin-publish-popover'
import { AdminSectionBlock } from '#/components/admin/admin-section-block'
import { AdminStickySaveBar } from '#/components/admin/admin-sticky-save-bar'
import {
  AdminWritingDesk,
  AdminWritingDeskPanels,
} from '#/components/admin/admin-writing-desk.client'
import { SeoEntryFields } from '#/components/admin/seo-entry-fields'
import {
  blocksToPublicHtmlClient,
  htmlToBlocksClient,
} from '#/lib/cms/blocknote-browser'
import {
  emptyBlockDocument,
  initialEditorBody,
  type BlockNoteDocument,
} from '#/lib/cms/blocknote-types'
import {
  blocksSnapshotEqual,
  tagsFieldEqual,
} from '#/lib/cms/admin-editor-dirty'
import { useAdminEditorPreview } from '#/lib/admin/use-admin-editor-preview.client'
import { POST_CATEGORY_LABELS } from '#/lib/cms/blog'
import type { PostKind, PostStatus } from '#/lib/cms/schemas'
import { useEditorSlugFromTitle } from '#/lib/admin/use-editor-slug-from-title'
import { useSyncedEditorTab } from '#/lib/admin/use-synced-editor-tab'
import { useAdminMediaUpload } from '#/lib/cms/use-admin-media-upload'
import { phosphorIcon } from '#/lib/icon'
import { deleteAdminPostFn, saveAdminPostFn } from '#/lib/cms/posts-admin-fns'
import { ADMIN_EDITOR_TAB_SEARCH } from '#/lib/admin/admin-tab-defaults'
import { appToast } from '#/lib/app-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PostRecord = {
  id: string
  kind: string
  slug: string
  title: string
  speaker: string
  excerpt: string
  body_html: string
  body_blocks: unknown
  cover_image_url: string | null
  tags: string[]
  video_url: string | null
  published_at: string | null
  status: string
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
  og_image_alt: string | null
  cover_image_alt: string | null
  noindex: boolean
  sitemap_exclude: boolean
  featured_media_id: string | null
  updated_at?: string
}

const KINDS = Object.keys(POST_CATEGORY_LABELS) as PostKind[]

const EDITOR_TABS = [
  { id: 'content', label: 'Content', icon: Article },
  { id: 'seo', label: 'SEO', icon: MagnifyingGlass },
  { id: 'settings', label: 'Settings', icon: Gear },
] as const

export type PostEditorTabId = (typeof EDITOR_TABS)[number]['id']

const postEditorRoute = getRouteApi('/_authenticated/admin/posts/$postId')

export function PostEditorScreen({
  initial,
  isNew,
}: {
  initial: PostRecord | null
  isNew: boolean
}) {
  const router = useRouter()
  const navigate = postEditorRoute.useNavigate()
  const { tab } = postEditorRoute.useSearch()
  const { activeTab, setTab } = useSyncedEditorTab<PostEditorTabId>({
    urlTab: tab as PostEditorTabId,
    validTabs: EDITOR_TABS.map((item) => item.id),
    defaultTab: 'content',
    onUrlTabChange: (next) => {
      void navigate({
        search: (prev) => ({ ...prev, tab: next }),
        replace: true,
        resetScroll: false,
      })
    },
  })
  const save = useServerFn(saveAdminPostFn)
  const remove = useServerFn(deleteAdminPostFn)
  const { uploadImage } = useAdminMediaUpload()

  const initialBlocks = useMemo(() => {
    if (!initial) {
      return emptyBlockDocument()
    }
    const seed = initialEditorBody(initial.body_blocks, initial.body_html)
    if (seed.legacyHtml?.trim()) {
      return htmlToBlocksClient(seed.legacyHtml)
    }
    return seed.blocks as BlockNoteDocument
  }, [initial])

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [kind, setKind] = useState<PostKind>(
    (initial?.kind as PostKind) ?? 'article',
  )
  const [speaker, setSpeaker] = useState(initial?.speaker ?? '')
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [blocks, setBlocks] = useState<BlockNoteDocument>(initialBlocks)

  useEffect(() => {
    setBlocks(initialBlocks)
  }, [initialBlocks])
  const [coverImageUrl, setCoverImageUrl] = useState(
    initial?.cover_image_url ?? '',
  )
  const [featuredMediaId, setFeaturedMediaId] = useState(
    initial?.featured_media_id ?? null,
  )
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [publishedAt, setPublishedAt] = useState(
    initial?.published_at?.slice(0, 16) ?? '',
  )
  const [status, setStatus] = useState<PostStatus>(
    (initial?.status as PostStatus) ?? 'draft',
  )
  const [seoEntry, setSeoEntry] = useState({
    seoTitle: initial?.meta_title ?? '',
    metaDescription: initial?.meta_description ?? '',
    canonicalUrl: initial?.canonical_url ?? '',
    ogImageAlt: initial?.og_image_alt ?? '',
    noindex: initial?.noindex ?? false,
    sitemapExclude: initial?.sitemap_exclude ?? false,
  })
  const [createSlugRedirect, setCreateSlugRedirect] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(
    initial?.updated_at ? Date.parse(initial.updated_at) : null,
  )
  const [savedBaseline, setSavedBaseline] = useState(() => ({
    status: initial?.status ?? 'draft',
    slug: initial?.slug ?? '',
  }))
  const slugLockedPublished = savedBaseline.status === 'published'
  const { onSlugChange, applyTitleToSlug } = useEditorSlugFromTitle({
    slugLockedPublished,
    initialTitle: initial?.title ?? '',
    initialSlug: initial?.slug ?? '',
    setSlug,
  })

  useEffect(() => {
    if (initial && !isNew) {
      setSavedBaseline({ status: initial.status, slug: initial.slug })
    }
  }, [initial, isNew])

  const onBlocksChange = useCallback((next: BlockNoteDocument) => {
    setBlocks(next)
  }, [])

  const isDirty = useMemo(() => {
    if (!initial || isNew) {
      return true
    }
    return (
      title !== initial.title ||
      slug !== initial.slug ||
      kind !== (initial.kind as PostKind) ||
      speaker !== initial.speaker ||
      excerpt !== initial.excerpt ||
      status !== initial.status ||
      coverImageUrl !== (initial.cover_image_url ?? '') ||
      featuredMediaId !== (initial.featured_media_id ?? null) ||
      (publishedAt || '') !== (initial.published_at?.slice(0, 16) ?? '') ||
      !tagsFieldEqual(tags, initial.tags) ||
      seoEntry.seoTitle !== (initial.meta_title ?? '') ||
      seoEntry.metaDescription !== (initial.meta_description ?? '') ||
      seoEntry.canonicalUrl !== (initial.canonical_url ?? '') ||
      seoEntry.ogImageAlt !== (initial.og_image_alt ?? '') ||
      seoEntry.noindex !== (initial.noindex ?? false) ||
      seoEntry.sitemapExclude !== (initial.sitemap_exclude ?? false) ||
      !blocksSnapshotEqual(blocks, initialBlocks)
    )
  }, [
    blocks,
    coverImageUrl,
    excerpt,
    featuredMediaId,
    initial,
    initialBlocks,
    isNew,
    kind,
    seoEntry,
    publishedAt,
    slug,
    speaker,
    status,
    tags,
    title,
  ])

  async function uploadEditorFile(file: File): Promise<string> {
    try {
      const uploaded = await uploadImage(file)
      return uploaded.url
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Image upload failed.'
      appToast.error(message)
      throw cause instanceof Error ? cause : new Error(message)
    }
  }

  async function uploadCoverImage(file: File) {
    const uploaded = await uploadImage(file)
    setCoverImageUrl(uploaded.url)
    setFeaturedMediaId(uploaded.mediaId)
  }

  async function persist(
    publishIntent: 'save_draft' | 'publish' | 'update',
    nextStatus: PostStatus = status,
    options?: { quiet?: boolean },
  ): Promise<boolean> {
    setPending(true)
    setError('')
    try {
      const bodyHtml = blocksToPublicHtmlClient(blocks)
      const result = await save({
        data: {
          id: isNew ? undefined : initial?.id,
          kind,
          slug,
          title,
          speaker,
          excerpt,
          bodyHtml,
          bodyBlocks: blocks,
          coverImageUrl: coverImageUrl.trim() || null,
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
          status: nextStatus,
          publishIntent,
          featuredMediaId,
          metaTitle: seoEntry.seoTitle.trim() || null,
          metaDescription: seoEntry.metaDescription.trim() || null,
          canonicalUrl: seoEntry.canonicalUrl.trim() || null,
          ogImageAlt: seoEntry.ogImageAlt.trim() || null,
          coverImageAlt: seoEntry.ogImageAlt.trim() || null,
          noindex: seoEntry.noindex,
          sitemapExclude: seoEntry.sitemapExclude,
          createSlugRedirect,
          videoUrl: initial?.video_url ?? null,
        },
      })
      if ('error' in result && result.error) {
        setError(result.error)
        appToast.error(result.error)
        return false
      }
      const savedSlug =
        'slug' in result && typeof result.slug === 'string'
          ? result.slug
          : slug.trim()
      if ('slug' in result && typeof result.slug === 'string') {
        setSlug(result.slug)
      }
      const resolvedStatus =
        publishIntent === 'save_draft' ? 'draft' : nextStatus
      setStatus(resolvedStatus)
      setSavedBaseline({ status: resolvedStatus, slug: savedSlug })
      setLastSavedAt(Date.now())
      if (!options?.quiet) {
        if (publishIntent === 'publish') {
          appToast.success('Post published.')
        } else if (publishIntent === 'save_draft') {
          appToast.success('Draft saved.')
        } else {
          appToast.success('Post saved.')
        }
      }
      if (isNew && 'id' in result && result.id) {
        await router.navigate({
          to: '/admin/posts/$postId',
          params: { postId: result.id },
          search: ADMIN_EDITOR_TAB_SEARCH,
          replace: true,
        })
      } else {
        await router.invalidate()
      }
      return true
    } finally {
      setPending(false)
    }
  }

  const { toolbarActions, onViewLive, onPreviewPending } =
    useAdminEditorPreview({
      editorKind: 'post',
      isNew,
      isDirty,
      savedBaseline,
      slug,
      status,
      onSaveThenOpen: async () => {
        const ok = await persist('update', savedBaseline.status as PostStatus, {
          quiet: true,
        })
        if (!ok) {
          return null
        }
        return slug.trim() || savedBaseline.slug
      },
    })

  async function onDelete() {
    if (!initial?.id || !window.confirm('Delete this post permanently?')) {
      return
    }
    setPending(true)
    const result = await remove({ data: { id: initial.id } })
    setPending(false)
    if (result.error) {
      setError(result.error)
      appToast.error(result.error)
      return
    }
    appToast.success('Post deleted.')
    await router.invalidate()
    await router.navigate({
      to: '/admin/posts',
      search: { status: 'all', page: 1 },
    })
  }

  async function onPublishFromPopover() {
    const nextStatus: PostStatus =
      status === 'scheduled' ? 'scheduled' : 'published'
    await persist('publish', nextStatus)
  }

  return (
    <div className="admin-page-desk">
      {error ? (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <AdminWritingDesk
        backTo={{ to: '/admin/posts', search: { status: 'all', page: 1 } }}
        backLabel="Posts"
        title={isNew ? 'New post' : title || 'Edit post'}
        autosave={{ dirty: isDirty, saving: pending, savedAt: lastSavedAt }}
        topActions={
          <>
            <AdminEditorPreviewButtons
              toolbarActions={toolbarActions}
              pending={pending}
              onPreview={() => void onPreviewPending()}
              onViewLive={() => void onViewLive()}
            />
            <Button
              type="button"
              size="sm"
              loading={pending}
              disabled={pending}
              onClick={() => setPublishOpen(true)}
            >
              Publish
            </Button>
            <AdminPublishPopover
              open={publishOpen}
              onOpenChange={setPublishOpen}
              status={status}
              onStatusChange={(value) => setStatus(value as PostStatus)}
              publishedAt={publishedAt}
              onPublishedAtChange={setPublishedAt}
              pending={pending}
              confirmLabel={status === 'scheduled' ? 'Schedule' : 'Publish now'}
              onConfirm={() => void onPublishFromPopover()}
            />
          </>
        }
        sidebarHeader={
          <AdminEditorSidebarIntro
            slugId="post-slug"
            slug={slug}
            onSlugChange={onSlugChange}
            slugPlaceholder="my-post-slug"
            coverImageUrl={coverImageUrl}
            onCoverImageUrlChange={setCoverImageUrl}
            onFeaturedMediaIdChange={setFeaturedMediaId}
            onCoverUpload={uploadCoverImage}
            coverDisabled={pending}
          />
        }
        canvas={
          <>
            <input
              id="post-title"
              className="admin-write-title"
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value
                setTitle(nextTitle)
                applyTitleToSlug(nextTitle)
              }}
              placeholder="Post title"
              required
            />
            <textarea
              id="post-excerpt"
              className="admin-write-excerpt"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="Short excerpt for listings and search"
              maxLength={500}
              rows={2}
            />
            <p className="mb-3 text-xs text-muted-foreground">
              Type / for blocks
            </p>
            <BlockNoteRichTextEditor
              id="post-body"
              label="Body"
              hideLabel
              documentKey={initial?.id ?? 'new'}
              blocks={blocks}
              onChange={onBlocksChange}
              onUploadFile={uploadEditorFile}
            />
          </>
        }
        tabs={EDITOR_TABS}
        activeTab={activeTab}
        onTabChange={(next) => setTab(next as PostEditorTabId)}
        tabPanels={
          <AdminWritingDeskPanels
            activeTab={activeTab}
            panels={[
              {
                id: 'content',
                children: (
                  <AdminSectionBlock title="Content">
                    <div className="admin-field-grid">
                      <div>
                        <Label htmlFor="post-status">Visibility</Label>
                        <select
                          id="post-status"
                          className="admin-input-tall mt-1 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={status}
                          onChange={(event) =>
                            setStatus(event.target.value as PostStatus)
                          }
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="scheduled">Scheduled</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="post-kind">Category</Label>
                        <select
                          id="post-kind"
                          className="admin-input-tall mt-1 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={kind}
                          onChange={(event) =>
                            setKind(event.target.value as PostKind)
                          }
                        >
                          {KINDS.map((value) => (
                            <option key={value} value={value}>
                              {POST_CATEGORY_LABELS[value]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </AdminSectionBlock>
                ),
              },
              {
                id: 'seo',
                children: (
                  <SeoEntryFields
                    value={seoEntry}
                    onChange={setSeoEntry}
                    pageLabel={title || 'Post title'}
                    path={`/blog/${slug || 'post-slug'}`}
                    excerpt={excerpt}
                    ogImageUrl={coverImageUrl.trim() || null}
                    ogType="article"
                  />
                ),
              },
              {
                id: 'settings',
                children: (
                  <AdminSectionBlock title="Settings">
                    <div className="admin-field-grid">
                      <div>
                        <Label htmlFor="post-tags">Tags</Label>
                        <Input
                          id="post-tags"
                          value={tags}
                          onChange={(event) => setTags(event.target.value)}
                          className="admin-input-tall mt-1"
                          placeholder="Comma separated"
                        />
                      </div>
                      <div>
                        <Label htmlFor="post-speaker">Byline</Label>
                        <Input
                          id="post-speaker"
                          value={speaker}
                          onChange={(event) => setSpeaker(event.target.value)}
                          className="admin-input-tall mt-1"
                        />
                      </div>
                      {!isNew ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="mt-2"
                          loading={pending}
                          disabled={pending}
                          onClick={() => void onDelete()}
                        >
                          <Trash
                            {...phosphorIcon}
                            className="mr-2 size-4 text-current"
                            aria-hidden
                          />
                          Delete post
                        </Button>
                      ) : null}
                      {!isNew &&
                      initial?.status === 'published' &&
                      slug !== initial.slug ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={createSlugRedirect}
                            onChange={(event) =>
                              setCreateSlugRedirect(event.target.checked)
                            }
                          />
                          Create a redirect from the old address
                        </label>
                      ) : null}
                    </div>
                  </AdminSectionBlock>
                ),
              },
            ]}
          />
        }
        saveBar={
          <AdminStickySaveBar
            dirty={isDirty}
            saving={pending}
            onSave={() => void persist('update', status)}
            secondarySaveLabel={
              isNew || savedBaseline.status === 'draft'
                ? 'Save draft'
                : undefined
            }
            onSecondarySave={
              isNew || savedBaseline.status === 'draft'
                ? () => void persist('save_draft')
                : undefined
            }
          />
        }
      />
    </div>
  )
}
