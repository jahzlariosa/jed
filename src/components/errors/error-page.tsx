import type { ReactNode } from 'react'

export function ErrorPage({
  code,
  title,
  description,
  children,
}: {
  code: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-card px-6 py-16 text-card-foreground">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-xs tracking-widest text-muted-foreground">
          {code}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      </div>
    </main>
  )
}
