import { StarterReveal } from '#/components/starter-docs/starter-reveal'
import type { FeatureSection } from '#/lib/starter-docs/parse-features'

function FeatureLinkButton({
  link,
  primary,
}: {
  link: { label: string; href: string }
  primary?: boolean
}) {
  const className = primary
    ? 'starter-btn starter-btn-primary starter-btn-lg'
    : 'starter-btn starter-btn-secondary starter-btn-lg'
  return (
    <a href={link.href} className={className}>
      {link.label}
    </a>
  )
}

function FeatureCodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="docs-code-wrap features-code-wrap">
      <div className="docs-code-head">
        <span className="docs-code-lang">{lang.toUpperCase()}</span>
      </div>
      <pre className="docs-code-body">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function FeaturesContent({ sections }: { sections: FeatureSection[] }) {
  return (
    <>
      {sections.map((section) => {
        if (section.kind === 'hero') {
          return (
            <section key="hero" className="starter-section">
              <div className="starter-wrap">
                <StarterReveal i={0}>
                  {section.eyebrow ? (
                    <p className="starter-eyebrow">{section.eyebrow}</p>
                  ) : null}
                </StarterReveal>
                <StarterReveal i={1}>
                  {section.headline ? (
                    <h1 className="starter-display">{section.headline}</h1>
                  ) : null}
                </StarterReveal>
                <StarterReveal i={2}>
                  {section.subhead ? (
                    <p className="starter-lead">{section.subhead}</p>
                  ) : null}
                </StarterReveal>
                <StarterReveal i={3}>
                  <div className="starter-hero-actions">
                    {section.primaryCta ? (
                      <FeatureLinkButton link={section.primaryCta} primary />
                    ) : null}
                    {section.secondaryCta ? (
                      <FeatureLinkButton link={section.secondaryCta} />
                    ) : null}
                  </div>
                </StarterReveal>
              </div>
            </section>
          )
        }
        if (section.kind === 'section') {
          const muted = section.title.length % 2 === 0
          return (
            <section
              key={`section-${section.title}`}
              className={`starter-section starter-feature-section${muted ? ' starter-section-muted' : ''}`}
            >
              <div className="starter-wrap">
                <StarterReveal i={0}>
                  <h2>{section.title}</h2>
                </StarterReveal>
                {section.paragraphs.map((paragraph) => (
                  <StarterReveal key={paragraph} i={1}>
                    <p>{paragraph}</p>
                  </StarterReveal>
                ))}
                {section.links.length > 0 ? (
                  <StarterReveal i={2}>
                    <div className="starter-feature-links">
                      {section.links.map((link) => (
                        <a key={link.href} href={link.href}>
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </StarterReveal>
                ) : null}
                {section.codeBlocks.map((block) => (
                  <StarterReveal key={block.code} i={3}>
                    <FeatureCodeBlock lang={block.lang} code={block.code} />
                  </StarterReveal>
                ))}
              </div>
            </section>
          )
        }
        return (
          <section key="cta" className="starter-section !min-h-0 py-16">
            <div className="starter-wrap">
              <StarterReveal i={0}>
                <div className="starter-cta-band">
                  <div>
                    {section.headline ? <h2>{section.headline}</h2> : null}
                    {section.body ? <p>{section.body}</p> : null}
                  </div>
                  {section.button ? (
                    <FeatureLinkButton link={section.button} primary />
                  ) : null}
                </div>
              </StarterReveal>
            </div>
          </section>
        )
      })}
    </>
  )
}
