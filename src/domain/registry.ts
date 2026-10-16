import { z } from 'zod'

import { PERMISSIONS } from '#/auth/permissions'
import {
  adminPostsListQuerySchema,
  auditListQuerySchema,
  contentIdParamSchema,
  contentListQuerySchema,
  contentSaveBodySchema,
  emptyObjectSchema,
  mcpConfirmSchema,
  meAvatarUploadBodySchema,
  meDisplayNameBodySchema,
  parseAuditListInput,
  parseUsersListInput,
  postIdParamSchema,
  postInputSchema,
  searchRouteSchema,
  inviteUserBodySchema,
  mcpIdempotencyKeySchema,
  siteSettingsSaveBodySchema,
  sqlTemplateIdParamSchema,
  updateUserBodySchema,
  userIdParamSchema,
  usersListQuerySchema,
  createRoleBodySchema,
  updateRoleBodySchema,
  roleCodeParamSchema,
  deleteRoleBodySchema,
} from '#/domain/api-schemas'
import { parseContentListQuery } from '#/lib/cms/validators'

import { listAuditLogDomain } from './handlers/audit.server'
import { getContentDomain, listContentDomain } from './handlers/content.server'
import { saveContentDomain } from './handlers/content-write.server'
import {
  getMeDomain,
  removeMeAvatarDomain,
  updateMeDisplayNameDomain,
  uploadMeAvatarDomain,
} from './handlers/me.server'
import {
  getAdminPostDomain,
  listAdminPostsDomain,
} from './handlers/posts.server'
import { saveAdminPostDomain } from './handlers/posts-write.server'
import { searchPublishedContentDomain } from './handlers/search.server'
import { getSiteSettingsDomain } from './handlers/settings.server'
import { saveSiteSettingsDomain } from './handlers/settings-write.server'
import {
  getSqlTemplateDomain,
  listSqlTemplatesDomain,
} from './handlers/sql-templates.server'
import {
  deactivateUserDomain,
  inviteUserDomain,
  listUsersDomain,
  updateUserDomain,
} from './handlers/users-admin-domain.server'
import {
  createRoleDomain,
  deleteRoleDomain,
  listRolesDomain,
  updateRoleDomain,
} from './handlers/roles-admin-domain.server'
import type { DomainOperation } from './types'

const getContentMcpSchema = contentIdParamSchema
const getPostMcpSchema = postIdParamSchema
const getSqlTemplateMcpSchema = sqlTemplateIdParamSchema

function mcpWriteSchema(
  schema: z.ZodObject<z.ZodRawShape>,
  destructive: boolean,
) {
  const base = mcpIdempotencyKeySchema.merge(schema)
  return destructive ? mcpConfirmSchema.merge(base) : base
}

const saveContentMcpSchema = mcpWriteSchema(contentSaveBodySchema, true)
const savePostMcpSchema = mcpWriteSchema(postInputSchema, true)
const saveSettingsMcpSchema = mcpWriteSchema(siteSettingsSaveBodySchema, true)
const updateMeMcpSchema = mcpWriteSchema(meDisplayNameBodySchema, true)
const uploadAvatarMcpSchema = mcpWriteSchema(meAvatarUploadBodySchema, true)
const removeAvatarMcpSchema = mcpWriteSchema(emptyObjectSchema, true)
const inviteUserMcpSchema = mcpWriteSchema(inviteUserBodySchema, true)
const updateUserMcpSchema = mcpWriteSchema(
  userIdParamSchema.merge(updateUserBodySchema),
  true,
)
const deactivateUserMcpSchema = mcpWriteSchema(userIdParamSchema, true)

export function getDomainOperations(): DomainOperation<unknown, unknown>[] {
  return [
    {
      id: 'get_me',
      method: 'GET',
      path: '/me',
      mcpToolName: 'get_me',
      summary: 'Current user profile and access',
      scopes: 'authenticated',
      inputSchema: emptyObjectSchema,
      mcpInputSchema: emptyObjectSchema,
      outputSchema: z.unknown(),
      handler: async (ctx) => getMeDomain(ctx),
    },
    {
      id: 'update_me',
      method: 'PATCH',
      path: '/me',
      mcpToolName: 'update_me_display_name',
      summary: 'Update your display name',
      scopes: 'authenticated',
      inputSchema: meDisplayNameBodySchema,
      mcpInputSchema: updateMeMcpSchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        updateMeDisplayNameDomain(ctx, meDisplayNameBodySchema.parse(input)),
    },
    {
      id: 'upload_me_avatar',
      method: 'POST',
      path: '/me/avatar',
      mcpToolName: 'upload_me_avatar',
      summary: 'Upload profile photo (PNG, JPEG, or WebP, max 2 MB)',
      scopes: 'authenticated',
      inputSchema: meAvatarUploadBodySchema,
      mcpInputSchema: uploadAvatarMcpSchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        uploadMeAvatarDomain(ctx, meAvatarUploadBodySchema.parse(input)),
    },
    {
      id: 'remove_me_avatar',
      method: 'DELETE',
      path: '/me/avatar',
      mcpToolName: 'remove_me_avatar',
      summary: 'Remove profile photo',
      scopes: 'authenticated',
      inputSchema: emptyObjectSchema,
      mcpInputSchema: removeAvatarMcpSchema,
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx) => removeMeAvatarDomain(ctx),
    },
    {
      id: 'list_content',
      method: 'GET',
      path: '/content',
      mcpToolName: 'list_content',
      summary: 'List CMS content entries',
      scopes: [PERMISSIONS.contentRead],
      inputSchema: contentListQuerySchema,
      mcpInputSchema: contentListQuerySchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        listContentDomain(ctx, parseContentListQuery(input)),
    },
    {
      id: 'get_content',
      method: 'GET',
      path: '/content/:id',
      mcpToolName: 'get_content',
      summary: 'Get one CMS content entry',
      scopes: [PERMISSIONS.contentRead],
      inputSchema: contentIdParamSchema,
      mcpInputSchema: getContentMcpSchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        getContentDomain(ctx, contentIdParamSchema.parse(input)),
    },
    {
      id: 'save_content',
      method: 'POST',
      path: '/content',
      mcpToolName: 'save_content',
      summary: 'Create or update CMS content',
      scopes: [PERMISSIONS.contentWrite],
      inputSchema: contentSaveBodySchema,
      mcpInputSchema: saveContentMcpSchema,
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx, input) =>
        saveContentDomain(ctx, contentSaveBodySchema.parse(input)),
    },
    {
      id: 'list_posts',
      method: 'GET',
      path: '/posts',
      mcpToolName: 'list_posts',
      summary: 'List blog posts (admin)',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: adminPostsListQuerySchema,
      mcpInputSchema: adminPostsListQuerySchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        listAdminPostsDomain(ctx, adminPostsListQuerySchema.parse(input)),
    },
    {
      id: 'get_post',
      method: 'GET',
      path: '/posts/:postId',
      mcpToolName: 'get_post',
      summary: 'Get one blog post (admin)',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: postIdParamSchema,
      mcpInputSchema: getPostMcpSchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        getAdminPostDomain(ctx, postIdParamSchema.parse(input)),
    },
    {
      id: 'save_post',
      method: 'POST',
      path: '/posts',
      mcpToolName: 'save_post',
      summary: 'Create or update a blog post',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: postInputSchema,
      mcpInputSchema: savePostMcpSchema,
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx, input) =>
        saveAdminPostDomain(ctx, postInputSchema.parse(input)),
    },
    {
      id: 'get_settings',
      method: 'GET',
      path: '/settings',
      mcpToolName: 'get_settings',
      summary: 'Get site settings',
      scopes: [PERMISSIONS.settingsRead],
      inputSchema: emptyObjectSchema,
      mcpInputSchema: emptyObjectSchema,
      outputSchema: z.unknown(),
      handler: async (ctx) => getSiteSettingsDomain(ctx),
    },
    {
      id: 'save_settings',
      method: 'PATCH',
      path: '/settings',
      mcpToolName: 'save_settings',
      summary: 'Update site settings',
      scopes: [PERMISSIONS.settingsWrite],
      inputSchema: siteSettingsSaveBodySchema,
      mcpInputSchema: saveSettingsMcpSchema,
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx, input) =>
        saveSiteSettingsDomain(ctx, siteSettingsSaveBodySchema.parse(input)),
    },
    {
      id: 'list_audit',
      method: 'GET',
      path: '/audit',
      mcpToolName: 'list_audit_log',
      summary: 'List audit log entries',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: auditListQuerySchema,
      mcpInputSchema: auditListQuerySchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        listAuditLogDomain(
          ctx,
          parseAuditListInput(auditListQuerySchema.parse(input)),
        ),
    },
    {
      id: 'search_public',
      method: 'GET',
      path: '/public/search',
      mcpToolName: 'search_published_content',
      summary: 'Search published pages and posts',
      scopes: 'public',
      inputSchema: searchRouteSchema,
      mcpInputSchema: searchRouteSchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        searchPublishedContentDomain(ctx, searchRouteSchema.parse(input)),
    },
    {
      id: 'list_sql_templates',
      method: 'GET',
      path: '/sql-templates',
      mcpToolName: 'list_sql_templates',
      summary: 'List bundled SQL templates (read only)',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: emptyObjectSchema,
      mcpInputSchema: emptyObjectSchema,
      outputSchema: z.unknown(),
      handler: async (ctx) => listSqlTemplatesDomain(ctx),
    },
    {
      id: 'get_sql_template',
      method: 'GET',
      path: '/sql-templates/:id',
      mcpToolName: 'get_sql_template',
      summary: 'Get one SQL template body (read only)',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: sqlTemplateIdParamSchema,
      mcpInputSchema: getSqlTemplateMcpSchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        getSqlTemplateDomain(ctx, sqlTemplateIdParamSchema.parse(input)),
    },
    {
      id: 'list_users',
      method: 'GET',
      path: '/users',
      mcpToolName: 'list_users',
      summary: 'List users (admin)',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: usersListQuerySchema,
      mcpInputSchema: usersListQuerySchema,
      outputSchema: z.unknown(),
      handler: async (ctx, input) =>
        listUsersDomain(
          ctx,
          parseUsersListInput(usersListQuerySchema.parse(input)),
        ),
    },
    {
      id: 'invite_user',
      method: 'POST',
      path: '/users/invite',
      mcpToolName: 'invite_user',
      summary: 'Invite a user by email',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: inviteUserBodySchema,
      mcpInputSchema: inviteUserMcpSchema,
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx, input) =>
        inviteUserDomain(ctx, inviteUserBodySchema.parse(input)),
    },
    {
      id: 'update_user',
      method: 'PATCH',
      path: '/users/:userId',
      mcpToolName: 'update_user',
      summary: 'Update a user profile or role',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: updateUserBodySchema,
      mcpInputSchema: updateUserMcpSchema,
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx, input) => {
        const { userId } = userIdParamSchema.parse(input)
        return updateUserDomain(ctx, userId, updateUserBodySchema.parse(input))
      },
    },
    {
      id: 'deactivate_user',
      method: 'POST',
      path: '/users/:userId/deactivate',
      mcpToolName: 'deactivate_user',
      summary: 'Deactivate a user account',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: userIdParamSchema,
      mcpInputSchema: deactivateUserMcpSchema,
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx, input) => {
        const { userId } = userIdParamSchema.parse(input)
        return deactivateUserDomain(ctx, userId)
      },
    },
    {
      id: 'list_roles',
      method: 'GET',
      path: '/roles',
      mcpToolName: 'list_roles',
      summary: 'List roles and permissions (admin)',
      scopes: [PERMISSIONS.adminAccess],
      inputSchema: emptyObjectSchema,
      mcpInputSchema: emptyObjectSchema,
      outputSchema: z.unknown(),
      handler: async (ctx) => listRolesDomain(ctx),
    },
    {
      id: 'create_role',
      method: 'POST',
      path: '/roles',
      mcpToolName: 'create_role',
      summary: 'Create a custom role',
      scopes: [PERMISSIONS.rolesManage],
      inputSchema: createRoleBodySchema,
      mcpInputSchema: createRoleBodySchema.merge(mcpConfirmSchema),
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx, input) =>
        createRoleDomain(ctx, createRoleBodySchema.parse(input)),
    },
    {
      id: 'update_role',
      method: 'PATCH',
      path: '/roles/:roleCode',
      mcpToolName: 'update_role',
      summary: 'Update a custom role',
      scopes: [PERMISSIONS.rolesManage],
      inputSchema: roleCodeParamSchema.merge(updateRoleBodySchema),
      mcpInputSchema: roleCodeParamSchema
        .merge(updateRoleBodySchema)
        .merge(mcpConfirmSchema),
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx, input) => {
        const parsed = roleCodeParamSchema
          .merge(updateRoleBodySchema)
          .parse(input)
        const { roleCode, ...body } = parsed
        return updateRoleDomain(ctx, roleCode, body)
      },
    },
    {
      id: 'delete_role',
      method: 'DELETE',
      path: '/roles/:roleCode',
      mcpToolName: 'delete_role',
      summary: 'Delete a custom role',
      scopes: [PERMISSIONS.rolesManage],
      inputSchema: roleCodeParamSchema.merge(deleteRoleBodySchema),
      mcpInputSchema: roleCodeParamSchema
        .merge(deleteRoleBodySchema)
        .merge(mcpConfirmSchema),
      outputSchema: z.unknown(),
      destructive: true,
      handler: async (ctx, input) => {
        const parsed = roleCodeParamSchema
          .merge(deleteRoleBodySchema)
          .parse(input)
        const { roleCode, ...body } = parsed
        return deleteRoleDomain(ctx, roleCode, body)
      },
    },
  ]
}

export function matchDomainOperation(
  method: string,
  pathname: string,
): {
  operation: DomainOperation<unknown, unknown>
  params: Record<string, string>
} | null {
  const path = pathname.replace(/^\/api\/v1/, '') || '/'
  const operations = [...getDomainOperations()].sort(
    (a, b) => b.path.length - a.path.length,
  )
  for (const operation of operations) {
    if (operation.method !== method) {
      continue
    }
    const pattern = operation.path
    const paramNames: string[] = []
    const regex = new RegExp(
      `^${pattern.replace(/:([a-zA-Z]+)/g, (_, name) => {
        paramNames.push(name)
        return '([^/]+)'
      })}$`,
    )
    const match = path.match(regex)
    if (!match) {
      continue
    }
    const params: Record<string, string> = {}
    paramNames.forEach((name, index) => {
      params[name] = decodeURIComponent(match[index + 1] ?? '')
    })
    return { operation, params }
  }
  return null
}
