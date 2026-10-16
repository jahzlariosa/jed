import { useServerFn } from '@tanstack/react-start'
import { useCallback } from 'react'

import {
  putFileToSignedUpload,
  validateAdminImageFile,
} from '#/lib/cms/admin-media-upload.client'
import { createMediaUploadFn, registerMediaFn } from '#/lib/cms/functions'
import { publicMediaUrl } from '#/lib/media/public-media-url'

export type AdminUploadedMedia = {
  url: string
  mediaId: string
  storagePath: string
}

export function useAdminMediaUpload() {
  const prepareUpload = useServerFn(createMediaUploadFn)
  const register = useServerFn(registerMediaFn)

  const uploadImage = useCallback(
    async (file: File): Promise<AdminUploadedMedia> => {
      const validationError = validateAdminImageFile(file)
      if (validationError) {
        throw new Error(validationError)
      }
      const prepared = await prepareUpload({
        data: {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          byteSize: file.size,
        },
      })
      if (!prepared.ok) {
        throw new Error(prepared.error ?? 'Upload failed')
      }
      const putError = await putFileToSignedUpload({
        signedUrl: prepared.signedUrl,
        token: prepared.token,
        mimeType: prepared.mimeType,
        file,
      })
      if (putError) {
        throw new Error(putError)
      }
      if (!('uploadTicket' in prepared) || !prepared.uploadTicket) {
        throw new Error('Upload failed')
      }
      const registered = await register({
        data: {
          filename: file.name,
          storagePath: prepared.storagePath,
          mimeType: prepared.mimeType,
          byteSize: prepared.byteSize,
          uploadTicket: prepared.uploadTicket,
        },
      })
      if ('error' in registered && registered.error) {
        throw new Error(registered.error)
      }
      if (!('id' in registered) || !registered.id) {
        throw new Error('Upload failed')
      }
      return {
        url: publicMediaUrl(prepared.storagePath),
        mediaId: registered.id,
        storagePath: prepared.storagePath,
      }
    },
    [prepareUpload, register],
  )

  return { uploadImage }
}
