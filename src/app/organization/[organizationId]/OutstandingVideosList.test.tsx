import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { OutstandingVideosList } from "./OutstandingVideosList";

const api = vi.hoisted(() => ({
  videos: [] as Video[],
  destroy: vi.fn(),
  invalidate: vi.fn(),
  confirm: vi.fn(),
  params: undefined as Record<string, unknown> | undefined,
}));

vi.mock("@/generated/videos/videos", () => ({
  useVideosList: (params: Record<string, unknown>) => {
    api.params = params;
    return { data: { data: { results: api.videos } } };
  },
  useVideosDestroy: () => ({
    mutateAsync: api.destroy,
    isPending: false,
    variables: undefined,
  }),
  // The status chip has a test of its own; here it only has to not explode.
  useVideosIngestRetrieve: () => ({ data: undefined, isError: false }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: api.invalidate }),
}));

vi.mock("@heroui/alert", () => ({
  Alert: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@heroui/react", () => ({
  // A `Button` given an `href` is a link in HeroUI too, and the tests below
  // care which of the two a control is.
  Button: ({
    children,
    onPress,
    isLoading,
    href,
    ...props
  }: {
    children: ReactNode;
    onPress?: () => void;
    isLoading?: boolean;
    href?: string;
  } & ButtonHTMLAttributes<HTMLButtonElement>) =>
    href ? (
      <a href={href}>{children}</a>
    ) : (
      <button disabled={isLoading} onClick={onPress} {...props}>
        {children}
      </button>
    ),
  Chip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const video = (id: number, name: string): Video =>
  ({
    id,
    name,
    properImport: false,
    createdTime: null,
    files: {},
    organization: { id: 9, name: "Prøveforeningen" },
  }) as unknown as Video;

beforeEach(() => {
  api.videos = [video(42, "Fastlåst opplasting")];
  api.destroy.mockReset().mockResolvedValue({});
  api.invalidate.mockReset().mockResolvedValue(undefined);
  api.confirm.mockReset().mockReturnValue(true);
  api.params = undefined;
  Object.defineProperty(window, "confirm", {
    configurable: true,
    value: api.confirm,
  });
});

afterEach(() => {
  cleanup();
});

describe("OutstandingVideosList", () => {
  it("asks the server for exactly the unimported videos", () => {
    render(<OutstandingVideosList organizationId={9} />);

    expect(api.params).toEqual({ organization: 9, proper_import: false, ordering: "-id" });
  });

  it("shows the videos as ordinary archive rows", () => {
    render(<OutstandingVideosList organizationId={9} />);

    expect(screen.getByRole("link", { name: "Fastlåst opplasting" }).getAttribute("href")).toBe(
      "/video/42",
    );
    expect(screen.getByRole("link", { name: "Last opp" }).getAttribute("href")).toBe(
      "/video/42/upload",
    );
  });

  it("renders nothing at all when every video is imported", () => {
    api.videos = [];
    const { container } = render(<OutstandingVideosList organizationId={9} />);

    expect(container.innerHTML).toBe("");
  });

  it("deletes a confirmed unimported video and refreshes the video lists", async () => {
    render(<OutstandingVideosList organizationId={9} />);

    fireEvent.click(screen.getByRole("button", { name: "Slett" }));

    await waitFor(() => expect(api.destroy).toHaveBeenCalledWith({ id: 42 }));
    expect(api.confirm).toHaveBeenCalledWith(
      "Slett den uimporterte videoen «Fastlåst opplasting»?",
    );
    expect(api.invalidate).toHaveBeenCalledWith({ queryKey: ["/api/videos"] });
  });

  it("keeps the video when deletion is cancelled", () => {
    api.confirm.mockReturnValue(false);
    render(<OutstandingVideosList organizationId={9} />);

    fireEvent.click(screen.getByRole("button", { name: "Slett" }));

    expect(api.destroy).not.toHaveBeenCalled();
  });

  it("shows an error if deletion fails", async () => {
    api.destroy.mockRejectedValue(new Error("Ingen tilgang"));
    render(<OutstandingVideosList organizationId={9} />);

    fireEvent.click(screen.getByRole("button", { name: "Slett" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Videoen kunne ikke slettes: Ingen tilgang",
    );
    expect(api.invalidate).not.toHaveBeenCalled();
  });
});
