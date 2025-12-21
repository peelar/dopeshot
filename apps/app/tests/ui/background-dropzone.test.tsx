import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { AssetDropzone } from "@/components/config/layout-config";

describe("Background Dropzone Component (T016)", () => {
  it("renders upload prompt with supported types", () => {
    render(<AssetDropzone label="Upload Background" />);

    expect(screen.getByText("Upload Background")).toBeInTheDocument();
    expect(screen.getByText("PNG, JPG")).toBeInTheDocument();
  });

  it("uploads a file via the hidden input", async () => {
    const onUpload = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<AssetDropzone label="Upload Background" onUpload={onUpload} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.png", { type: "image/png" });

    await user.upload(input, file);
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it("shows asset name and allows removal when asset exists", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    render(
      <AssetDropzone
        label="Upload Background"
        asset={{
          id: "asset-1",
          projectId: "project-1",
          userId: "user-1",
          name: "background.png",
          url: "https://example.com/background.png",
          kind: "background",
          createdAt: "2025-12-21T10:00:00Z",
        }}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText("background.png")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Remove asset"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
