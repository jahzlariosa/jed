import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useRef, useState } from 'react'

import {
  removeAccountAvatarFn,
  updateAccountDisplayNameFn,
  uploadAccountAvatarFn,
} from '#/lib/account/account-fns'
import {
  AVATAR_INLINE_ERROR,
  validateAvatarFile,
} from '#/lib/account/avatar-validation'
import {
  AccountCard,
  AccountConfirmDialog,
} from '#/components/account/account-confirm-dialog'
import { AccountUserAvatar } from '#/components/account/account-user-avatar'
import { AvatarCropDialog } from '#/components/account/avatar-crop-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AccountProfileSection({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string | null
  email: string | null
  avatarUrl: string | null
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(displayName ?? '')
  const [photoUrl, setPhotoUrl] = useState(avatarUrl)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)

  const saveName = useServerFn(updateAccountDisplayNameFn)
  const uploadAvatar = useServerFn(uploadAccountAvatarFn)
  const removeAvatar = useServerFn(removeAccountAvatarFn)

  function onPickFile() {
    fileRef.current?.click()
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    const checked = validateAvatarFile(file)
    if (!checked.ok) {
      setError(checked.message)
      return
    }
    setError('')
    setCropFile(file)
    setCropOpen(true)
  }

  async function onSaveCrop(base64: string) {
    setPending(true)
    setError('')
    const result = await uploadAvatar({
      data: { imageBase64: base64, contentType: 'image/webp' },
    })
    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('avatarUrl' in result && result.avatarUrl) {
      setPhotoUrl(result.avatarUrl)
      setCropOpen(false)
      setCropFile(null)
      await router.invalidate()
    }
    setPending(false)
  }

  async function onSaveName() {
    setPending(true)
    setError('')
    const result = await saveName({ data: { displayName: name } })
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      await router.invalidate()
    }
    setPending(false)
  }

  async function onRemovePhoto() {
    setPending(true)
    const result = await removeAvatar()
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setPhotoUrl(null)
      setRemoveOpen(false)
      await router.invalidate()
    }
    setPending(false)
  }

  return (
    <AccountCard id="profile" title="Profile">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <AccountUserAvatar
          avatarUrl={photoUrl}
          displayName={name}
          email={email}
          dimmed={pending}
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onFileChange}
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={pending}
            onClick={onPickFile}
          >
            {pending ? 'Working...' : 'Change photo'}
          </Button>
          {photoUrl ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              disabled={pending}
              onClick={() => setRemoveOpen(true)}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <p className="account-label">JPG, PNG or WebP, up to 2 MB.</p>
      {error ? (
        <p role="alert" className="text-[15px] text-destructive">
          {error === AVATAR_INLINE_ERROR ? AVATAR_INLINE_ERROR : error}
        </p>
      ) : null}
      <div className="account-field-gap grid">
        <div className="grid gap-1.5">
          <Label htmlFor="display-name" className="account-label">
            Name
          </Label>
          <Input
            id="display-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 rounded-xl text-[18px]"
            maxLength={120}
          />
        </div>
        <Button
          type="button"
          className="w-fit rounded-xl"
          disabled={pending}
          onClick={() => void onSaveName()}
        >
          Save name
        </Button>
        <div className="grid gap-1.5">
          <Label htmlFor="account-email" className="account-label">
            Email
          </Label>
          <Input
            id="account-email"
            value={email ?? ''}
            readOnly
            className="h-12 rounded-xl bg-muted/40 text-[18px]"
          />
          <p className="text-[15px] account-muted">
            Email is managed by your sign-in provider and cannot be changed
            here.
          </p>
        </div>
      </div>
      <AvatarCropDialog
        file={cropFile}
        open={cropOpen}
        onOpenChange={setCropOpen}
        pending={pending}
        onSave={onSaveCrop}
      />
      <AccountConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Remove photo?"
        description="Your initials will show until you add a new one."
        primaryLabel="Remove"
        primaryVariant="destructive"
        secondaryLabel="Keep"
        pending={pending}
        onPrimary={onRemovePhoto}
      />
    </AccountCard>
  )
}
