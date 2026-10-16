// shadcn's `components.json` points `aliases.utils` at `@/lib/utils`. The helper itself is the
// official `cn` package (shadcn CLI 4.x installs it), so re-export it here.
export { cn } from 'cn'
