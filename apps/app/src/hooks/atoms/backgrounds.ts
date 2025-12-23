import { atom } from "jotai";
import type {
  BackgroundSelection,
  PersonalBackground,
  PresetBackground,
} from "@/domain/backgrounds/types";

export const presetBackgroundsAtom = atom<PresetBackground[]>([]);
export const personalBackgroundsAtom = atom<PersonalBackground[]>([]);
export const backgroundSelectionAtom = atom<BackgroundSelection | null>(null);
export const backgroundUserTierAtom = atom<string>("unknown");
