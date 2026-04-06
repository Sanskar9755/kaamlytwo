tgg# Implementation Plan: Real-Time Chat

## Overview

Integrate Socket.io into the existing Express backend, add `conversations` and `messages` tables to SQLite, expose REST endpoints for chat, and build `InboxPage` + `ChatPage` in React. The frontend uses `socket.io-client` for real-time delivery and the existing `apiClient` for REST calls.

## Tasks

- [x] 1. Add conversations and messages tables to the database
  - In `KaamlyTwo/backend/src/db/init.js`, append the `conversations` and `messages` CREATE TABLE statements plus their indexes to the existing `db.exec()` call
  - Schema: `conversations(id, customer_id, worker_id, created_at, updated_at)` with UNIQUE(customer_id, worker_id)
  - Schema: `messages(id, conversation_id, sender_id, type, content, photo_path, is_read, created_at)`
  - Add indexes: `idx_messages_conversation`, `idx_conversations_customer`, `idx_conversations_worker`
  - _Requirements: 1.2, 4.2_

- [ ] 2. Install backend and frontend packages
  - [x] 2.1 Install `socket.io` and `multer` in `KaamlyTwo/backend` (run `npm install socket.io multer`)
    - _Requirements: 2.1, 3.1_
  - [x] 2.2 Install `socket.io-client` in `KaamlyTwo/frontend` (run `npm install socket.io-client`)
    - _Requirements: 2.1_

- [ ] 3. Create socket auth middleware
  - Create `KaamlyTwo/backend/src/middleware/socketAuth.js`
  - Read `socket.handshake.auth.token`, verify with `jwt.verify()` using `process.env.JWT_SECRET`
  - On success attach `socket.user = { id, role }` and call `next()`
  - On failure call `next(new Error('Authentication error'))`
  - _Requirements: 6.1, 6.2_

  - [ ]* 3.1 Write property test for socket auth rejection (Property 11)
    - **Property 11: Socket Authentication Rejects Invalid JWT**
    - Generate invalid tokens (empty string, random strings, expired tokens) using `fast-check`, attempt socket connect for each, assert connection is rejected
    - **Validates: Requirements 6.1, 6.2**

- [x] 4. Create socket server
  - Create `KaamlyTwo/backend/src/socket/index.js` exporting `initSocketServer(io)`
  - Apply `io.use(socketAuthMiddleware)` from step 3
  - Handle `connection` event; inside register:
    - `join_conversation`: verify user is `customer_id` or `worker_id` of the conversation, then `socket.join('conv_' + conversationId)`
    - `send_message`: validate content (non-empty, ≤ 2000 chars), verify participant, INSERT into `messages`, UPDATE `conversations.updated_at`, emit `new_message` to room
    - `mark_read`: UPDATE `messages SET is_read=1` where `conversation_id=? AND sender_id != ?`
  - Emit `error` event back to sender on auth/validation failures
  - _Requirements: 2.2, 2.3, 2.5, 2.6, 5.4, 6.3, 6.4_

  - [ ]* 4.1 Write property test for message persistence round-trip (Property 2)
    - **Property 2: Message Persistence Round-Trip**
    - Generate random valid text messages, send via socket, query DB, assert all fields match
    - **Validates: Requirements 2.2, 4.2**

  - [ ]* 4.2 Write property test for whitespace/length validation (Property 3)
    - **Property 3: Whitespace and Length Validation**
    - Generate whitespace-only strings and strings > 2000 chars, assert `error` event emitted; generate valid strings, assert `new_message` emitted
    - **Validates: Requirements 2.5, 2.6**

  - [ ]* 4.3 Write property test for per-message authorization (Property 12)
    - **Property 12: Per-Message Authorization**
    - Generate `send_message` events from users not in the conversation, assert `error` event emitted and no DB row created
    - **Validates: Requirements 6.3, 6.4**

- [x] 5. Create chat REST routes
  - Create `KaamlyTwo/backend/src/routes/chat.js`
  - `POST /conversations`: INSERT OR IGNORE into `conversations`, SELECT the row, return `{ conversation }`
  - `GET /conversations`: JOIN with `profiles` and `messages` to build inbox list; include `other_user`, `last_message`, `unread_count`; ORDER BY `conversations.updated_at DESC`
  - `GET /conversations/:id/messages`: verify participant, SELECT messages with `?before=<id>&limit=50` pagination, ORDER BY `created_at ASC`
  - `POST /conversations/:id/messages/photo`: multer upload (JPEG/PNG/GIF/WebP, max 5MB), INSERT message with `type='image'`, emit `new_message` via `io`
  - Return 404 if conversation not found, 422 for validation errors, 401 if not participant
  - _Requirements: 1.2, 1.3, 3.1, 3.4, 3.5, 4.1, 4.4, 5.1, 5.2, 5.3_

  - [ ]* 5.1 Write property test for conversation idempotence (Property 1)
    - **Property 1: Conversation Idempotence**
    - Generate random (customerId, workerId) pairs, call POST /conversations N times, assert same ID returned and exactly 1 DB row
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 5.2 Write property test for message history ordering (Property 6)
    - **Property 6: Message History Ordering**
    - Generate conversations with random message sets, fetch history, assert ascending `created_at` order
    - **Validates: Requirements 4.1**

  - [ ]* 5.3 Write property test for pagination limit (Property 7)
    - **Property 7: Pagination Limit**
    - Generate conversations with > 50 messages, fetch one page, assert result length ≤ 50
    - **Validates: Requirements 4.4**

  - [ ]* 5.4 Write property test for inbox ordering (Property 8)
    - **Property 8: Inbox Ordering**
    - Generate users with multiple conversations at random timestamps, fetch inbox, assert descending `updated_at` order
    - **Validates: Requirements 5.1**

  - [ ]* 5.5 Write property test for inbox data completeness (Property 9)
    - **Property 9: Inbox Data Completeness**
    - Generate random conversations, fetch inbox, assert each item has `name`, `photo_url`, `last_message`, `unread_count` fields
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 5.6 Write property test for unread count round-trip (Property 10)
    - **Property 10: Unread Count Round-Trip**
    - Generate conversations with unread messages, assert `unread_count > 0`; emit `mark_read`, re-fetch inbox, assert `unread_count === 0`
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 5.7 Write property test for file upload validation (Property 5)
    - **Property 5: File Upload Validation**
    - Generate random MIME types and file sizes, assert 422 for invalid types or files > 5MB, assert success for valid inputs
    - **Validates: Requirements 3.4, 3.5**

- [x] 6. Update backend index.js
  - In `KaamlyTwo/backend/src/index.js`:
    - Add `const http = require('http')` and `const { Server } = require('socket.io')`
    - Replace `app.listen(PORT, ...)` with `const httpServer = http.createServer(app)` + `httpServer.listen(PORT, ...)`
    - Instantiate `const io = new Server(httpServer, { cors: { origin: [...], credentials: true } })` matching existing CORS origins
    - Call `initSocketServer(io)` from `./socket/index.js`
    - Mount `app.use('/api/chat', authMiddleware, require('./routes/chat'))` — pass `io` to the chat router so photo upload can emit events
  - _Requirements: 2.2, 3.2_

- [ ] 7. Checkpoint — backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create frontend types
  - Create `KaamlyTwo/frontend/src/types/chat.ts`
  - Export `Conversation` interface: `{ id, other_user: { id, name, photo_url }, last_message, unread_count, updated_at }`
  - Export `Message` interface: `{ id, conversation_id, sender_id, type, content, photo_url, is_read, created_at }`
  - _Requirements: 2.3, 5.2_

- [x] 9. Create frontend chat service
  - Create `KaamlyTwo/frontend/src/services/chatService.ts`
  - Use existing `apiClient` (axios instance from `src/lib/axios.ts`)
  - Export: `createOrGetConversation(workerId)`, `getConversations()`, `getMessages(conversationId, before?, limit?)`, `uploadPhoto(conversationId, file)`
  - _Requirements: 1.2, 4.1, 4.4, 5.1_

- [x] 10. Create frontend socket client
  - Create `KaamlyTwo/frontend/src/socket/chatSocket.ts`
  - Singleton `io()` instance connecting to `import.meta.env.VITE_API_URL` with `auth: { token: localStorage.getItem('token') }`
  - Export: `connect()`, `disconnect()`, `joinConversation(id)`, `sendMessage(conversationId, content)`, `onNewMessage(cb)`, `offNewMessage(cb)`, `markRead(conversationId)`
  - Do not auto-connect on import; call `connect()` explicitly from pages
  - _Requirements: 2.1, 2.4, 6.1, 7.2_

- [x] 11. Create InboxPage
  - Create `KaamlyTwo/frontend/src/pages/InboxPage.tsx`
  - On mount call `getConversations()`, render list of conversation rows
  - Each row: other user's avatar/initials, name, last message preview, unread badge, relative timestamp
  - Clicking a row navigates to `/chat/:conversationId`
  - Empty state: show "Abhi koi conversation nahi hai." message
  - Match existing inline-style design language (purple gradient header, white cards, border-radius)
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 12. Create ChatPage
  - Create `KaamlyTwo/frontend/src/pages/ChatPage.tsx`
  - On mount: call `getMessages(conversationId)` to load history, call `chatSocket.connect()` + `joinConversation(conversationId)`, call `markRead`
  - Register `onNewMessage` listener; append incoming messages to state
  - Render messages list (own messages right-aligned, other left-aligned); `type='image'` renders `<img>` inline
  - Text input + send button; photo file input with preview
  - Connection status: yellow banner on `disconnect`, red banner after 3 failed reconnect attempts
  - On unmount: call `offNewMessage`, `chatSocket.disconnect()`
  - _Requirements: 2.3, 2.4, 3.3, 4.1, 4.3, 5.4, 7.1, 7.3, 7.4_

  - [ ]* 12.1 Write property test for photo message rendering (Property 4)
    - **Property 4: Photo Message Renders Inline**
    - Generate random Message objects with `type='image'` and non-null `photo_url`, render with the message renderer component, assert `<img src=...>` is present
    - **Validates: Requirements 3.3**

  - [ ]* 12.2 Write unit tests for ChatPage connection state UI
    - Test: disconnection banner appears on socket `disconnect` event
    - Test: red banner appears after 3 failed reconnect attempts
    - Test: empty inbox state renders correct message in InboxPage
    - _Requirements: 7.1, 7.4, 5.5_

- [x] 13. Update CustomerSearchPage and App.tsx routes
  - In `KaamlyTwo/frontend/src/pages/CustomerSearchPage.tsx`: update the "Contact Karo" button `onClick` to call `createOrGetConversation(worker.user_id)` then `navigate('/chat/' + conversation.id)`; show inline error if the call fails
  - In `KaamlyTwo/frontend/src/App.tsx`: import `InboxPage` and `ChatPage`; add both routes inside `<ProtectedRoute>` + `<ProfileCompletionGuard>`:
    ```tsx
    <Route path="/inbox" element={<InboxPage />} />
    <Route path="/chat/:conversationId" element={<ChatPage />} />
    ```
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` and must run ≥ 100 iterations each
- Each property test must include the comment: `// Feature: real-time-chat, Property <N>: <property_text>`
- The `io` instance must be passed into the chat router (or accessed via `app.get('io')`) so the photo upload endpoint can emit `new_message` events
- All error messages follow the existing Hinglish pattern used in the codebase
