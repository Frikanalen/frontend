import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { AddSeriesVideosModal } from "./AddSeriesVideosModal";

const api = vi.hoisted(() => ({
  results: [] as Video[],
  count: 0,
  params: [] as Record<string, unknown>[],
  update: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/generated/videos/videos", () => ({
  useVideosList: (params: Record<string, unknown>) => {
    api.params.push(params);
    return {
      data: { data: { results: api.results, count: api.count } },
      isFetching: false,
      isError: false,
      error: null,
    };
  },
  useVideosPartialUpdate: () => ({ mutateAsync: api.update }),
}));

vi.mock("@tanstack/react-query", () => ({
  keepPreviousData: Symbol("keepPreviousData"),
  useQueryClient: () => ({ invalidateQueries: api.invalidate }),
}));

vi.mock("@heroui/react", () => ({
  Button: ({
    children,
    onPress,
    isDisabled,
    isLoading,
    ...props
  }: {
    children: ReactNode;
    onPress?: () => void;
    isDisabled?: boolean;
    isLoading?: boolean;
  } & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={isDisabled || isLoading} onClick={onPress} {...props}>
      {children}
    </button>
  ),
  Image: () => <span data-testid="thumbnail" />,
  Input: ({
    label,
    onValueChange,
    ...props
  }: {
    label: string;
    onValueChange?: (_value: string) => void;
  } & InputHTMLAttributes<HTMLInputElement>) => (
    <label>
      {label}
      <input
        aria-label={label}
        onChange={(event) => onValueChange?.(event.target.value)}
        {...props}
      />
    </label>
  ),
  Modal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
    isOpen ? <>{children}</> : null,
  ModalContent: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
  ModalHeader: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  ModalBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ModalFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const organization = { id: 9, name: "Havneforeningen" };
const series = (id: number, name: string) => ({ id, name, synopsis: "", imageUrl: "" });
const video = (
  id: number,
  name: string,
  videoSeries: Video["series"] = null,
  episodeNumber: number | null = null,
): Video =>
  ({
    id,
    name,
    files: {},
    creator: "editor@example.test",
    organization,
    series: videoSeries,
    episodeNumber,
    categories: [],
    framerate: 25,
  }) as unknown as Video;

beforeEach(() => {
  api.results = [];
  api.count = 0;
  api.params = [];
  api.update.mockReset().mockResolvedValue({});
  api.invalidate.mockReset().mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("AddSeriesVideosModal", () => {
  it("searches within the organization and explains why series videos are disabled", () => {
    api.results = [
      video(10, "Ledig video"),
      video(11, "Nåværende episode", series(4, "Havna vår")),
      video(12, "Annen episode", series(8, "Kveldssending")),
    ];
    api.count = api.results.length;

    render(
      <AddSeriesVideosModal organizationId={9} seriesId={4} episodes={[]} onAdded={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Legg til i serien" }));
    fireEvent.change(screen.getByLabelText("Søk i organisasjonens videoer"), {
      target: { value: "fjord" },
    });

    expect(api.params.at(-1)).toEqual({
      organization: 9,
      q: "fjord",
      ordering: "-created_time",
      limit: 50,
    });
    expect(
      (
        screen
          .getByText("Videoen er allerede i denne serien.")
          .closest("button") as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen
          .getByText("Videoen er allerede i serien «Kveldssending».")
          .closest("button") as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    const available = screen.getByRole("button", { name: /Ledig video/ });
    expect((available as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(available);
    expect(available.getAttribute("aria-pressed")).toBe("true");
  });

  it("adds multiple videos last and normalizes existing episode numbers", async () => {
    const onAdded = vi.fn();
    api.results = [video(10, "Ny episode A"), video(11, "Ny episode B")];
    api.count = api.results.length;
    const episodes = [
      video(1, "Første", series(4, "Havna vår"), 1),
      video(2, "Andre", series(4, "Havna vår"), 3),
      video(3, "Tredje", series(4, "Havna vår"), null),
    ];

    render(
      <AddSeriesVideosModal
        organizationId={9}
        seriesId={4}
        episodes={episodes}
        onAdded={onAdded}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Legg til i serien" }));
    fireEvent.click(screen.getByRole("button", { name: /Ny episode A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Ny episode B/ }));
    fireEvent.click(screen.getByRole("button", { name: "Legg til 2 videoer" }));

    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(5));
    expect(api.update).toHaveBeenNthCalledWith(1, {
      id: 2,
      data: { episodeNumber: null },
    });
    expect(api.update).toHaveBeenCalledWith({ id: 2, data: { episodeNumber: 2 } });
    expect(api.update).toHaveBeenCalledWith({ id: 3, data: { episodeNumber: 3 } });
    expect(api.update).toHaveBeenCalledWith({
      id: 10,
      data: { seriesId: 4, episodeNumber: 4 },
    });
    expect(api.update).toHaveBeenCalledWith({
      id: 11,
      data: { seriesId: 4, episodeNumber: 5 },
    });
    expect(api.invalidate).toHaveBeenCalledWith({ queryKey: ["/api/videos"] });
    expect(onAdded).toHaveBeenCalledWith(2);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
