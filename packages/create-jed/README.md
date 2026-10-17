# create-jed

Scaffold a new [JED](https://github.com/jahzlariosa/jed) client site from the public GitHub template. No `git clone` required.

## Usage

```bash
npm create jed@latest my-site
```

Also supported:

```bash
npx create-jed my-site
pnpm create jed my-site
yarn create jed my-site
bun create jed my-site
```

### Options

| Flag | Description |
|------|-------------|
| `--name <site name>` | Public site name (default: folder name) |
| `--pm <npm\|pnpm\|yarn\|bun>` | Package manager (default: detect from npm user agent) |
| `--no-install` | Skip dependency install |
| `--no-git` | Skip `git init` |
| `--yes` | Non-interactive defaults |
| `--ref <branch\|tag>` | GitHub ref for the template tarball (default: `main`) |
| `--force` | Overwrite a non-empty target folder |
| `--help` | Show help |
| `--version` | Show version |

## What it does

1. Downloads `https://codeload.github.com/jahzlariosa/jed/tar.gz/<ref>`
2. Strips repo-only paths (`packages/`, `.cursor/`, the publish workflow)
3. Sets `package.json` `name`, `version` `0.1.0`, `private: true`
4. Copies `.env.example` to `.env.local` (no secrets written)
5. Sets the default public site name in `src/lib/cms/brand-defaults.ts`, SEO defaults, and neutral migration SQL
6. Optionally installs dependencies and runs `git init`

## Publishing (maintainers)

Publishing is tag-driven from GitHub Actions. **Do not publish manually from a laptop unless you are debugging.**

1. Add an npm automation token as the repository secret `NPM_TOKEN` (Granular Access Token with publish rights on `create-jed`).
2. Bump `version` in `packages/create-jed/package.json` if needed.
3. Push a tag:

```bash
git tag create-jed@1.0.0
git push origin create-jed@1.0.0
```

The workflow `.github/workflows/publish-create-jed.yml` runs `npm publish --provenance` from `packages/create-jed`.

## License

MIT
