# Feature Specification: Persistent Background Management

**Feature Branch**: `002-persistent-backgrounds`
**Created**: 2025-12-21
**Status**: Draft
**Input**: User description: "Currently, you can upload a background and it doesn't persist. I want you to change this. For logged-in users, you can upload your own backgrounds and they persist, and you can choose them from the sidebar. You can upload your brand backgrounds in the brand sidebar and then they show in the background selector. For the free users not logged in, you can select backgrounds from a collection of them that's stored in the DB, and it's the same between all of the free users"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Logged-in User Uploads Personal Background (Priority: P1)

A logged-in user wants to upload their own custom background image so they can maintain consistent branding across all their screenshot creations. The background should persist across sessions and be available whenever they return to the application.

**Why this priority**: This is the core value proposition - giving logged-in users the ability to maintain brand consistency. Without this, there's no differentiation between free and logged-in users regarding backgrounds.

**Independent Test**: Can be fully tested by logging in, uploading a background image via the brand sidebar, and verifying it appears in the background selector and persists after logout/login.

**Acceptance Scenarios**:

1. **Given** a logged-in user is in the brand sidebar, **When** they upload a background image, **Then** the image is saved to their account and appears in the background selector
2. **Given** a logged-in user has uploaded custom backgrounds, **When** they log out and log back in, **Then** their uploaded backgrounds are still available in the background selector
3. **Given** a logged-in user selects one of their uploaded backgrounds from the background selector, **When** they apply it to their screenshot, **Then** the background is applied correctly

---

### User Story 2 - Logged-in User Manages Multiple Backgrounds (Priority: P2)

A logged-in user wants to upload multiple background images and easily switch between them to match different brand styles or use cases. They should be able to see all their uploaded backgrounds and select any of them.

**Why this priority**: Enhances the core feature by allowing flexibility for users with multiple brand styles or projects. Still critical for power users but not essential for MVP.

**Independent Test**: Can be tested by uploading 3+ background images, verifying they all appear in the background selector, and switching between them successfully.

**Acceptance Scenarios**:

1. **Given** a logged-in user has uploaded 3 background images, **When** they open the background selector, **Then** all 3 backgrounds are displayed
2. **Given** a logged-in user has multiple uploaded backgrounds, **When** they select a different background, **Then** the canvas updates to show the newly selected background
3. **Given** a logged-in user uploads a background with the same name as an existing one, **When** the upload completes, **Then** the system shows an error message and requires the user to rename the file before uploading

---

### User Story 3 - Free User Selects from Curated Backgrounds (Priority: P1)

A free (non-logged-in) user wants to select from a collection of beautiful, pre-designed backgrounds so they can create visually appealing screenshots without needing an account. These backgrounds should be the same for all free users.

**Why this priority**: This is essential for the free tier experience and user acquisition. Free users need access to quality backgrounds to see the value of the product before signing up.

**Independent Test**: Can be tested by using the app without logging in, opening the background selector, and verifying a curated collection of backgrounds is available and applies correctly.

**Acceptance Scenarios**:

1. **Given** a free user (not logged in) opens the background selector, **When** they view available backgrounds, **Then** they see only the curated collection from the database
2. **Given** a free user selects a background from the curated collection, **When** they apply it to their screenshot, **Then** the background is applied correctly
3. **Given** a free user uploads a background, **When** they navigate away or refresh the page, **Then** the uploaded background is lost (does not persist)

---

### User Story 4 - Background Upload from Brand Sidebar (Priority: P2)

A logged-in user wants to upload brand backgrounds directly from the brand sidebar (where they manage other brand assets like logos and colors) so all their brand materials are managed in one place.

**Why this priority**: Improves UX by consolidating brand asset management, but the core functionality (uploading backgrounds) can work from the background selector alone.

**Independent Test**: Can be tested by opening the brand sidebar, uploading a background there, and verifying it appears in both the brand sidebar and the background selector.

**Acceptance Scenarios**:

1. **Given** a logged-in user is in the brand sidebar, **When** they upload a background image, **Then** the image is added to their account and visible in the background selector
2. **Given** a logged-in user uploads a background from the brand sidebar, **When** they navigate to the background selector, **Then** the newly uploaded background appears alongside any previously uploaded backgrounds

---

### Edge Cases

- What happens when a user uploads a background file that exceeds the maximum file size?
- What happens when a user uploads an invalid file format (not an image)?
- What happens when a user uploads a very large image (e.g., 20MB)?
- What happens when a logged-in user has 50+ uploaded backgrounds - how are they displayed in the selector?
- What happens when the curated background collection is empty or fails to load?
- What happens when a user deletes a background that is currently applied to their canvas?
- What happens when a user's storage quota is exceeded?
- What happens when a background upload fails mid-transfer?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow logged-in users to upload custom background images via the brand sidebar
- **FR-002**: System MUST persist uploaded backgrounds to the user's account across sessions
- **FR-003**: System MUST display all user-uploaded backgrounds in the background selector sidebar
- **FR-004**: System MUST allow logged-in users to select and apply any of their uploaded backgrounds to the canvas
- **FR-005**: System MUST provide a curated collection of backgrounds stored in the database for free users
- **FR-006**: System MUST restrict free users to only the curated background collection
- **FR-007**: System MUST NOT persist uploaded backgrounds for free (non-logged-in) users
- **FR-008**: System MUST validate uploaded files are valid image formats (PNG, JPG, WEBP, SVG)
- **FR-009**: System MUST enforce a maximum file size limit of 5MB per background upload
- **FR-010**: System MUST store uploaded backgrounds in persistent cloud storage with proper user isolation (each user can only access their own backgrounds)
- **FR-011**: System MUST display background thumbnails in the selector for quick visual identification
- **FR-012**: Background selector MUST show user's uploaded backgrounds separately from curated backgrounds for logged-in users
- **FR-013**: System MUST allow logged-in users to delete their uploaded backgrounds with a confirmation dialog to prevent accidental deletions
- **FR-014**: System MUST enforce unique filenames per user and reject uploads with duplicate names, prompting the user to rename the file

### Non-Functional Requirements (Constitution Compliance)

- **NFR-001**: Feature MUST include test coverage (unit tests for upload validation, component tests for UI, E2E tests for upload flow) per Principle I
- **NFR-002**: Background selection and application MUST feel instant (<100ms perceived latency) per Principle V
- **NFR-003**: Feature MUST track usage with analytics events: background_uploaded, background_selected, background_applied per Principle IV
- **NFR-004**: Code MUST follow simplicity guidelines - avoid over-engineering storage patterns or premature optimization per Principle III
- **NFR-005**: Background thumbnails MUST be optimized for fast loading (compressed, appropriate dimensions)
- **NFR-006**: Upload progress MUST be communicated to users for files taking >1 second to upload
- **NFR-007**: System MUST handle upload failures gracefully with clear error messages

### Key Entities

- **User Background**: Represents a custom background image uploaded by a logged-in user. Attributes include image reference (storage path), upload timestamp, file size, dimensions, user ID (owner).
- **Curated Background**: Represents a pre-designed background available to all free users. Attributes include image reference (storage path), display name, tags/categories for organization, active status (for show/hide management).
- **Background Selection State**: Represents the currently selected background for a user's canvas. Attributes include reference to either a user background or curated background, user session (logged-in users persist this, free users don't).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Logged-in users can upload a custom background and see it persist across sessions within 30 seconds
- **SC-002**: Background selector displays all available backgrounds (curated + user uploaded) within 1 second of opening
- **SC-003**: 95% of background uploads complete successfully on first attempt
- **SC-004**: Free users can select and apply curated backgrounds without any authentication friction
- **SC-005**: Background selection changes apply to canvas within 100ms
- **SC-006**: Zero unauthorized access to user backgrounds (users can only access their own uploaded backgrounds)
- **SC-007**: Launch with at least 10 curated backgrounds available to free users
