export type FeaturesApiTab = 'rest' | 'mcp'

export const FEATURES_API_SAMPLES: Record<FeaturesApiTab, string> = {
  rest: `curl -H "Authorization: Bearer $TOKEN" \\
  https://example.com/api/v1/posts`,
  mcp: `{
  "mcpServers": {
    "jed": {
      "url": "https://example.com/api/mcp",
      "headers": {
        "Authorization": "Bearer $TOKEN"
      }
    }
  }
}`,
}

export function FeaturesApiCodeBody({
  tab = 'rest',
}: {
  tab?: FeaturesApiTab
}) {
  return (
    <pre className="features-code-body" id="features-api-panel">
      <code>{tab === 'rest' ? <RestSample /> : <McpSample />}</code>
    </pre>
  )
}

function RestSample() {
  return (
    <>
      <span className="features-code-cmd">curl</span> -H{' '}
      <span className="features-code-str">
        &quot;Authorization: Bearer $TOKEN&quot;
      </span>{' '}
      \{'\n'}
      {'  '}
      <span className="features-code-str">
        https://example.com/api/v1/posts
      </span>
    </>
  )
}

function McpSample() {
  return (
    <>
      {'{'}
      {'\n'}
      {'  '}
      <span className="features-code-key">&quot;mcpServers&quot;</span>: {'{'}
      {'\n'}
      {'    '}
      <span className="features-code-key">&quot;jed&quot;</span>: {'{'}
      {'\n'}
      {'      '}
      <span className="features-code-key">&quot;url&quot;</span>:{' '}
      <span className="features-code-str">
        &quot;https://example.com/api/mcp&quot;
      </span>
      ,{'\n'}
      {'      '}
      <span className="features-code-key">&quot;headers&quot;</span>: {'{'}
      {'\n'}
      {'        '}
      <span className="features-code-key">&quot;Authorization&quot;</span>:{' '}
      <span className="features-code-str">&quot;Bearer $TOKEN&quot;</span>
      {'\n'}
      {'      '}
      {'}'}
      {'\n'}
      {'    '}
      {'}'}
      {'\n'}
      {'  '}
      {'}'}
      {'\n'}
      {'}'}
    </>
  )
}

export function FeaturesApiTabs({
  tab,
  onSelect,
}: {
  tab: FeaturesApiTab
  onSelect?: (tab: FeaturesApiTab) => void
}) {
  return (
    <div className="features-code-tabs" role="tablist" aria-label="API sample">
      {(['rest', 'mcp'] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={tab === value}
          aria-controls="features-api-panel"
          className="features-code-tab"
          onClick={() => onSelect?.(value)}
        >
          {value === 'rest' ? 'REST' : 'MCP'}
        </button>
      ))}
    </div>
  )
}

export function FeaturesApiCodeStatic() {
  return (
    <div className="features-code-block">
      <div className="features-code-head">
        <FeaturesApiTabs tab="rest" />
      </div>
      <FeaturesApiCodeBody />
    </div>
  )
}
