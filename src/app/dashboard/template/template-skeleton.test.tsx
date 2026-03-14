import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TemplateSkeleton } from "./template-skeleton";

describe("TemplateSkeleton", () => {
  it("renders skeleton placeholder elements", () => {
    const { container } = render(<TemplateSkeleton />);
    // Should render multiple skeleton elements (header + 3 section placeholders)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("renders 3 section skeleton cards", () => {
    const { container } = render(<TemplateSkeleton />);
    // The 3 section skeletons are full-width rounded-lg
    const sectionSkeletons = container.querySelectorAll(
      '[data-slot="skeleton"].w-full'
    );
    expect(sectionSkeletons.length).toBe(3);
  });
});
