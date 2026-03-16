import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { ServiceWorkerRegister } from "./service-worker-register";

describe("ServiceWorkerRegister", () => {
  const originalNavigator = globalThis.navigator;
  let registerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registerMock = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("registers the service worker when supported", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        serviceWorker: { register: registerMock },
      },
      writable: true,
      configurable: true,
    });

    render(<ServiceWorkerRegister />);

    expect(registerMock).toHaveBeenCalledWith("/sw.js");
  });

  it("renders nothing", () => {
    const { container } = render(<ServiceWorkerRegister />);
    expect(container.innerHTML).toBe("");
  });

  it("does not throw when serviceWorker is not available", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });

    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
  });

  it("does not throw when registration fails", () => {
    registerMock.mockRejectedValue(new Error("fail"));
    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        serviceWorker: { register: registerMock },
      },
      writable: true,
      configurable: true,
    });

    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
  });
});
