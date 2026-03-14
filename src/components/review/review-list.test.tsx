import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewList } from "./review-list";
import type { Review } from "@/db/schema";

function makeReview(
  overrides: Partial<Review> = {}
): Review {
  return {
    id: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    matchRating: "yes",
    comment: null,
    reviewerIdentifier: "hash",
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    ...overrides,
  };
}

describe("ReviewList", () => {
  it("renders nothing when reviews array is empty", () => {
    const { container } = render(<ReviewList reviews={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders reviews with rating icon and label", () => {
    const reviews = [
      makeReview({ matchRating: "yes" }),
      makeReview({ matchRating: "no" }),
    ];

    render(<ReviewList reviews={reviews} />);

    expect(screen.getByText(/Sí, coincidió/)).toBeDefined();
    expect(screen.getByText(/No coincidió/)).toBeDefined();
  });

  it("shows comment text when present", () => {
    const reviews = [makeReview({ comment: "Excelente inspección" })];

    render(<ReviewList reviews={reviews} />);

    expect(screen.getByText("Excelente inspección")).toBeDefined();
  });

  it("does not show comment when null", () => {
    const reviews = [makeReview({ comment: null })];

    render(<ReviewList reviews={reviews} />);

    const items = screen.getAllByTestId("review-item");
    expect(items.length).toBe(1);
    expect(screen.queryByText("Excelente inspección")).toBeNull();
  });

  it("shows relative timestamp", () => {
    const reviews = [
      makeReview({ createdAt: new Date(Date.now() - 2 * 86400000) }), // 2 days ago
    ];

    render(<ReviewList reviews={reviews} />);

    expect(screen.getByText("Hace 2 días")).toBeDefined();
  });

  it("shows only first 5 reviews and 'Ver todas' button when more than 5", () => {
    const reviews = Array.from({ length: 8 }, () => makeReview());

    render(<ReviewList reviews={reviews} />);

    expect(screen.getAllByTestId("review-item").length).toBe(5);
    expect(screen.getByTestId("show-all-reviews")).toBeDefined();
    expect(screen.getByText("Ver todas las reseñas (8)")).toBeDefined();
  });

  it("expands to show all reviews when 'Ver todas' is clicked", async () => {
    const user = userEvent.setup();
    const reviews = Array.from({ length: 8 }, () => makeReview());

    render(<ReviewList reviews={reviews} />);

    await user.click(screen.getByTestId("show-all-reviews"));

    expect(screen.getAllByTestId("review-item").length).toBe(8);
    expect(screen.queryByTestId("show-all-reviews")).toBeNull();
  });

  it("does not show 'Ver todas' when 5 or fewer reviews", () => {
    const reviews = Array.from({ length: 5 }, () => makeReview());

    render(<ReviewList reviews={reviews} />);

    expect(screen.getAllByTestId("review-item").length).toBe(5);
    expect(screen.queryByTestId("show-all-reviews")).toBeNull();
  });
});
