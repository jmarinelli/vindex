import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewStats } from "./review-stats";

describe("ReviewStats", () => {
  it("renders nothing when total is 0", () => {
    const { container } = render(
      <ReviewStats
        stats={{
          total: 0,
          yesCount: 0,
          partiallyCount: 0,
          noCount: 0,
          matchRate: 0,
        }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders stat tiles with correct values", () => {
    render(
      <ReviewStats
        stats={{
          total: 15,
          yesCount: 10,
          partiallyCount: 3,
          noCount: 2,
          matchRate: 67,
        }}
      />
    );

    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("reseñas")).toBeDefined();
    expect(screen.getByText("67%")).toBeDefined();
    expect(screen.getByText("coincidencia")).toBeDefined();
  });

  it("renders the rating distribution bar", () => {
    render(
      <ReviewStats
        stats={{
          total: 10,
          yesCount: 7,
          partiallyCount: 2,
          noCount: 1,
          matchRate: 70,
        }}
      />
    );

    expect(screen.getByTestId("rating-distribution-bar")).toBeDefined();
  });

  it("has the correct testid", () => {
    render(
      <ReviewStats
        stats={{
          total: 1,
          yesCount: 1,
          partiallyCount: 0,
          noCount: 0,
          matchRate: 100,
        }}
      />
    );

    expect(screen.getByTestId("review-stats")).toBeDefined();
  });

  it("shows 100% match rate correctly", () => {
    render(
      <ReviewStats
        stats={{
          total: 5,
          yesCount: 5,
          partiallyCount: 0,
          noCount: 0,
          matchRate: 100,
        }}
      />
    );

    expect(screen.getByText("100%")).toBeDefined();
  });
});
