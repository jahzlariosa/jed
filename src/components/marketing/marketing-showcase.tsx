const MCP_SAMPLE = `{
  "mcpServers": {
    "jed": {
      "url": "https://site.example/api/mcp",
      "headers": {
        "Authorization": "Bearer amn_..."
      }
    }
  }
}`

export function MarketingShowcase() {
  return (
    <section className="border-b border-border" aria-label="Product preview">
      <div className="marketing-showcase-grid">
        <div className="marketing-sc-card">
          <h3>Admin dashboard</h3>
          <div className="marketing-mini">
            <div className="marketing-mini-sidebar">
              <div className="marketing-mini-nav" aria-hidden>
                <span className="on" />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="p-2">
                <p className="mb-2 text-xs font-semibold">Dashboard</p>
                <div className="marketing-mini-row">
                  <span>Spring update</span>
                  <span className="marketing-mini-badge">Published</span>
                </div>
                <div className="marketing-mini-row">
                  <span>Services</span>
                  <span className="marketing-mini-badge marketing-mini-badge-muted">
                    Draft
                  </span>
                </div>
                <div className="marketing-mini-row">
                  <span>About</span>
                  <span className="marketing-mini-badge">Published</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="marketing-sc-card">
          <h3>Writing desk</h3>
          <div className="marketing-mini">
            <div className="marketing-mini-bar">
              <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              <span className="text-[11px] text-muted-foreground">About</span>
              <span className="ml-auto text-[10px] text-muted-foreground">
                Saved 8s ago
              </span>
            </div>
            <div className="marketing-mini-body">
              <p className="mb-2 text-base font-semibold tracking-tight">
                About
              </p>
              <p className="text-muted-foreground leading-snug">
                We help teams ship branded sites from one reusable starter.
              </p>
              <p className="mt-2.5 text-muted-foreground/60">
                Type / for blocks
              </p>
            </div>
          </div>
        </div>
        <div className="marketing-sc-card">
          <h3>API token</h3>
          <div className="marketing-mini">
            <div className="marketing-mini-body">
              <div className="marketing-mini-field">
                <span className="block text-[10.5px] text-muted-foreground mb-0.5">
                  Name
                </span>
                <div className="marketing-mini-box">Studio deploy</div>
              </div>
              <div className="marketing-mini-field">
                <span className="block text-[10.5px] text-muted-foreground mb-0.5">
                  Expires in days
                </span>
                <div className="marketing-mini-box">90</div>
              </div>
              <div className="marketing-mini-row border-0 pt-1">
                <span className="font-mono text-[10.5px]">amn_k9f2...</span>
                <span className="marketing-mini-badge">Active</span>
              </div>
              <span className="marketing-btn-brand mt-2 inline-flex h-7 px-2.5 text-[11.5px]">
                Create token
              </span>
            </div>
          </div>
        </div>
        <div className="marketing-sc-card">
          <h3>MCP config</h3>
          <div className="marketing-mini">
            <pre className="marketing-mini-code">{MCP_SAMPLE}</pre>
          </div>
        </div>
        <div className="marketing-sc-card">
          <h3>Auth card</h3>
          <div className="marketing-mini-auth">
            <h4>Sign in</h4>
            <p>Email and password to open the workspace.</p>
            <div className="marketing-mini-box mb-1.5 h-7">you@example.com</div>
            <div className="marketing-mini-box mb-1.5 h-7">********</div>
            <div className="marketing-mini-auth-btn">Sign in</div>
          </div>
        </div>
        <div className="marketing-sc-card">
          <h3>Settings tabs</h3>
          <div className="marketing-mini">
            <div className="marketing-mini-tabs" aria-hidden>
              <span className="on">General</span>
              <span>Branding</span>
              <span>SEO</span>
              <span>Domains</span>
            </div>
            <div className="marketing-mini-body pt-0">
              <div className="marketing-mini-field">
                <span className="block text-[10.5px] text-muted-foreground mb-0.5">
                  Site name
                </span>
                <div className="marketing-mini-box">JED</div>
              </div>
              <div className="marketing-mini-field">
                <span className="block text-[10.5px] text-muted-foreground mb-0.5">
                  Timezone
                </span>
                <div className="marketing-mini-box">Asia/Manila</div>
              </div>
              <div className="mt-1 flex justify-end gap-1.5">
                <span className="marketing-btn-ghost-sm h-[26px] text-[11px]">
                  Discard
                </span>
                <span className="marketing-btn-brand h-[26px] px-2.5 text-[11px]">
                  Save
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
