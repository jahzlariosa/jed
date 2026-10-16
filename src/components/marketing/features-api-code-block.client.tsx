import { Copy } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  FEATURES_API_SAMPLES,
  FeaturesApiCodeBody,
  FeaturesApiTabs,
  type FeaturesApiTab,
} from '#/components/marketing/features-api-code-static'

export function FeaturesApiCodeBlock() {
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<FeaturesApiTab>('rest')
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetRef.current) {
        clearTimeout(resetRef.current)
      }
    }
  }, [])

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(FEATURES_API_SAMPLES[tab])
      setCopied(true)
      if (resetRef.current) {
        clearTimeout(resetRef.current)
      }
      resetRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [tab])

  return (
    <div className="features-code-block">
      <div className="features-code-head">
        <FeaturesApiTabs tab={tab} onSelect={setTab} />
        <button
          type="button"
          className={`features-code-copy${copied ? ' is-copied' : ''}`}
          onClick={() => void onCopy()}
          aria-label={copied ? 'Copied' : 'Copy code sample'}
        >
          <Copy size={16} weight="regular" aria-hidden />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <FeaturesApiCodeBody tab={tab} />
    </div>
  )
}
