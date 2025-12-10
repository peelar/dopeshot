import { atom, useAtom } from "jotai";
import { useCallback } from "react";

export type SidebarSectionId = "screenshot" | "logo" | "background" | "look" | "colors" | "effects";

interface SidebarState {
  expandedSection: SidebarSectionId | null;
  pinnedSections: Set<SidebarSectionId>;
}

const sidebarStateAtom = atom<SidebarState>({
  expandedSection: null,
  pinnedSections: new Set<SidebarSectionId>(),
});

// Helper atom for programmatic expansion
export const expandSidebarSectionAtom = atom(
  null,
  (get, set, sectionId: SidebarSectionId | null) => {
    const currentState = get(sidebarStateAtom);

    if (sectionId === null) {
      set(sidebarStateAtom, {
        ...currentState,
        expandedSection: null,
      });
      return;
    }

    // If section is already expanded, don't do anything
    if (currentState.expandedSection === sectionId) {
      return;
    }

    // If previous section is not pinned, collapse it
    if (
      currentState.expandedSection &&
      !currentState.pinnedSections.has(currentState.expandedSection)
    ) {
      set(sidebarStateAtom, {
        ...currentState,
        expandedSection: sectionId,
      });
    } else {
      set(sidebarStateAtom, {
        ...currentState,
        expandedSection: sectionId,
      });
    }
  },
);

export function useSidebarState() {
  const [state, setState] = useAtom(sidebarStateAtom);

  const expandSection = useCallback(
    (sectionId: SidebarSectionId, autoCollapse = true) => {
      setState((prev: SidebarState) => {
        // If section is already expanded, don't do anything
        if (prev.expandedSection === sectionId) {
          return prev;
        }

        // If autoCollapse is true and previous section is not pinned, collapse it
        if (
          autoCollapse &&
          prev.expandedSection &&
          !prev.pinnedSections.has(prev.expandedSection)
        ) {
          return {
            ...prev,
            expandedSection: sectionId,
          };
        }

        return {
          ...prev,
          expandedSection: sectionId,
        };
      });
    },
    [setState],
  );

  const toggleSection = useCallback(
    (sectionId: SidebarSectionId) => {
      setState((prev: SidebarState) => {
        // If clicking on already expanded section, collapse it
        if (prev.expandedSection === sectionId) {
          return {
            ...prev,
            expandedSection: null,
          };
        }

        // Otherwise, expand this section (and collapse previous if not pinned)
        if (prev.expandedSection && !prev.pinnedSections.has(prev.expandedSection)) {
          return {
            ...prev,
            expandedSection: sectionId,
          };
        }

        return {
          ...prev,
          expandedSection: sectionId,
        };
      });
    },
    [setState],
  );

  const togglePin = useCallback(
    (sectionId: SidebarSectionId) => {
      setState((prev: SidebarState) => {
        const newPinned = new Set(prev.pinnedSections);
        if (newPinned.has(sectionId)) {
          newPinned.delete(sectionId);
        } else {
          newPinned.add(sectionId);
        }
        return {
          ...prev,
          pinnedSections: newPinned,
        };
      });
    },
    [setState],
  );

  const collapseAll = useCallback(() => {
    setState((prev: SidebarState) => ({
      ...prev,
      expandedSection: null,
    }));
  }, [setState]);

  const isSectionExpanded = useCallback(
    (sectionId: SidebarSectionId) => {
      return state.expandedSection === sectionId;
    },
    [state.expandedSection],
  );

  const isSectionPinned = useCallback(
    (sectionId: SidebarSectionId) => {
      return state.pinnedSections.has(sectionId);
    },
    [state.pinnedSections],
  );

  return {
    expandedSection: state.expandedSection,
    pinnedSections: state.pinnedSections,
    expandSection,
    toggleSection,
    togglePin,
    collapseAll,
    isSectionExpanded,
    isSectionPinned,
  };
}
