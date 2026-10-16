import { Check, Copy } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'

export function DocsMarkdown({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const iconRoots = useRef<Root[]>([])

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-bind copy UI when article HTML changes
  useEffect(() => {
    const root = ref.current
    if (!root) {
      return
    }

    for (const existing of iconRoots.current) {
      existing.unmount()
    }
    iconRoots.current = []

    for (const button of root.querySelectorAll<HTMLButtonElement>(
      '.docs-code-copy',
    )) {
      const iconMount = document.createElement('span')
      iconMount.className = 'docs-code-copy-icon'
      iconMount.setAttribute('aria-hidden', 'true')
      const label = button.querySelector('.docs-code-copy-label')
      if (label) {
        button.insertBefore(iconMount, label)
      } else {
        button.prepend(iconMount)
      }
      const iconRoot = createRoot(iconMount)
      iconRoot.render(<Copy size={16} weight="regular" />)
      iconRoots.current.push(iconRoot)
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }
      const button = target.closest<HTMLButtonElement>('.docs-code-copy')
      if (!button) {
        return
      }
      const b64 = button.dataset.copyB64
      if (!b64) {
        return
      }
      let text = ''
      try {
        text = atob(b64)
      } catch {
        return
      }
      const block = button.closest('.docs-code-block')
      const live = block?.querySelector<HTMLElement>('.docs-copy-live')
      const label = button.querySelector('.docs-code-copy-label')
      const iconMount = button.querySelector('.docs-code-copy-icon')

      void navigator.clipboard.writeText(text).then(() => {
        button.classList.add('is-copied')
        if (label) {
          label.textContent = 'Copied'
        }
        if (live) {
          live.textContent = 'Copied to clipboard'
        }
        if (iconMount) {
          const iconRoot = createRoot(iconMount)
          iconRoot.render(<Check size={16} weight="regular" />)
          iconRoots.current.push(iconRoot)
        }
        window.setTimeout(() => {
          button.classList.remove('is-copied')
          if (label) {
            label.textContent = 'Copy'
          }
          if (live) {
            live.textContent = ''
          }
          if (iconMount) {
            const iconRoot = createRoot(iconMount)
            iconRoot.render(<Copy size={16} weight="regular" />)
            iconRoots.current.push(iconRoot)
          }
        }, 2000)
      })
    }

    root.addEventListener('click', onClick)
    return () => {
      root.removeEventListener('click', onClick)
      for (const iconRoot of iconRoots.current) {
        iconRoot.unmount()
      }
      iconRoots.current = []
    }
  }, [html])

  return (
    <div
      ref={ref}
      className="docs-article-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
