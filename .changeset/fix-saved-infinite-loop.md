---
"dopeshot-app": minor
---

feat: independent Save and Export flow + fix infinite loop bug

**New Feature: Independent Save and Export**
- Save and Export are now independent actions - you can save without exporting, export without saving, or do both
- Save button is always available (when authenticated and under limit) - no need to export first
- Save generates its own screenshot automatically, independent of export
- Both buttons now appear in the header simultaneously
- Updated empty state message to reflect new flow: "Create a design and click 'Save' to access it later"

**Bug Fix: Infinite Loop**
- Fixed infinite loop that occurred when all items in the "Saved" sidebar were deleted
- Sidebar was continuously re-fetching items because it watched `items.length` in the useEffect dependency array
- Now uses a ref-based flag to track if items have been fetched in the current session
- Prevents unnecessary refetches while still updating properly on sidebar open/close
