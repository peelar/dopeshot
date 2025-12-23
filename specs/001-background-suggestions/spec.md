# Feature Specification: Background Suggestions

**Feature Branch**: `001-background-suggestions`  
**Created**: 2025-12-22  
**Status**: Draft  
**Input**: User description: "Simplify background selection to suggestion-only outcomes: no gradient/image tabs, show 4 sampled gradients and 4 preset backgrounds in a single view, and only display safe suggestions based on the current screenshot(s), layout, and text placement."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Safe background suggestions (Priority: P1)

As a user editing a design, I see a single set of background suggestions that are guaranteed to be safe for the current screenshot(s), layout, and text placement, and I can pick one without worrying about readability failures.

**Why this priority**: This is the core value of the feature—users must be able to choose a background confidently.

**Independent Test**: Can be fully tested by loading a canvas with screenshot(s) and text, opening the background picker, and verifying only safe suggestions appear and can be applied.

**Acceptance Scenarios**:

1. **Given** a canvas with screenshot(s) and text placement, **When** the user opens the background picker, **Then** a single list of up to 8 safe suggestions is shown with no type tabs.
2. **Given** the suggestions are shown, **When** the user selects one, **Then** the background updates to match the selected suggestion and the choice is reflected in the UI.

---

### User Story 2 - Suggestions stay safe as context changes (Priority: P2)

As a user, when I change the layout, text placement, or screenshots, the suggestions update so that the list remains safe for the new context.

**Why this priority**: Safety depends on context; stale suggestions can produce unreadable results.

**Independent Test**: Can be fully tested by changing layout/text placement and verifying the suggestions list refreshes and unsafe candidates are removed.

**Acceptance Scenarios**:

1. **Given** a canvas with existing suggestions, **When** the user changes layout or text placement, **Then** the suggestion list is re-generated to fit the new context.
2. **Given** a change that causes preset backgrounds to become unsafe, **When** the suggestions refresh, **Then** unsafe presets are omitted from the list.

---

### User Story 3 - Unified display of gradients and presets (Priority: P3)

As a user, I see gradients and preset backgrounds displayed together using the same component, with presets appearing below gradients.

**Why this priority**: This is the visible product change that removes the notion of background “types.”

**Independent Test**: Can be fully tested by opening the background picker and confirming the order and component style are consistent.

**Acceptance Scenarios**:

1. **Given** the background picker is open, **When** suggestions are displayed, **Then** the first 4 are gradients and the next up to 4 are presets, all using the same visual component.

---

### Edge Cases

- What happens when no screenshots are present on the canvas?
- How does the system handle fewer than 4 safe preset candidates?
- What happens when text placement overlaps a high-contrast region in a candidate background?
- How does the system behave when brand colors are unavailable?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept current screenshot(s), layout, and text placement as input when generating background suggestions.
- **FR-002**: System MUST generate up to 4 gradient candidates derived from the current screenshot(s) and intended to be calm and low-contrast.
- **FR-003**: System MUST include curated preset backgrounds as candidates and process them into low-contrast, non-distracting materials before evaluation.
- **FR-004**: System MUST evaluate all candidates using the same safety heuristics: text contrast safety, low visual noise behind text and screenshots, no competing focal points, and color harmony with screenshots and available brand colors.
- **FR-005**: System MUST filter out any candidate that fails safety heuristics so unsafe backgrounds are never shown.
- **FR-006**: System MUST rank remaining candidates by safety and visual balance for the current context.
- **FR-007**: System MUST return an ordered array of resolved background suggestions (gradient or processed image) without exposing how they were made in the UI.
- **FR-008**: UI MUST display a single suggestions view without gradient/image tabs.
- **FR-009**: UI MUST display the first 4 gradient suggestions followed by up to 4 preset suggestions using the same component and styling.
- **FR-010**: If fewer than 4 safe preset suggestions exist, UI MUST display only the safe presets and MUST NOT substitute unsafe options.

### Key Entities *(include if feature involves data)*

- **BackgroundSuggestion**: A resolved, safe background option with ordering and display metadata.
- **BackgroundCandidate**: A potential gradient or preset background that is evaluated for safety before becoming a suggestion.
- **LayoutContext**: The current screenshot(s), layout, and text placement used to evaluate safety.

## Assumptions

- Preset backgrounds are curated but still must pass safety heuristics for the current context.
- “First 4 preset backgrounds” means the top 4 ranked preset candidates that pass safety checks.
- If no screenshots exist, neutral low-contrast gradients are still considered safe and can be suggested.

## Dependencies

- A curated preset background library is available to be evaluated as candidates.
- Existing gradient sampling logic is available to produce calm, low-contrast gradients.
- Safety evaluation signals for contrast, noise, and focal points are available for candidate scoring.

## Instrumentation *(mandatory)*

- **Event**: background_suggestions_viewed — Fired when the suggestions list is shown to confirm discovery and load success.
  **Properties**: suggestion_count, gradient_count, preset_count, has_brand_colors, screenshot_count
- **Event**: background_suggestions_generated — Fired when suggestions are regenerated to measure frequency and coverage.
  **Properties**: suggestion_count, rejected_count, layout_change_reason
- **Event**: background_suggestion_selected — Fired when a user selects a suggestion to measure engagement and ranking effectiveness.
  **Properties**: selection_rank, suggestion_type, has_brand_colors

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 95% of sessions with at least one screenshot, users are shown at least 3 safe suggestions.
- **SC-002**: 0% of displayed suggestions fail automated contrast/noise safety checks during QA validation.
- **SC-003**: Median time from opening the picker to selecting a background is under 20 seconds.
- **SC-004**: Support requests about unreadable text due to background choice decrease by 50% within 30 days of release.
