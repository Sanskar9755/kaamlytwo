# Requirements Document

## Introduction

This feature enables customers to leave star ratings (1–5) and optional comments for workers after a conversation. Reviews are displayed on worker cards in search results, and search results are sorted by average rating and review count so higher-rated workers surface first. Workers can view their own reviews and rating on their dashboard. The system enforces one review per customer per worker and prevents self-reviews.

## Glossary

- **Review_API**: The backend Express route handler at `/api/reviews` responsible for creating and retrieving reviews
- **Workers_API**: The backend Express route handler at `/api/workers` responsible for returning worker search results
- **ReviewModal**: The frontend modal component that allows a customer to select a star rating and enter an optional comment
- **StarRating**: The frontend component that renders filled/half/empty stars alongside a review count label
- **WorkerCard**: The frontend component rendered in `CustomerSearchPage` that displays a single worker's profile, skills, and rating
- **ChatPage**: The frontend page for a real-time conversation between a customer and a worker
- **DashboardPage**: The frontend page where a worker views their profile, stats, and reviews
- **Customer**: A user with role `'customer'` in the `users` table
- **Worker**: A user with role `'worker'` in the `users` table
- **avg_rating**: The arithmetic mean of all ratings for a worker, rounded to 1 decimal place; `0` when no reviews exist
- **review_count**: The total number of reviews a worker has received

---

## Requirements

### Requirement 1: Submit a Review

**User Story:** As a customer, I want to leave a star rating and optional comment for a worker I have chatted with, so that I can share my experience and help others find quality workers.

#### Acceptance Criteria

1. WHEN a customer submits a review with a `rating` integer between 1 and 5 and an optional `comment`, THE Review_API SHALL create a new review record and return HTTP 201 with the created review object
2. WHEN a customer submits a review with a `rating` value outside the range 1–5 or a non-integer rating, THE Review_API SHALL return HTTP 400 with a descriptive error message
3. WHEN a customer submits a review for a worker they have already reviewed, THE Review_API SHALL return HTTP 409 with a message indicating a duplicate review
4. WHEN a user submits a review where `reviewer_user_id` equals `worker_user_id`, THE Review_API SHALL return HTTP 403 with a message indicating self-review is not permitted
5. WHEN a customer submits a review with a `comment` exceeding 500 characters, THE Review_API SHALL return HTTP 400 with a descriptive error message
6. WHEN a review request is received without a valid JWT token, THE Review_API SHALL return HTTP 401

---

### Requirement 2: Display Rating on Worker Card

**User Story:** As a customer, I want to see a worker's star rating and review count on their search result card, so that I can quickly assess their reputation before contacting them.

#### Acceptance Criteria

1. WHEN the Workers_API returns search results, THE Workers_API SHALL include `avg_rating` and `review_count` fields for every worker in the response
2. WHEN a WorkerCard is rendered with a worker that has at least one review, THE WorkerCard SHALL display the `avg_rating` as a star representation and the `review_count` as a numeric label
3. WHEN a WorkerCard is rendered with a worker that has no reviews, THE WorkerCard SHALL display `avg_rating` as `0` and `review_count` as `0`

---

### Requirement 3: Sort Search Results by Rating

**User Story:** As a customer, I want search results to show the highest-rated workers first, so that I can find the most trusted workers easily.

#### Acceptance Criteria

1. WHEN the Workers_API returns search results, THE Workers_API SHALL order workers by `avg_rating` descending as the primary sort key
2. WHEN two or more workers share the same `avg_rating`, THE Workers_API SHALL order those workers by `review_count` descending as the secondary sort key
3. WHEN a worker has no reviews, THE Workers_API SHALL assign `avg_rating = 0` and `review_count = 0` and include them in the sorted results

---

### Requirement 4: Worker Views Their Own Reviews

**User Story:** As a worker, I want to see all reviews customers have left for me along with my overall rating, so that I can understand my reputation and improve my service.

#### Acceptance Criteria

1. WHEN a worker requests their reviews via `GET /api/reviews/:workerUserId`, THE Review_API SHALL return all reviews for that worker ordered by `created_at` descending
2. WHEN the Review_API returns reviews for a worker, THE Review_API SHALL include a `stats` object containing `avg_rating` rounded to 1 decimal place and `review_count`
3. WHEN a worker has no reviews, THE Review_API SHALL return an empty `reviews` array and `stats` with `avg_rating: 0` and `review_count: 0`
4. WHEN the DashboardPage loads for a worker, THE DashboardPage SHALL fetch and display the worker's `avg_rating` and `review_count`

---

### Requirement 5: Review Button in ChatPage

**User Story:** As a customer, I want a "Leave Review" button in the chat page after a conversation, so that I can easily submit a review without navigating away.

#### Acceptance Criteria

1. WHEN a customer opens a ChatPage conversation with a worker, THE ChatPage SHALL display a "Leave Review" button in the header area
2. WHEN a customer has already submitted a review for the worker in the current conversation, THE ChatPage SHALL hide the "Leave Review" button
3. WHEN a customer taps the "Leave Review" button, THE ChatPage SHALL open the ReviewModal with the worker's name and user ID pre-filled
4. WHEN a customer submits the ReviewModal form, THE ChatPage SHALL call `POST /api/reviews` and hide the "Leave Review" button on success

---

### Requirement 6: Prevent Self-Review

**User Story:** As a system, I want to prevent workers from reviewing themselves, so that ratings remain trustworthy.

#### Acceptance Criteria

1. WHEN the authenticated user's `id` matches the `worker_user_id` in a review submission, THE Review_API SHALL return HTTP 403
2. WHEN the ReviewModal is opened from ChatPage, THE ChatPage SHALL not display the "Leave Review" button if the authenticated user is the worker in the conversation

---

### Requirement 7: Prevent Duplicate Reviews

**User Story:** As a system, I want to ensure each customer can only review a given worker once, so that ratings cannot be manipulated by repeated submissions.

#### Acceptance Criteria

1. WHEN a review already exists for a given `(worker_user_id, reviewer_user_id)` pair, THE Review_API SHALL return HTTP 409 on any subsequent submission for that pair
2. THE Review_API SHALL enforce the uniqueness of `(worker_user_id, reviewer_user_id)` at the database level via a UNIQUE constraint

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid review creation round-trip

*For any* valid rating integer in [1, 5] and any optional comment string of at most 500 characters, submitting a review via `POST /api/reviews` and then fetching via `GET /api/reviews/:workerUserId` should return a reviews list that contains a review with the same rating and comment.

**Validates: Requirements 1.1, 4.1**

---

### Property 2: Invalid rating rejection

*For any* rating value that is not an integer in [1, 5] (e.g. 0, 6, -1, 3.5, null), `POST /api/reviews` should return HTTP 400.

**Validates: Requirements 1.2**

---

### Property 3: Duplicate review rejection

*For any* valid first review submission, a second submission with the same `(reviewer_user_id, worker_user_id)` pair should return HTTP 409 regardless of the rating or comment values.

**Validates: Requirements 1.3, 7.1**

---

### Property 4: Self-review rejection

*For any* authenticated user, submitting a review where `worker_user_id` equals the authenticated user's own `id` should return HTTP 403.

**Validates: Requirements 1.4, 6.1**

---

### Property 5: Comment length validation

*For any* comment string whose length exceeds 500 characters, `POST /api/reviews` should return HTTP 400.

**Validates: Requirements 1.5**

---

### Property 6: WorkerCard renders rating and count

*For any* `WorkerResult` object with arbitrary `avg_rating` and `review_count` values, the rendered `WorkerCard` output should contain a string representation of `avg_rating` and a string representation of `review_count`.

**Validates: Requirements 2.1, 2.2**

---

### Property 7: Search results sort order

*For any* set of workers returned by `GET /api/workers`, the result array should be sorted such that for every adjacent pair `results[i]` and `results[i+1]`, `results[i].avg_rating >= results[i+1].avg_rating`, and when `results[i].avg_rating === results[i+1].avg_rating`, `results[i].review_count >= results[i+1].review_count`.

**Validates: Requirements 3.1, 3.2**

---

### Property 8: Worker reviews ordered by date

*For any* worker with multiple reviews, `GET /api/reviews/:workerUserId` should return reviews such that for every adjacent pair `reviews[i]` and `reviews[i+1]`, `reviews[i].created_at >= reviews[i+1].created_at`.

**Validates: Requirements 4.1**

---

### Property 9: Review stats aggregation correctness

*For any* set of N reviews with ratings r₁…rN all in [1, 5], the `stats` object returned by `GET /api/reviews/:workerUserId` should satisfy `stats.review_count === N` and `stats.avg_rating === round(sum(r₁…rN) / N, 1)`. When N = 0, `stats.avg_rating === 0` and `stats.review_count === 0`.

**Validates: Requirements 4.2, 4.3**

---

### Property 10: Review button hidden after submission

*For any* ChatPage rendered with `hasReviewed = true` for the current worker, the "Leave Review" button should not be present in the rendered output.

**Validates: Requirements 5.2**
