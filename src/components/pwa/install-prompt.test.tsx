import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallPrompt } from "./install-prompt";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Download: ({ className }: { className?: string }) => (
    <svg data-testid="download-icon" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <svg data-testid="x-icon" className={className} />
  ),
}));

describe("InstallPrompt", () => {
  let getItemMock: ReturnType<typeof vi.fn>;
  let setItemMock: ReturnType<typeof vi.fn>;
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let addEventListenerSpy: ReturnType<typeof vi.fn>;
  let removeEventListenerSpy: ReturnType<typeof vi.fn>;
  let capturedHandler: ((e: Event) => void) | null;

  beforeEach(() => {
    getItemMock = vi.fn().mockReturnValue(null);
    setItemMock = vi.fn();
    Object.defineProperty(window, "localStorage", {
      value: { getItem: getItemMock, setItem: setItemMock, removeItem: vi.fn() },
      writable: true,
      configurable: true,
    });

    matchMediaMock = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, "matchMedia", {
      value: matchMediaMock,
      writable: true,
      configurable: true,
    });

    capturedHandler = null;
    addEventListenerSpy = vi.fn((event: string, handler: (e: Event) => void) => {
      if (event === "beforeinstallprompt") {
        capturedHandler = handler;
      }
    });
    removeEventListenerSpy = vi.fn();
    window.addEventListener = addEventListenerSpy;
    window.removeEventListener = removeEventListenerSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing initially (no beforeinstallprompt fired)", () => {
    const { container } = render(<InstallPrompt />);
    expect(container.querySelector("[role='alert']")).toBeNull();
  });

  it("renders the install banner when beforeinstallprompt fires", () => {
    render(<InstallPrompt />);

    act(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      capturedHandler?.(event);
    });

    expect(screen.getByText("Instalar VinDex")).toBeInTheDocument();
    expect(screen.getByText("Instalar")).toBeInTheDocument();
    expect(screen.getByText("Ahora no")).toBeInTheDocument();
  });

  it("does not show banner if previously dismissed", () => {
    getItemMock.mockReturnValue("1");
    render(<InstallPrompt />);

    // Should not have registered the listener
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function)
    );
  });

  it("does not show banner if already installed (standalone)", () => {
    matchMediaMock.mockReturnValue({ matches: true });
    render(<InstallPrompt />);

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function)
    );
  });

  it("calls prompt() when 'Instalar' is clicked", async () => {
    const user = userEvent.setup();
    const promptMock = vi.fn().mockResolvedValue(undefined);
    render(<InstallPrompt />);

    act(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, {
        prompt: promptMock,
        userChoice: Promise.resolve({ outcome: "accepted" }),
      });
      capturedHandler?.(event);
    });

    await user.click(screen.getByText("Instalar"));

    expect(promptMock).toHaveBeenCalled();
  });

  it("hides banner and persists dismissal on 'Ahora no'", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);

    act(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      capturedHandler?.(event);
    });

    await user.click(screen.getByText("Ahora no"));

    expect(setItemMock).toHaveBeenCalledWith("vindex-a2hs-dismissed", "1");
    expect(screen.queryByText("Instalar VinDex")).not.toBeInTheDocument();
  });

  it("hides banner on X button click", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);

    act(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      capturedHandler?.(event);
    });

    await user.click(screen.getByLabelText("Cerrar"));

    expect(screen.queryByText("Instalar VinDex")).not.toBeInTheDocument();
    expect(setItemMock).toHaveBeenCalledWith("vindex-a2hs-dismissed", "1");
  });

  it("cleans up event listener on unmount", () => {
    const { unmount } = render(<InstallPrompt />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function)
    );
  });
});
