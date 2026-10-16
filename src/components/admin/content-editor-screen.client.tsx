import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Article, Gear, MagnifyingGlass } from '@phosphor-icons/react'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  blocksSnapshotEqual,
  tagsFieldEqual,
} from '#/lib/cms/admin-editor-dirty'
import {
  adminEditorPublicPath,
  contentEntryEditorKind,
} from '#/lib/cms/admin-editor-content'
import { useAdminEditorPreview } from '#/lib/admin/use-admin-editor-preview.client'

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
  emptyBlockDocument,
  parseBlockDocument,
  type BlockNoteDocument,
} from '#/lib/cms/blocknote-types'
import { saveContentFn } from '#/lib/cms/functions'
import { ADMIN_EDITOR_TAB_SEARCH } from '#/lib/admin/admin-tab-defaults'
import { useEditorSlugFromTitle } from '#/lib/admin/use-editor-slug-from-title'
import { useSyncedEditorTab } from '#/lib/admin/use-synced-editor-tab'
import { useAdminMediaUpload } from '#/lib/cms/use-admin-media-upload'
import { appToast } from '#/lib/app-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ContentRecord = {
  id: string
  kind: string
  title: string
  slug: string
  status: string
  body: unknown
  show_in_nav: boolean
  published_at: string | null
  scheduled_at: string | null
  tags: string[]
  featured_media_id: string | null
  cover_image_url?: string | null
  canonical_url: string | null
  og_image_alt: string | null
  noindex: boolean
  sitemap_exclude: boolean
  meta_title: string | null
  meta_description: string | null
}

const EDITOR_TABS = [
  { id: 'content', label: 'Content', icon: Article },
  { id: 'seo', label: 'SEO', icon: MagnifyingGlass },
  { id: 'settings', label: 'Settings', icon: Gear },
] as const

export type ContentEditorTabId = (typeof EDITOR_TABS)[number]['id']

const contentEditorRoute = getRouteApi(
  '/_authenticated/admin/content/$contentId',
)

export function ContentEditorScreen({ initial }: { initial: ContentRecord }) {
  const router = useRouter()
  const navigate = contentEditorRoute.useNavigate()
  const { tab } = contentEditorRoute.useSearch()
  const { activeTab, setTab } = useSyncedEditorTab<ContentEditorTabId>({
    urlTab: tab as ContentEditorTabId,
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
  const save = useServerFn(saveContentFn)
  const { uploadImage } = useAdminMediaUpload()
  const mountedRef = useRef(true)
  const isNew = initial.id === 'new'

  const initialBlocks = useMemo(
    () => parseBlockDocument(initial.body),
    [initial.body],
  )

  const [title, setTitle] = useState(initial.title)
  const [slug, setSlug] = useState(initial.slug)
  const [coverImageUrl, setCoverImageUrl] = useState(
    initial.cover_image_url ?? '',
  )
  const [featuredMediaId, setFeaturedMediaId] = useState(
    initial.featured_media_id,
  )
  const [kind] = useState(initial.kind)
  const [status, setStatus] = useState(initial.status)
  const [blocks, setBlocks] = useState<BlockNoteDocument>(initialBlocks)
  const [showInNav, setShowInNav] = useState(initial.show_in_nav)
  const [publishedAt, setPublishedAt] = useState(initial.published_at ?? '')
  const [scheduledAt] = useState(initial.scheduled_at ?? '')
  const [tags, setTags] = useState(initial.tags.join(', '))
  const [seoEntry, setSeoEntry] = useState({
    seoTitle: initial.meta_title ?? '',
    metaDescription: initial.meta_description ?? '',
    canonicalUrl: initial.canonical_url ?? '',
    ogImageAlt: initial.og_image_alt ?? '',
    noindex: initial.noindex ?? false,
    sitemapExclude: initial.sitemap_exclude ?? false,
  })
  const [createSlugRedirect, setCreateSlugRedirect] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [savedBaseline, setSavedBaseline] = useState(() => ({
    status: initial.status,
    slug: initial.slug,
  }))
  const slugLockedPublished = savedBaseline.status === 'published'
  const { onSlugChange, applyTitleToSlug } = useEditorSlugFromTitle({
    slugLockedPublished,
    initialTitle: initial.title,
    initialSlug: initial.slug,
    setSlug,
  })

  useEffect(() => {
    if (!isNew) {
      setSavedBaseline({ status: initial.status, slug: initial.slug })
    }
  }, [initial.slug, initial.status, isNew])

  const onBlocksChange = useCallback((next: BlockNoteDocument) => {
    if (mountedRef.current) {
      setBlocks(next)
    }
  }, [])

  const editorDocumentKey = initial.id

  const isDirty = useMemo(() => {
    if (isNew) {
      return true
    }
    return (
      title !== initial.title ||
      slug !== initial.slug ||
      coverImageUrl !== (initial.cover_image_url ?? '') ||
      featuredMediaId !== initial.featured_media_id ||
      kind !== initial.kind ||
      status !== initial.status ||
      showInNav !== initial.show_in_nav ||
      (publishedAt || '') !== (initial.published_at ?? '') ||
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
    initial,
    initialBlocks,
    isNew,
    kind,
    seoEntry,
    publishedAt,
    showInNav,
    coverImageUrl,
    featuredMediaId,
    slug,
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
    nextStatus: string,
    options?: { quiet?: boolean; skipNavigateOnCreate?: boolean },
  ): Promise<{ slug: string; id?: string } | null> {
    setPending(true)
    setError('')
    try {
      const bodyJson = blocks.length > 0 ? blocks : emptyBlockDocument()
      const result = await save({
        data: {
          id: initial.id,
          kind,
          title,
          slug,
          status: nextStatus,
          body: bodyJson,
          showInNav,
          publishedAt: publishedAt || null,
          scheduledAt: scheduledAt || null,
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          featuredMediaId,
          metaTitle: seoEntry.seoTitle.trim() || null,
          metaDescription: seoEntry.metaDescription.trim() || null,
          canonicalUrl: seoEntry.canonicalUrl.trim() || null,
          ogImageAlt: seoEntry.ogImageAlt.trim() || null,
          noindex: seoEntry.noindex,
          sitemapExclude: seoEntry.sitemapExclude,
          createSlugRedirect,
        },
      })
      if ('error' in result && result.error) {
        setError(result.error)
        appToast.error(result.error)
        return null
      }
      const resolvedSlug = slug.trim()
      const savedSlug =
        'slug' in result && typeof result.slug === 'string'
          ? result.slug
          : resolvedSlug
      if ('slug' in result && typeof result.slug === 'string') {
        setSlug(result.slug)
      }
      setStatus(nextStatus)
      setSavedBaseline({ status: nextStatus, slug: savedSlug })
      setLastSavedAt(Date.now())
      if (!options?.quiet) {
        appToast.success(
          nextStatus === 'published' ? 'Page published.' : 'Draft saved.',
        )
      }
      if (
        isNew &&
        'id' in result &&
        result.id &&
        !options?.skipNavigateOnCreate
      ) {
        await router.navigate({
          to: '/admin/content/$contentId',
          params: { contentId: result.id },
          search: ADMIN_EDITOR_TAB_SEARCH,
          replace: true,
        })
      } else if (!isNew || ('id' in result && result.id)) {
        await router.invalidate()
      }
      return {
        slug: resolvedSlug,
        id: 'id' in result ? result.id : undefined,
      }
    } finally {
      if (mountedRef.current) {
        setPending(false)
      }
    }
  }

  const editorKind = contentEntryEditorKind(kind)

  const { toolbarActions, onViewLive, onPreviewPending } =
    useAdminEditorPreview({
      editorKind,
      isNew,
      isDirty,
      savedBaseline,
      slug,
      status,
      title,
      requireTitleBeforePreview: true,
      onSaveThenOpen: async (saveStatus) => {
        const saved = await persist(saveStatus, {
          quiet: true,
          skipNavigateOnCreate: true,
        })
        if (!saved) {
          return null
        }
        if (isNew && saved.id) {
          await router.navigate({
            to: '/admin/content/$contentId',
            params: { contentId: saved.id },
            search: ADMIN_EDITOR_TAB_SEARCH,
            replace: true,
          })
        }
        return saved.slug
      },
    })

  async function onPublishFromPopover() {
    const nextStatus = status === 'scheduled' ? 'scheduled' : 'published'
    await persist(nextStatus)
  }

  const pagePath = adminEditorPublicPath(editorKind, slug)

  return (
    <div className="admin-page-desk">
      {error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <AdminWritingDesk
        backTo={{
          to: '/admin/content',
          search: { filter: 'all', q: '', page: 1 },
        }}
        backLabel="Content"
        title={title || (isNew ? 'New page' : 'Edit page')}
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
              onStatusChange={setStatus}
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
            slugId="content-slug"
            slug={slug}
            onSlugChange={onSlugChange}
            slugPlaceholder={editorKind === 'page' ? 'page-slug' : 'post-slug'}
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
              id="content-title"
              className="admin-write-title"
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value
                setTitle(nextTitle)
                applyTitleToSlug(nextTitle)
              }}
              placeholder="Page title"
            />
            <p className="mb-3 text-xs text-muted-foreground">
              Type / for blocks
            </p>
            <BlockNoteRichTextEditor
              id="content-body"
              label="Body"
              hideLabel
              documentKey={editorDocumentKey}
              blocks={blocks}
              onChange={onBlocksChange}
              onUploadFile={uploadEditorFile}
            />
          </>
        }
        tabs={EDITOR_TABS}
        activeTab={activeTab}
        onTabChange={(next) => setTab(next as ContentEditorTabId)}
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
                        <Label htmlFor="visibility">Visibility</Label>
                        <select
                          id="visibility"
                          className="admin-input-tall mt-1 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={status}
                          onChange={(event) => setStatus(event.target.value)}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="scheduled">Scheduled</option>
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
                    pageLabel={title || 'Page title'}
                    path={pagePath}
                    ogType={kind === 'post' ? 'article' : 'website'}
                  />
                ),
              },
              {
                id: 'settings',
                children: (
                  <AdminSectionBlock title="Settings">
                    <div className="admin-field-grid">
                      <div>
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          value={tags}
                          onChange={(event) => setTags(event.target.value)}
                          placeholder="Comma separated"
                          className="admin-input-tall mt-1"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={showInNav}
                          onChange={(event) =>
                            setShowInNav(event.target.checked)
                          }
                        />
                        Show in main nav
                      </label>
                      {!isNew &&
                      initial.status === 'published' &&
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
            onSave={() =>
              void persist(status === 'published' ? 'published' : 'draft')
            }
          />
        }
      />
    </div>
  )
}
