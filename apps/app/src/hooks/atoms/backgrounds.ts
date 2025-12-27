import { atom } from "jotai";
import type {
  BackgroundSelection,
  PersonalBackground,
} from "@/domain/backgrounds/types";

export const personalBackgroundsAtom = atom<PersonalBackground[]>([]);
export const backgroundSelectionAtom = atom<BackgroundSelection | null>(null);
