import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChecklistItemCard } from "./checklist-item-card";
import type { DraftFinding, DraftPhoto } from "@/types/inspection";

// Mock child components to isolate unit tests
vi.mock("./status-buttons", () => ({
  StatusButtons: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (s: string) => void;
  }) => (
    <div data-testid="status-buttons" data-value={value}>
      <button onClick={() => onChange("good")}>mock-good</button>
      <button onClick={() => onChange("critical")}>mock-critical</button>
    </div>
  ),
}));

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

describe("ChecklistItemCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the item name", () => {
    render(
      <ChecklistItemCard
        finding={makeFinding()}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    expect(screen.getByText("Motor")).toBeInTheDocument();
  });

  it("renders StatusButtons with correct value", () => {
    render(
      <ChecklistItemCard
        finding={makeFinding({ status: "good" })}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    const sb = screen.getByTestId("status-buttons");
    expect(sb).toHaveAttribute("data-value", "good");
  });

  it("renders observation label", () => {
    render(
      <ChecklistItemCard
        finding={makeFinding()}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    expect(screen.getByText("Observaci\u00f3n:")).toBeInTheDocument();
  });

  it("renders textarea with placeholder", () => {
    render(
      <ChecklistItemCard
        finding={makeFinding()}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    expect(
      screen.getByPlaceholderText("Agregar observaci\u00f3n...")
    ).toBeInTheDocument();
  });

  it("displays existing observation from finding", () => {
    render(
      <ChecklistItemCard
        finding={makeFinding({ observation: "Tiene golpe" })}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Agregar observaci\u00f3n...");
    expect(textarea).toHaveValue("Tiene golpe");
  });

  it("renders PhotoCapture", () => {
    render(
      <ChecklistItemCard
        finding={makeFinding()}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    expect(screen.getByTestId("photo-capture")).toBeInTheDocument();
  });

  it("calls onStatusChange with finding id and new status", () => {
    const onStatusChange = vi.fn();
    render(
      <ChecklistItemCard
        finding={makeFinding()}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={onStatusChange}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("mock-good"));
    expect(onStatusChange).toHaveBeenCalledWith("f-1", "good");
  });

  it("debounces onObservationChange by 500ms", () => {
    const onObservationChange = vi.fn();
    render(
      <ChecklistItemCard
        finding={makeFinding()}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={onObservationChange}
        onPhotoCapture={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText("Agregar observaci\u00f3n...");
    fireEvent.change(textarea, { target: { value: "Rayado" } });

    // Not called yet
    expect(onObservationChange).not.toHaveBeenCalled();

    // Advance 499ms - still not called
    vi.advanceTimersByTime(499);
    expect(onObservationChange).not.toHaveBeenCalled();

    // Advance 1 more ms - now called
    vi.advanceTimersByTime(1);
    expect(onObservationChange).toHaveBeenCalledWith("f-1", "Rayado");
    expect(onObservationChange).toHaveBeenCalledTimes(1);
  });

  it("resets debounce on subsequent changes", () => {
    const onObservationChange = vi.fn();
    render(
      <ChecklistItemCard
        finding={makeFinding()}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={onObservationChange}
        onPhotoCapture={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText("Agregar observaci\u00f3n...");
    fireEvent.change(textarea, { target: { value: "A" } });
    vi.advanceTimersByTime(300);
    fireEvent.change(textarea, { target: { value: "AB" } });
    vi.advanceTimersByTime(500);

    // Only the last value should be sent
    expect(onObservationChange).toHaveBeenCalledTimes(1);
    expect(onObservationChange).toHaveBeenCalledWith("f-1", "AB");
  });

  it("calls onPhotoCapture with finding id and file", () => {
    const onPhotoCapture = vi.fn();
    render(
      <ChecklistItemCard
        finding={makeFinding()}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
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
      <ChecklistItemCard
        finding={makeFinding()}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
        onPhotoDelete={onPhotoDelete}
      />
    );
    fireEvent.click(screen.getByText("mock-delete"));
    expect(onPhotoDelete).toHaveBeenCalledWith("photo-1");
  });

  it("applies colored left border based on status", () => {
    const { container } = render(
      <ChecklistItemCard
        finding={makeFinding({ status: "critical" })}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-t-status-critical");
  });

  it("applies not_evaluated border for not_evaluated status", () => {
    const { container } = render(
      <ChecklistItemCard
        finding={makeFinding({ status: "not_evaluated" })}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-t-gray-200");
  });

  it("applies not_applicable border for not_applicable status", () => {
    const { container } = render(
      <ChecklistItemCard
        finding={makeFinding({ status: "not_applicable" })}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-t-gray-400");
  });

  it("handles null observation as empty string", () => {
    render(
      <ChecklistItemCard
        finding={makeFinding({ observation: null })}
        itemName="Motor"
        photos={defaultPhotos}
        onStatusChange={vi.fn()}
        onObservationChange={vi.fn()}
        onPhotoCapture={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Agregar observaci\u00f3n...");
    expect(textarea).toHaveValue("");
  });
});
