# Build Progress

## Done and verified

**Backend** (type-checks pass, boot smoke-tested against a real Redis):

- [x] Monorepo scaffold (npm workspaces, shared tsconfig)
- [x] `packages/shared`: enums, DTOs, full Socket.IO event contract, API envelope types
- [x] Mongo models: User, RefreshToken, Conversation (dedup via unique `directKey`), ConversationMember, Message — all indexed per spec
- [x] Auth: register/login/refresh/logout/me, argon2id hashing, JWT access+refresh, refresh rotation with theft detection, httpOnly cookie
- [x] REST API: auth, users (search/profile/get), conversations (direct+group, members, roles, read receipts), messages (send/edit/delete/react/paginate), uploads, search
- [x] Socket.IO: JWT-authenticated connections, per-conversation rooms, Redis-backed multi-device presence, typing indicators with auto-stop, real-time message send/ack/edit/delete/react/read
- [x] Redis adapter wired for horizontal scaling
- [x] Centralized error handling, structured logging with secret redaction, rate limiting, Helmet/CORS
- [x] Seed script (4 demo users, 1 direct + 1 group conversation with messages)
- [x] Test suite: auth flows, conversation dedup/roles, message CRUD/pagination/authorization, WebSocket connection/presence/typing/broadcast (written and type-checked; **not execution-verified in this sandbox** because `mongodb-memory-server`'s binary download is blocked by this environment's network allow-list — will run normally wherever `fastdl.mongodb.org` is reachable, e.g. your machine or a normal CI runner)
- [x] `docker-compose.yml` for local Mongo + Redis

**Frontend** (type-checks pass, production `vite build` succeeds, dev server verified serving on :5173):

- [x] Vite + React + TS + Tailwind scaffold, design tokens (pine/amber/ink palette, Fraunces + Inter + IBM Plex Mono), dark/light mode with persisted preference
- [x] Auth pages: login, register, Zod validation, inline server-error display
- [x] Session bootstrap on hard reload (trades the httpOnly refresh cookie for a fresh access token; access token itself lives only in memory, never localStorage)
- [x] Axios client with automatic 401 → refresh → retry, coalesced across concurrent requests
- [x] Three-column app shell: sidebar (search, favorites/groups/DMs sections, new chat / create group), chat window, collapsible details panel; mobile drawer sidebar
- [x] Socket.IO client wired through one central `useSocketSync` hook mapping every server event to React Query cache / Zustand store updates
- [x] Chat list: avatar with signature presence ring, unread badges, last-message preview, relative timestamps
- [x] Chat window: cursor-based infinite scroll-up pagination with scroll-position preservation, grouped consecutive messages, reply preview with jump-to-original, hover action menu (react/reply/edit/delete), quick-reaction picker, delivery-state ticks (sending/sent/delivered/read/failed with retry)
- [x] Optimistic send: client-generated `clientTempId`, immediate local render, reconciled on `message:ack`, `message:failed` flips to a retryable state
- [x] Composer: Enter to send / Shift+Enter for newline, debounced typing:start/stop with auto-stop safety net, drag-and-drop file upload, paste-image upload, upload progress
- [x] Typing indicator line ("X is typing…" / "X and Y are typing…")
- [x] New-chat and create-group dialogs with live user search
- [x] Group details panel: member list with roles, add/remove members (role-gated), leave group
- [x] Reconnect banner ("Reconnecting…" / offline notice)
- [x] Toast notifications for messages arriving outside the active conversation
- [x] Settings page: name/status editing, theme toggle
- [x] Accessible dialogs (focus on open, Escape to close, `role="dialog"`), visible focus rings app-wide, `prefers-reduced-motion` respected, presence never conveyed by color alone (always paired with a text label/title)

## Outstanding / known gaps

- [ ] Live end-to-end verification against a real MongoDB (blocked in this sandbox only — `fastdl.mongodb.org` isn't reachable here; will work on your machine)
- [ ] Full-text message search UI (backend endpoint `/api/search/messages` exists; no frontend page consumes it yet)
- [ ] Command palette (Ctrl/Cmd+K) — noted in the spec, not yet built
- [ ] Full-screen image lightbox viewer (images currently open in a new tab)
- [ ] Message virtualization for very long histories (pagination works; a virtualized list for thousands of rendered DOM nodes is not yet in place)
- [ ] Promote/demote admin UI (backend `PATCH /members/:userId` role endpoint exists; not wired into the details panel yet)
- [ ] Dockerfile for the API itself (compose currently covers Mongo/Redis only, per the spec's "Node app may run outside Docker during development")
- [ ] Browser tab title unread-count updates

