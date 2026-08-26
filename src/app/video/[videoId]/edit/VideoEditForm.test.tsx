import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Series, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { VideoEditForm } from "./VideoEditForm";

const actions = vi.hoisted(() => ({
  update: vi.fn(),
  editAction: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/generated/videos/videos", () => ({ videosPartialUpdate: actions.update }));
vi.mock("./editAction", () => ({ editAction: actions.editAction }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: actions.push }) }));
vi.mock("./MDXEditorField", () => ({ MDXEditorField: () => null }));

type SelectProps = {
  children: (_item: { id: string; name: string }) => ReactNode;
  items: { id: string; name: string }[];
  label: string;
  onBlur: () => void;
  onSelectionChange: (_keys: Set<string>) => void;
  selectedKeys: Set<string>;
};

vi.mock("@heroui/react", () => ({
  Button: ({
    children,
    onPress,
    isLoading,
    ...props
  }: {
    children: ReactNode;
    onPress?: () => void;
    isLoading?: boolean;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={isLoading} onClick={onPress} {...props}>
      {children}
    </button>
  ),
  Form: ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => (
    <form {...props}>{children}</form>
  ),
  Input: ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <label>
      {label}
      <input aria-label={label} {...props} />
    </label>
  ),
  Select: ({ children, items, label, onBlur, onSelectionChange, selectedKeys }: SelectProps) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={Array.from(selectedKeys)[0]}
        onBlur={onBlur}
        onChange={(event) => onSelectionChange(new Set([event.target.value]))}
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {children(item)}
          </option>
        ))}
      </select>
    </label>
  ),
  SelectItem: ({ children }: { children: ReactNode }) => children,
}));

const existingSeries = {
  id: 7,
  name: "Havna vår",
  episodeCount: 3,
} as Series;
const otherSeries = {
  id: 8,
  name: "Kveldssending",
  episodeCount: 5,
} as Series;
const editedVideo = {
  id: 42,
  name: "Reportasje",
  description: "Ingress\n\nBeskrivelse",
  series: existingSeries,
  episodeNumber: 2,
} as unknown as Video;

beforeEach(() => {
  actions.update.mockReset().mockResolvedValue({ status: 200 });
  actions.editAction.mockReset().mockResolvedValue(undefined);
  actions.push.mockReset();
});

afterEach(cleanup);

describe("VideoEditForm series membership", () => {
  it("does not render an episode selector and leaves ordering to the new series", async () => {
    render(<VideoEditForm video={editedVideo} series={[existingSeries, otherSeries]} />);

    expect(screen.queryByLabelText("Episodenummer")).toBeNull();
    fireEvent.change(screen.getByLabelText("Serie (valgfritt)"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Send inn" }));

    await waitFor(() => expect(actions.update).toHaveBeenCalledOnce());
    expect(actions.update).toHaveBeenCalledWith(
      "42",
      expect.objectContaining({ seriesId: 8, episodeNumber: null }),
    );
  });

  it("clears the episode number when removing a video from its series", async () => {
    render(<VideoEditForm video={editedVideo} series={[existingSeries, otherSeries]} />);

    fireEvent.change(screen.getByLabelText("Serie (valgfritt)"), { target: { value: "none" } });
    fireEvent.click(screen.getByRole("button", { name: "Send inn" }));

    await waitFor(() => expect(actions.update).toHaveBeenCalledOnce());
    expect(actions.update).toHaveBeenCalledWith(
      "42",
      expect.objectContaining({ seriesId: null, episodeNumber: null }),
    );
  });
});
