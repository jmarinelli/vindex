import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewForm } from "./review-form";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock server action
const mockSubmitReviewAction = vi.fn();
vi.mock("@/lib/actions/review", () => ({
  submitReviewAction: (...args: unknown[]) => mockSubmitReviewAction(...args),
}));

import { toast } from "sonner";

describe("ReviewForm", () => {
  const eventId = crypto.randomUUID();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the review question", () => {
    render(<ReviewForm eventId={eventId} />);

    expect(
      screen.getByText(/condición real del vehículo coincidió/)
    ).toBeDefined();
  });

  it("renders three rating options", () => {
    render(<ReviewForm eventId={eventId} />);

    expect(screen.getByTestId("rating-option-yes")).toBeDefined();
    expect(screen.getByTestId("rating-option-partially")).toBeDefined();
    expect(screen.getByTestId("rating-option-no")).toBeDefined();
  });

  it("renders submit button disabled initially", () => {
    render(<ReviewForm eventId={eventId} />);

    const button = screen.getByTestId("review-submit");
    expect(button).toBeDisabled();
  });

  it("enables submit button when rating is selected", async () => {
    const user = userEvent.setup();
    render(<ReviewForm eventId={eventId} />);

    await user.click(screen.getByTestId("rating-option-yes"));

    expect(screen.getByTestId("review-submit")).not.toBeDisabled();
  });

  it("renders comment textarea with placeholder", () => {
    render(<ReviewForm eventId={eventId} />);

    expect(screen.getByTestId("review-comment")).toBeDefined();
    expect(
      screen.getByPlaceholderText("Contanos tu experiencia...")
    ).toBeDefined();
  });

  it("shows character counter for comment", () => {
    render(<ReviewForm eventId={eventId} />);

    expect(screen.getByText("0/500")).toBeDefined();
  });

  it("updates character counter as user types", async () => {
    const user = userEvent.setup();
    render(<ReviewForm eventId={eventId} />);

    await user.type(screen.getByTestId("review-comment"), "Hello");

    expect(screen.getByText("5/500")).toBeDefined();
  });

  it("prevents typing beyond 500 characters", async () => {
    const user = userEvent.setup();
    render(<ReviewForm eventId={eventId} />);

    const textarea = screen.getByTestId("review-comment");
    const longText = "x".repeat(501);

    await user.type(textarea, longText);

    // The textarea value should be at most 500 characters
    expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(
      500
    );
  });

  it("shows confirmation after successful submission", async () => {
    const user = userEvent.setup();
    mockSubmitReviewAction.mockResolvedValue({
      success: true,
      data: { review: { id: "r-1" } },
    });

    render(<ReviewForm eventId={eventId} />);

    await user.click(screen.getByTestId("rating-option-yes"));
    await user.click(screen.getByTestId("review-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("review-confirmation")).toBeDefined();
    });

    expect(screen.getByText("¡Gracias por tu reseña!")).toBeDefined();
  });

  it("shows error toast on submission failure", async () => {
    const user = userEvent.setup();
    mockSubmitReviewAction.mockResolvedValue({
      success: false,
      error: "Ya dejaste una reseña",
    });

    render(<ReviewForm eventId={eventId} />);

    await user.click(screen.getByTestId("rating-option-no"));
    await user.click(screen.getByTestId("review-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Ya dejaste una reseña");
    });
  });

  it("passes correct data to submitReviewAction", async () => {
    const user = userEvent.setup();
    mockSubmitReviewAction.mockResolvedValue({
      success: true,
      data: { review: { id: "r-1" } },
    });

    render(<ReviewForm eventId={eventId} />);

    await user.click(screen.getByTestId("rating-option-partially"));
    await user.type(screen.getByTestId("review-comment"), "Some comment");
    await user.click(screen.getByTestId("review-submit"));

    await waitFor(() => {
      expect(mockSubmitReviewAction).toHaveBeenCalledWith({
        eventId,
        matchRating: "partially",
        comment: "Some comment",
      });
    });
  });

  it("marks selected rating with aria-checked", async () => {
    const user = userEvent.setup();
    render(<ReviewForm eventId={eventId} />);

    const yesOption = screen.getByTestId("rating-option-yes");
    expect(yesOption.getAttribute("aria-checked")).toBe("false");

    await user.click(yesOption);

    expect(yesOption.getAttribute("aria-checked")).toBe("true");
    expect(
      screen.getByTestId("rating-option-no").getAttribute("aria-checked")
    ).toBe("false");
  });
});
