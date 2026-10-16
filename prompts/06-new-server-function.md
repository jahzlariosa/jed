# New createServerFn

Read `AGENTS.md` → TanStack Start, Security.

1. `createServerFn({ method: 'POST' | 'GET' })` with `.validator()` for all inputs.
2. Auth inside `.handler()`: `requireUser()` / `requirePermission()`; IDOR checks after parse.
3. `markPrivateNoStore()` for session/tenant data; return DTOs only.
4. No secrets or `*.server.ts` imports in client modules.
5. Colocate tests for security-critical validators next to the code.
