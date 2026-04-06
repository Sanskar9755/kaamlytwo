# Requirements Document

## Introduction

This feature adds real-time chat to KaamlyTwo, allowing customers and workers to exchange text messages and photos directly within the app. When a customer clicks "Contact Karo" on a WorkerCard, a chat page opens between that customer and the selected worker. Messages are delivered in real-time via Socket.io without page refresh, and full chat history is persisted in the SQLite database. Both parties can view all their conversations in an inbox/chat list.

## Glossary

- **Chat_System**: The combined backend and frontend components that handle messaging.
- **Conversation**: A unique, persistent thread between exactly one customer and one worker.
- **Message**: A single unit of communication within a Conversation, containing either text or a photo.
- **Inbox**: The list of all Conversations for a given authenticated user, sorted by most recent activity.
- **Socket_Server**: The Socket.io server integrated into the KaamlyTwo Express backend.
- **Chat_Client**: The Socket.io client running in the React frontend.
- **Sender**: The authenticated user who sends a Message.
- **Recipient**: The other participant in a Conversation.
- **JWT**: The JSON Web Token used to authenticate users, stored in localStorage.
- **Multer**: The existing file-upload middleware used for handling photo uploads.

---

## Requirements

### Requirement 1: Initiate a Conversation

**User Story:** As a customer, I want to open a chat with a worker by clicking "Contact Karo", so that I can discuss work details without leaving the app.

#### Acceptance Criteria

1. WHEN a customer clicks "Contact Karo" on a WorkerCard, THE Chat_System SHALL navigate the customer to a chat page for the Conversation between that customer and the selected worker.
2. WHEN a Conversation between a customer and a worker does not yet exist, THE Chat_System SHALL create a new Conversation record in the database before opening the chat page.
3. WHEN a Conversation between a customer and a worker already exists, THE Chat_System SHALL open the existing Conversation without creating a duplicate.
4. THE Chat_System SHALL allow a worker to initiate a Conversation with a customer from the worker's Inbox.

---

### Requirement 2: Send and Receive Text Messages in Real-Time

**User Story:** As a user, I want to send and receive text messages instantly, so that I can communicate without refreshing the page.

#### Acceptance Criteria

1. WHEN an authenticated user submits a text message in an open Conversation, THE Chat_Client SHALL emit the message to the Socket_Server without a page reload.
2. WHEN the Socket_Server receives a message event, THE Chat_System SHALL persist the Message to the database and emit it to all participants of that Conversation.
3. WHEN a Message is emitted to a Conversation participant, THE Chat_Client SHALL display the new Message in the chat view within 500ms of the Socket_Server receiving it.
4. WHILE a user is connected to a Conversation, THE Chat_Client SHALL display incoming messages from the Recipient in real-time without requiring any user action.
5. IF a text message body is empty or contains only whitespace, THEN THE Chat_System SHALL reject the message and return a validation error.
6. THE Chat_System SHALL support message text up to 2000 characters in length.

---

### Requirement 3: Send and Receive Photo Messages

**User Story:** As a user, I want to send photos in a chat, so that I can share images related to the work.

#### Acceptance Criteria

1. WHEN an authenticated user selects a photo and submits it in an open Conversation, THE Chat_System SHALL upload the photo via the REST API using Multer and persist a Message with the photo URL.
2. WHEN a photo Message is persisted, THE Chat_System SHALL emit a real-time event to all Conversation participants containing the photo URL.
3. WHEN the Chat_Client receives a photo message event, THE Chat_Client SHALL render the photo inline within the chat view.
4. IF an uploaded file is not an image (JPEG, PNG, GIF, or WebP), THEN THE Chat_System SHALL reject the upload and return a descriptive error.
5. IF an uploaded photo exceeds 5MB in size, THEN THE Chat_System SHALL reject the upload and return a descriptive error.

---

### Requirement 4: Persist and Load Chat History

**User Story:** As a user, I want to see previous messages when I open a chat, so that I have full context of the conversation.

#### Acceptance Criteria

1. WHEN an authenticated user opens a Conversation, THE Chat_System SHALL load and display all Messages for that Conversation ordered by sent time ascending.
2. THE Chat_System SHALL persist every Message (text and photo) to the SQLite database with sender ID, conversation ID, message type, content, and timestamp.
3. WHEN a user reopens a Conversation after disconnecting, THE Chat_System SHALL display the same Message history as before disconnection.
4. THE Chat_System SHALL paginate Message history, returning a maximum of 50 messages per request, with support for loading older messages.

---

### Requirement 5: Inbox / Conversation List

**User Story:** As a user, I want to see all my conversations in one place, so that I can quickly navigate to any active chat.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to the Inbox, THE Chat_System SHALL display all Conversations for that user sorted by the timestamp of the most recent Message descending.
2. THE Chat_System SHALL display for each Conversation: the other participant's name, profile photo, and a preview of the last Message.
3. THE Chat_System SHALL display an unread message count badge on each Conversation that has unread Messages.
4. WHEN a user opens a Conversation, THE Chat_System SHALL mark all Messages in that Conversation as read for that user.
5. IF a user has no Conversations, THEN THE Chat_System SHALL display an empty state message.

---

### Requirement 6: Socket Authentication

**User Story:** As a system, I want only authenticated users to connect to the Socket_Server, so that chat data is protected.

#### Acceptance Criteria

1. WHEN a Chat_Client attempts to connect to the Socket_Server, THE Socket_Server SHALL require a valid JWT in the connection handshake.
2. IF the JWT provided during Socket connection is missing or invalid, THEN THE Socket_Server SHALL reject the connection with an authentication error.
3. WHEN a Socket_Server receives a message event, THE Socket_Server SHALL verify that the Sender is a participant of the target Conversation before persisting or broadcasting the Message.
4. IF a user attempts to send a message to a Conversation they are not a participant of, THEN THE Socket_Server SHALL reject the event and return an authorization error.

---

### Requirement 7: Connection State Handling

**User Story:** As a user, I want the chat to recover gracefully from network interruptions, so that I don't lose messages.

#### Acceptance Criteria

1. WHEN a Chat_Client loses its Socket connection, THE Chat_Client SHALL display a visible disconnection indicator to the user.
2. WHEN a Chat_Client reconnects to the Socket_Server after a disconnection, THE Chat_Client SHALL automatically re-authenticate using the stored JWT.
3. WHEN a Chat_Client reconnects, THE Chat_System SHALL load any Messages sent during the disconnection period.
4. IF a Chat_Client fails to reconnect after 3 attempts, THEN THE Chat_Client SHALL display an error message prompting the user to refresh the page.
