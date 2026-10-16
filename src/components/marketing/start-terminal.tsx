import { Check, Copy } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const START_COMMANDS = [
  'git clone https://github.com/jahzlariosa/jed.git my-site',
  'cd my-site',
  'npm ci',
] as const

export function StartTerminal() {
  const [copied, setCopied] = useState(false)
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetRef.current) {
        clearTimeout(resetRef.current)
      }
    }
  }, [])

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(START_COMMANDS.join('\n'))
      setCopied(true)
      if (resetRef.current) {
        clearTimeout(resetRef.current)
      }
      resetRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-6">
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 text-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-10 items-center justify-between border-b border-white/10 px-4">
          <span className="text-xs text-zinc-400">Terminal</span>
          <TooltipProvider>
            <Tooltip open={copied}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-zinc-400 hover:bg-white/10 hover:text-zinc-50"
                  aria-label="Copy commands"
                  onClick={() => void onCopy()}
                >
                  {copied ? (
                    <Check {...phosphorIcon} size={16} />
                  ) : (
                    <Copy {...phosphorIcon} size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copied</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <pre className="start-terminal-body overflow-x-auto whitespace-pre px-4 py-4 font-mono text-[13px] leading-6 sm:text-sm">
          {START_COMMANDS.map((command) => (
            <div key={command}>
              <span className="select-none text-zinc-500">$ </span>
              {command}
            </div>
          ))}
        </pre>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Then follow the{' '}
        <Link
          to="/docs/$slug"
          params={{ slug: 'getting-started' }}
          className="text-foreground underline underline-offset-4"
        >
          setup guide
        </Link>{' '}
        in the docs
      </p>
    </div>
  )
}
