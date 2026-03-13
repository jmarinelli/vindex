import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PhotoCapture } from "./photo-capture";
import type { DraftPhoto } from "@/types/inspection";

function makePhoto(overrides?: Partial<DraftPhoto>): DraftPhoto {
  return {
    id: "p-1",
    eventId: "ev-1",
    findingId: "f-1",
    blob: undefined,
    url: null,
    caption: null,
    order: 0,
    uploaded: false,
    ...overrides,
  };
}

describe("PhotoCapture", () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLSpy = vi.fn((blob: Blob) => `blob:mock-${blob.size}`);
    revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the camera button with correct aria-label", () => {
    render(<PhotoCapture photos={[]} onCapture={vi.fn()} />);
    expect(screen.getByLabelText("Agregar foto")).toBeInTheDocument();
  });

  it("renders a hidden file input", () => {
    const { container } = render(
      <PhotoCapture photos={[]} onCapture={vi.fn()} />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.className).toContain("hidden");
    expect(input).toHaveAttribute("accept", "image/*");
    expect(input).toHaveAttribute("capture", "environment");
  });

  it("clicking camera button triggers file input click", () => {
    const { container } = render(
      <PhotoCapture photos={[]} onCapture={vi.fn()} />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.click(screen.getByLabelText("Agregar foto"));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("calls onCapture when a file is selected", () => {
    const onCapture = vi.fn();
    const { container } = render(
      <PhotoCapture photos={[]} onCapture={onCapture} />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["image-data"], "photo.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [file] } });
    expect(onCapture).toHaveBeenCalledWith(file);
  });

  it("resets input value after file capture", () => {
    const onCapture = vi.fn();
    const { container } = render(
      <PhotoCapture photos={[]} onCapture={onCapture} />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });

    // Simulate setting value then triggering change
    Object.defineProperty(input, "value", {
      writable: true,
      value: "C:\\fakepath\\photo.jpg",
    });
    fireEvent.change(input, { target: { files: [file] } });

    expect(input.value).toBe("");
  });

  it("does not call onCapture when no file is selected", () => {
    const onCapture = vi.fn();
    const { container } = render(
      <PhotoCapture photos={[]} onCapture={onCapture} />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [] } });
    expect(onCapture).not.toHaveBeenCalled();
  });

  it("renders thumbnails for photos with blob", () => {
    const blob = new Blob(["img"], { type: "image/png" });
    const photo = makePhoto({ id: "p-1", blob });

    render(<PhotoCapture photos={[photo]} onCapture={vi.fn()} />);

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    const img = screen.getByAltText("Foto de inspecci\u00f3n");
    expect(img).toBeInTheDocument();
  });

  it("renders thumbnails for photos with url (no blob)", () => {
    const photo = makePhoto({
      id: "p-2",
      blob: undefined,
      url: "https://cdn.example.com/photo.jpg",
      uploaded: true,
    });

    render(<PhotoCapture photos={[photo]} onCapture={vi.fn()} />);

    expect(createObjectURLSpy).not.toHaveBeenCalled();
    const img = screen.getByAltText("Foto de inspecci\u00f3n");
    expect(img).toHaveAttribute("src", "https://cdn.example.com/photo.jpg");
  });

  it("uses caption as alt text when available", () => {
    const photo = makePhoto({
      id: "p-3",
      url: "https://cdn.example.com/photo.jpg",
      caption: "Vista frontal",
      uploaded: true,
    });

    render(<PhotoCapture photos={[photo]} onCapture={vi.fn()} />);
    expect(screen.getByAltText("Vista frontal")).toBeInTheDocument();
  });

  it("shows 'local' indicator for non-uploaded blob photos", () => {
    const blob = new Blob(["data"], { type: "image/png" });
    const photo = makePhoto({ id: "p-4", blob, uploaded: false });

    render(<PhotoCapture photos={[photo]} onCapture={vi.fn()} />);
    expect(screen.getByText("local")).toBeInTheDocument();
  });

  it("does not show 'local' indicator for uploaded photos", () => {
    const photo = makePhoto({
      id: "p-5",
      url: "https://cdn.example.com/photo.jpg",
      uploaded: true,
    });

    render(<PhotoCapture photos={[photo]} onCapture={vi.fn()} />);
    expect(screen.queryByText("local")).not.toBeInTheDocument();
  });

  it("renders delete button when onDelete is provided", () => {
    const blob = new Blob(["img"], { type: "image/png" });
    const photo = makePhoto({ id: "p-6", blob });

    render(
      <PhotoCapture photos={[photo]} onCapture={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByLabelText("Eliminar foto")).toBeInTheDocument();
  });

  it("does not render delete button when onDelete is not provided", () => {
    const blob = new Blob(["img"], { type: "image/png" });
    const photo = makePhoto({ id: "p-7", blob });

    render(<PhotoCapture photos={[photo]} onCapture={vi.fn()} />);
    expect(screen.queryByLabelText("Eliminar foto")).not.toBeInTheDocument();
  });

  it("calls onDelete with photo id when delete button is clicked", () => {
    const onDelete = vi.fn();
    const blob = new Blob(["img"], { type: "image/png" });
    const photo = makePhoto({ id: "p-8", blob });

    render(
      <PhotoCapture photos={[photo]} onCapture={vi.fn()} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByLabelText("Eliminar foto"));
    expect(onDelete).toHaveBeenCalledWith("p-8");
  });

  it("renders multiple photo thumbnails", () => {
    const photos = [
      makePhoto({
        id: "p-a",
        blob: new Blob(["a"], { type: "image/png" }),
        caption: "Photo A",
      }),
      makePhoto({
        id: "p-b",
        blob: new Blob(["b"], { type: "image/png" }),
        caption: "Photo B",
      }),
    ];

    render(<PhotoCapture photos={photos} onCapture={vi.fn()} />);
    expect(screen.getByAltText("Photo A")).toBeInTheDocument();
    expect(screen.getByAltText("Photo B")).toBeInTheDocument();
  });

  it("revokes blob URLs on unmount", () => {
    const blob = new Blob(["img"], { type: "image/png" });
    const photo = makePhoto({ id: "p-9", blob });

    const { unmount } = render(
      <PhotoCapture photos={[photo]} onCapture={vi.fn()} />
    );

    unmount();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });

  it("does not revoke non-blob URLs on unmount", () => {
    const photo = makePhoto({
      id: "p-10",
      url: "https://cdn.example.com/photo.jpg",
      uploaded: true,
    });

    const { unmount } = render(
      <PhotoCapture photos={[photo]} onCapture={vi.fn()} />
    );

    unmount();
    // revokeObjectURL should not be called for https URLs
    const revokedUrls = revokeObjectURLSpy.mock.calls.map(
      (call: [string]) => call[0]
    );
    const hasNonBlobRevoke = revokedUrls.some(
      (url: string) => !url.startsWith("blob:")
    );
    expect(hasNonBlobRevoke).toBe(false);
  });

  it("does not render thumbnail for photo with no blob and no url", () => {
    const photo = makePhoto({ id: "p-11", blob: undefined, url: null });

    render(<PhotoCapture photos={[photo]} onCapture={vi.fn()} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
