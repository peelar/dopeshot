# Feature Specification: DopeShot Memory

**Feature Branch**: `001-memory`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Introduce persistency in DopeShot that preserves a premium, minimal feel, does not interrupt the editor flow, does not require an account to export, and makes persistence feel like a natural upgrade. Memory is a benefit of having an account, not a prerequisite for using the product."

## Overview

DopeShot Memory introduces persistence for logged-in users without disrupting the core product experience. The key principles are:

1. **Export is never gated** - Anyone can export, account or not
2. **Memory is a benefit** - Logged-in users get their exports remembered automatically
3. **Private by default** - Exports are only visible to the owner unless explicitly shared
4. **Configuration-first** - Persisted exports store configuration, not just rendered images
5. **Silent and automatic** - No save buttons, no confirmations, no interruptions

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Logged-In User Exports and Sees Memory (Priority: P1)

A logged-in user creates a design in the editor and exports it. The export is automatically saved to their memory sidebar, which they can access at any time to view previous exports or reload configurations.

**Why this priority**: This is the core value proposition of Memory. Without this, there's no persistence feature.

**Independent Test**: Can be fully tested by having a logged-in user export a design and verify it appears in the memory sidebar. Delivers the core "your work is remembered" value.

**Acceptance Scenarios**:

1. **Given** a logged-in user with a design ready in the editor, **When** they click Export, **Then** the file downloads AND a new memory item appears at the top of the memory sidebar
2. **Given** a logged-in user with existing memory items, **When** they open the memory sidebar, **Then** they see a chronological list of their previous exports (most recent first)
3. **Given** a logged-in user viewing the memory sidebar, **When** they click on a memory item, **Then** the stored configuration loads into the editor (layout, gradient, text, screenshot)

---

### User Story 2 - Logged-Out User Exports Without Friction (Priority: P1)

A user without an account can use DopeShot and export their design with zero friction. Export works identically to today - the file downloads immediately. No account is required, no prompts block the export.

**Why this priority**: Tied with P1 because this preserves the core product experience. Export must never be gated.

**Independent Test**: Can be fully tested by a logged-out user completing an export and receiving the file. No account prompts appear before or during export.

**Acceptance Scenarios**:

1. **Given** a logged-out user with a design ready, **When** they click Export, **Then** the file downloads immediately with no interruption
2. **Given** a logged-out user who just exported, **When** the export completes, **Then** no persistent record is created (no server call for storage)
3. **Given** a logged-out user, **When** they open the memory sidebar, **Then** it opens but displays no items (empty state with no messaging)

---

### User Story 3 - Post-Export Account Nudge (Priority: P2)

After a logged-out user exports, the Export button temporarily changes to suggest account creation. This is subtle, non-blocking, and informational.

**Why this priority**: Important for conversion but not core functionality. The product works without this.

**Independent Test**: Can be tested by having a logged-out user export and observing the button state change. Delivers conversion opportunity.

**Acceptance Scenarios**:

1. **Given** a logged-out user who just completed an export, **When** the export finishes, **Then** the Export button label changes to "Create account" with subtext "to keep your exports"
2. **Given** the button is showing "Create account", **When** the user performs any interaction in the editor, **Then** the button reverts to "Export"
3. **Given** the button is showing "Create account", **When** the user clicks it, **Then** authentication opens without navigating away from the editor
4. **Given** a user who just authenticated via the nudge, **When** auth completes, **Then** they return to the editor with their design intact (subsequent exports will now be persisted)

---

### User Story 4 - Explicit Sharing of Exports (Priority: P2)

A logged-in user can explicitly share a memory item, which generates a public URL. Anyone with the URL can view the full rendered image and load the configuration into the editor.

**Why this priority**: Enables growth through sharing but is not required for core persistence functionality.

**Independent Test**: Can be tested by having a user share an export and another user visit the URL. Delivers viral growth opportunity.

**Acceptance Scenarios**:

1. **Given** a logged-in user viewing the memory sidebar, **When** they right-click a memory item, **Then** a context menu appears with "Share" and "Delete" options
2. **Given** a user clicks "Share" on an unshared memory item, **When** the share action completes, **Then** a public URL is generated and shown/copied, with brief inline notice "Anyone with this link can view"
3. **Given** a memory item that is already shared, **When** user right-clicks it, **Then** the "Share" option appears disabled (greyed out) in the context menu
4. **Given** a visitor navigates to a shared URL, **When** the page loads, **Then** they see the full rendered image (including screenshot) and the configuration loads into the editor
5. **Given** an unshared memory item, **When** someone attempts to access its URL (if they guessed it), **Then** they receive a 404 or equivalent "not found" response

---

### User Story 5 - Reload and Modify Previous Export (Priority: P2)

A user clicks a memory item to load its configuration, modifies it, and exports again. This creates a new memory item; the original remains untouched.

**Why this priority**: Important for the "memory as history" mental model but builds on P1 functionality.

**Independent Test**: Can be tested by loading a memory item, making changes, exporting, and verifying both old and new items exist.

**Acceptance Scenarios**:

1. **Given** a user loads a memory item into the editor, **When** they modify any setting (text, gradient, screenshot) and export, **Then** a new memory item is created at the top of the list
2. **Given** a user loads a memory item and exports, **When** the configuration is identical (no changes made), **Then** no new memory item is created (deduplication by config hash), only the file re-downloads
3. **Given** multiple memory items exist, **When** a user loads item #3 and exports with changes, **Then** item #3 remains unchanged and a new item appears at position #1

---

### User Story 6 - Gradient Freezing and Regeneration (Priority: P3)

When an export is created, the gradient parameters are frozen. When reloading a memory item, the gradient remains unchanged unless the user explicitly regenerates it.

**Why this priority**: Enhancement to reproducibility. The system works without this (gradients would just regenerate), but this provides consistency.

**Independent Test**: Can be tested by exporting, reloading the memory item, and verifying the gradient is identical.

**Acceptance Scenarios**:

1. **Given** a user creates an export, **When** the export is persisted, **Then** the resolved gradient parameters (colors, positions, angles) are stored as part of the configuration
2. **Given** a user loads a memory item with a frozen gradient, **When** the editor loads, **Then** the exact same gradient renders (not a new random one)
3. **Given** a memory item is loaded with a frozen gradient, **When** the user wants a new gradient, **Then** they can click a ghost button beneath the gradient preview to regenerate it
4. **Given** a user regenerates a gradient and exports, **When** the new export is saved, **Then** it contains the new gradient parameters (frozen at the new values)

---

### User Story 7 - Delete Memory Items (Priority: P3)

Users can delete items from their memory via right-click context menu.

**Why this priority**: Housekeeping feature. Memory works without deletion, but users expect this control.

**Independent Test**: Can be tested by right-clicking a memory item and selecting Delete.

**Acceptance Scenarios**:

1. **Given** a user right-clicks a memory item, **When** they select "Delete" from the context menu, **Then** the item is removed from their memory
2. **Given** a shared memory item is deleted, **When** someone visits the previously-shared URL, **Then** they receive a 404 response
3. **Given** a user deletes a memory item, **When** they check the sidebar, **Then** the item is gone and remaining items reflow

---

### Edge Cases

- What happens when a user uploads a very large screenshot (>10MB)? System should enforce reasonable limits and show clear error.
- What happens if stored screenshot is corrupted/missing when reloading? System should show placeholder and allow user to re-upload.
- What happens when a user has hundreds of memory items? Sidebar should handle pagination/virtualization for performance.
- What happens if a user is logged in on two devices and exports on both? Both exports should appear in memory on both devices (sync).
- What happens if share URL hash collides? Use sufficiently long random hash (12+ chars) to make collision practically impossible.

## Requirements *(mandatory)*

### Functional Requirements

**Memory Sidebar**
- **FR-001**: System MUST provide a collapsible sidebar on the left side of the editor
- **FR-002**: Sidebar MUST be closed by default
- **FR-003**: Sidebar icon MUST be visible when collapsed, allowing users to open it
- **FR-004**: Sidebar MUST display memory items in a vertical list (ChatGPT-style), most recent first
- **FR-005**: Each memory item MUST be represented by a rendered thumbnail (re-rendered from stored config)
- **FR-006**: Sidebar MUST be empty with no messaging when user is logged out

**Export Behavior**
- **FR-007**: System MUST allow export for all users regardless of authentication state
- **FR-008**: For logged-in users, system MUST persist export configuration after successful export
- **FR-009**: For logged-out users, system MUST NOT persist any export data
- **FR-010**: System MUST NOT create duplicate memory items when exporting unchanged configuration (detect via config hash)

**Post-Export Nudge**
- **FR-011**: After logged-out user exports, Export button MUST change to "Create account" with subtext "to keep your exports"
- **FR-012**: Nudge MUST persist until next user interaction in the editor
- **FR-013**: Clicking "Create account" MUST open authentication without leaving the editor
- **FR-014**: After successful authentication, user MUST return to editor with design intact

**Configuration Persistence**
- **FR-015**: Persisted configuration MUST include: layout identifier, screenshot reference (storage path), text values, gradient parameters (frozen), and all rendering-affecting flags
- **FR-016**: Screenshot files MUST be uploaded to cloud storage
- **FR-017**: Stored configuration MUST be sufficient to fully reproduce the rendered output

**Memory Item Interaction**
- **FR-018**: Clicking a memory item MUST load its stored configuration into the editor
- **FR-019**: Loading a memory item and exporting with changes MUST create a new memory item
- **FR-020**: Right-click on memory item MUST show context menu with "Share" and "Delete" options
- **FR-021**: Delete action MUST remove the memory item and its associated data (this is the only way to un-share)

**Sharing**
- **FR-022**: Exports MUST be private by default (no public URL until explicitly shared)
- **FR-023**: Share action MUST only be available in the right-click context menu (not in editor UI)
- **FR-024**: Share action MUST generate a public URL in format `/[hash]`
- **FR-025**: Share action MUST display brief notice: "Anyone with this link can view"
- **FR-026**: For already-shared items, "Share" option MUST appear disabled in context menu
- **FR-027**: Visiting a shared URL MUST display the full rendered image (including screenshot)
- **FR-028**: Visiting a shared URL MUST load the configuration into the editor for the visitor
- **FR-029**: Unshared exports MUST return 404 if URL is accessed
- **FR-030**: Deleting a shared export MUST invalidate its public URL

**Gradient Behavior**
- **FR-031**: Gradient parameters MUST be frozen (stored) when export is created
- **FR-032**: Loading a memory item MUST render the exact frozen gradient
- **FR-033**: System MUST provide a ghost button beneath gradient preview to regenerate gradient
- **FR-034**: Regenerated gradient MUST be frozen when next export is created

### Key Entities

- **Memory Item**: A persisted export record belonging to a user. Contains configuration snapshot (layout, text, flags, frozen gradient), screenshot storage reference, creation timestamp, and sharing status.
- **Export Configuration**: The complete set of parameters needed to reproduce a rendered output. Includes layout ID, screenshot path, text overlay values, frozen gradient parameters, and active rendering flags.
- **Shared Link**: A public URL associated with a memory item. Contains unique hash, reference to memory item, and creation timestamp. Only exists for explicitly shared items.

## Instrumentation *(mandatory)*

- **Event**: `memory_sidebar_opened` — When user opens the memory sidebar
  **Properties**: `{ user_logged_in: boolean, item_count: number }`

- **Event**: `memory_sidebar_closed` — When user closes the memory sidebar
  **Properties**: `{ user_logged_in: boolean }`

- **Event**: `memory_item_loaded` — When user clicks a memory item to load its config
  **Properties**: `{ item_age_days: number, has_shared_url: boolean }`

- **Event**: `memory_item_created` — When a new memory item is persisted after export
  **Properties**: `{ layout_id: string, has_text: boolean, gradient_regenerated: boolean }`

- **Event**: `memory_item_deleted` — When user deletes a memory item
  **Properties**: `{ item_age_days: number, was_shared: boolean }`

- **Event**: `memory_item_shared` — When user shares a memory item
  **Properties**: `{ item_age_days: number }`

- **Event**: `shared_link_visited` — When someone visits a shared URL
  **Properties**: `{ is_owner: boolean }`

- **Event**: `export_nudge_shown` — When post-export "Create account" nudge appears
  **Properties**: `{}`

- **Event**: `export_nudge_clicked` — When user clicks the "Create account" nudge
  **Properties**: `{}`

- **Event**: `export_nudge_dismissed` — When nudge disappears due to user interaction
  **Properties**: `{ time_visible_ms: number }`

- **Event**: `gradient_regenerated` — When user explicitly regenerates a frozen gradient
  **Properties**: `{ from_memory_item: boolean }`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Logged-in users can complete the export-to-memory flow in under 3 seconds (export + persistence)
- **SC-002**: Memory sidebar loads and displays up to 50 items in under 1 second
- **SC-003**: Loading a memory item into the editor completes in under 2 seconds
- **SC-004**: 100% of persisted exports are reproducible from stored configuration (visual parity)
- **SC-005**: Shared URLs load for visitors in under 3 seconds
- **SC-006**: Post-export nudge results in measurable increase in account creation rate (baseline to be established)
- **SC-007**: At least 10% of logged-in users use memory feature within first month
- **SC-008**: At least 5% of memory items are shared within first month
- **SC-009**: Zero exports are blocked or interrupted by the memory feature (export success rate unchanged)

## Assumptions

- Users have stable internet connection for upload/persistence operations
- Cloud storage can handle expected screenshot upload volume
- Magic link authentication is already implemented and working
- Current export functionality works correctly and will be extended, not replaced
- Thumbnail re-rendering from config is performant enough for sidebar display
- 12+ character random hashes provide sufficient collision resistance for shared URLs

## Out of Scope

- Google OAuth (will be added later, magic link only for this phase)
- Memory item search or filtering
- Memory item organization (folders, tags, favorites)
- Bulk operations (multi-select, bulk delete)
- Memory limits or caps (no limits for logged-in users in this phase)
- Export history for logged-out users
- Sharing revocation UI (delete is the only way to un-share)
- Collaborative editing of shared exports
- Comments or annotations on shared exports
