export function publicMediaUrl(storagePath: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL ?? ''
  const path = storagePath.replace(/^\/+/, '')
  return `${base}/storage/v1/object/public/media/${path}`
}
