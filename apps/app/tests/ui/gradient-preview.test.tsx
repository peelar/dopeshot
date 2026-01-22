import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GradientPreview } from "@/app/playground/_components/GradientPreview";
import { paletteCases } from "@/app/playground/_data/paletteCases";
import type { EffectState } from "@/app/playground/_types";
import { track } from "@/lib/analytics";

const baseEffects: EffectState = {
  tintOverlay: false,
  blobOverlay: {
    enabled: false,
    count: 2,
    strength: 0.4,
    softness: 0.7,
    scale: 0.6,
    blendMode: "screen",
    seed: 32,
    placement: "diagonal",
  },
  grain: {
    enabled: false,
    amount: 0.18,
    scale: 0.35,
    blendMode: "soft-light",
    useSeed: true,
    seed: 24,
  },
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

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

describe("GradientPreview", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders controls and copies debug JSON", async () => {
    render(<GradientPreview palette={paletteCases[0]} effects={baseEffects} />);

    const recomputeButton = screen.getByRole("button", { name: "Recompute" });
    const copyButton = screen.getByRole("button", { name: "Copy debug JSON" });

    fireEvent.click(recomputeButton);
    expect(track).toHaveBeenCalledWith("playground_gradient_recomputed", { paletteId: "case-a" });

    fireEvent.click(copyButton);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("playground_debug_copied", { paletteId: "case-a" });
    });
  });

  it("adds effects to debug payload", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<GradientPreview palette={paletteCases[0]} effects={baseEffects} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Copy debug JSON" })[0]);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });

    const payload = JSON.parse(writeText.mock.calls[0][0]);
    expect(payload.effects).toEqual(baseEffects);
    expect(payload.derived.grain).toEqual(
      expect.objectContaining({
        blendMode: baseEffects.grain.blendMode,
        opacity: expect.any(Number),
        backgroundSize: expect.any(String),
      })
    );
  });
});
