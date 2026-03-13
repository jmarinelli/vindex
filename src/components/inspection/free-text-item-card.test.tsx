import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FreeTextItemCard } from "./free-text-item-card";
import type { DraftFinding, DraftPhoto } from "@/types/inspection";

vi.mock("./photo-capture", () => ({
  PhotoCapture: ({
    onCapture,
    onDelete,
  }: {
    onCapture: (f: File) => void;
    onDelete?: (id: string) => void;
  }) => (
    <div data-testid="photo-capture">
      <button onClick={() => onCapture(new File(["x"], "test.jpg"))}>
        mock-capture
      </button>
      {onDelete && (
        <button onClick={() => onDelete("photo-1")}>mock-delete</button>
      )}
    </div>
  ),
}));

function makeFinding(overrides?: Partial<DraftFinding>): DraftFinding {
  return {
    id: "f-1",
    eventId: "ev-1",
    sectionId: "sec-1",
    itemId: "item-1",
    status: "not_evaluated",
    observation: null,
    ...overrides,
  };
}

const defaultPhotos: DraftPhoto[] = [];

describe("FreeTextItemCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the item name", () => {
    render(
      <FreeTextItemCard
        finding={makeFinding()}
        itemName="Comentarios generales"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    expect(screen.getByText("Comentarios generales")).toBeInTheDocument();
  });

  it("renders textarea with placeholder", () => {
    render(
      <FreeTextItemCard
        finding={makeFinding()}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText("Escribir...")).toBeInTheDocument();
  });

  it("textarea has minimum 3 rows", () => {
    render(
      <FreeTextItemCard
        finding={makeFinding()}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Escribir...");
    expect(textarea).toHaveAttribute("rows", "3");
  });

  it("displays existing observation from finding", () => {
    render(
      <FreeTextItemCard
        finding={makeFinding({ observation: "Texto previo" })}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Escribir...");
    expect(textarea).toHaveValue("Texto previo");
  });

  it("handles null observation as empty string", () => {
    render(
      <FreeTextItemCard
        finding={makeFinding({ observation: null })}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Escribir...");
    expect(textarea).toHaveValue("");
  });

  it("does not render status buttons", () => {
    render(
      <FreeTextItemCard
        finding={makeFinding()}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("debounces onObservationChange by 500ms", () => {
    const onObservationChange = vi.fn();
    render(
      <FreeTextItemCard
        finding={makeFinding()}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={onObservationChange}
        onPhotoCapture={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText("Escribir...");
    fireEvent.change(textarea, { target: { value: "Hello" } });

    expect(onObservationChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(499);
    expect(onObservationChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onObservationChange).toHaveBeenCalledWith("f-1", "Hello");
    expect(onObservationChange).toHaveBeenCalledTimes(1);
  });

  it("resets debounce timer on subsequent changes", () => {
    const onObservationChange = vi.fn();
    render(
      <FreeTextItemCard
        finding={makeFinding()}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={onObservationChange}
        onPhotoCapture={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText("Escribir...");
    fireEvent.change(textarea, { target: { value: "A" } });
    vi.advanceTimersByTime(300);
    fireEvent.change(textarea, { target: { value: "AB" } });
    vi.advanceTimersByTime(300);
    fireEvent.change(textarea, { target: { value: "ABC" } });
    vi.advanceTimersByTime(500);

    expect(onObservationChange).toHaveBeenCalledTimes(1);
    expect(onObservationChange).toHaveBeenCalledWith("f-1", "ABC");
  });

  it("renders PhotoCapture", () => {
    render(
      <FreeTextItemCard
        finding={makeFinding()}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    expect(screen.getByTestId("photo-capture")).toBeInTheDocument();
  });

  it("calls onPhotoCapture with finding id and file", () => {
    const onPhotoCapture = vi.fn();
    render(
      <FreeTextItemCard
        finding={makeFinding()}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={onPhotoCapture}
      />
    );
    fireEvent.click(screen.getByText("mock-capture"));
    expect(onPhotoCapture).toHaveBeenCalledWith("f-1", expect.any(File));
  });

  it("passes onPhotoDelete to PhotoCapture when provided", () => {
    const onPhotoDelete = vi.fn();
    render(
      <FreeTextItemCard
        finding={makeFinding()}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
        onPhotoDelete={onPhotoDelete}
      />
    );
    fireEvent.click(screen.getByText("mock-delete"));
    expect(onPhotoDelete).toHaveBeenCalledWith("photo-1");
  });

  it("updates textarea when finding.observation prop changes", () => {
    const { rerender } = render(
      <FreeTextItemCard
        finding={makeFinding({ observation: "first" })}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText("Escribir...");
    expect(textarea).toHaveValue("first");

    rerender(
      <FreeTextItemCard
        finding={makeFinding({ observation: "second" })}
        itemName="Notas"
        photos={defaultPhotos}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );

    expect(textarea).toHaveValue("second");
  });
});
