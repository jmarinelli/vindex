import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RatingDistributionBar } from "./rating-distribution-bar";

describe("RatingDistributionBar", () => {
  it("renders nothing when total is 0", () => {
    const { container } = render(
      <RatingDistributionBar
        aggregation={{ total: 0, yesCount: 0, partiallyCount: 0, noCount: 0 }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders segments with correct labels", () => {
    render(
      <RatingDistributionBar
        aggregation={{ total: 10, yesCount: 6, partiallyCount: 3, noCount: 1 }}
      />
    );

    expect(screen.getByText(/✓ 6 Sí/)).toBeDefined();
    expect(screen.getByText(/⚠ 3 Parcial/)).toBeDefined();
    expect(screen.getByText(/✕ 1 No/)).toBeDefined();
    expect(screen.getByText("10 reseñas")).toBeDefined();
  });

  it("shows singular 'reseña' for 1 total", () => {
    render(
      <RatingDistributionBar
        aggregation={{ total: 1, yesCount: 1, partiallyCount: 0, noCount: 0 }}
      />
    );
    expect(screen.getByText("1 reseña")).toBeDefined();
  });

  it("renders all-yes distribution (single segment)", () => {
    render(
      <RatingDistributionBar
        aggregation={{ total: 5, yesCount: 5, partiallyCount: 0, noCount: 0 }}
      />
    );

    expect(screen.getByLabelText("5 sí")).toBeDefined();
  });

  it("renders all-no distribution", () => {
    render(
      <RatingDistributionBar
        aggregation={{ total: 3, yesCount: 0, partiallyCount: 0, noCount: 3 }}
      />
    );

    expect(screen.getByLabelText("3 no")).toBeDefined();
  });

  it("has the correct testid", () => {
    render(
      <RatingDistributionBar
        aggregation={{ total: 1, yesCount: 1, partiallyCount: 0, noCount: 0 }}
      />
    );

    expect(screen.getByTestId("rating-distribution-bar")).toBeDefined();
  });
});
