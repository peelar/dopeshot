import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EffectsPanel } from "@/app/playground/_components/EffectsPanel";
import type { EffectState } from "@/app/playground/_types";
import { track } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const baseState: EffectState = {
  tintOverlay: false,
  blobOverlay: false,
  grain: false,
  vignette: {
    enabled: false,
    strength: 0.35,
    radius: 0.6,
    softness: 0.5,
    mode: "darken",
  },
  patternGrid: false,
  blur: false,
};

describe("EffectsPanel", () => {
  it("toggles effect switches", () => {
    const handleChange = vi.fn();

    render(<EffectsPanel value={baseState} onChange={handleChange} />);

    const tintSwitch = screen.getByLabelText("Tint overlay");
    fireEvent.click(tintSwitch);

    expect(handleChange).toHaveBeenCalledWith({
      ...baseState,
      tintOverlay: true,
    });
    expect(track).toHaveBeenCalledWith("playground_effect_toggled", {
      effect: "tintOverlay",
      enabled: true,
    });
  });

  it("exposes vignette controls when enabled", () => {
    const handleChange = vi.fn();
    const enabledState: EffectState = {
      ...baseState,
      vignette: {
        ...baseState.vignette,
        enabled: true,
      },
    };

    render(<EffectsPanel value={enabledState} onChange={handleChange} />);

    const strengthSlider = screen.getByLabelText("Vignette strength");
    fireEvent.change(strengthSlider, { target: { value: "0.6" } });

    expect(handleChange).toHaveBeenCalledWith({
      ...enabledState,
      vignette: {
        ...enabledState.vignette,
        strength: 0.6,
      },
    });
    expect(track).toHaveBeenCalledWith("playground_vignette_updated", {
      field: "strength",
      value: 0.6,
    });
  });
});
