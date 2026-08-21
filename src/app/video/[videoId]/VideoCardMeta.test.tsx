import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { VideoCardMeta } from "./VideoCardMeta";

afterEach(cleanup);

describe("VideoCardMeta", () => {
  it("links an episode to its series and shows its episode number", () => {
    const video = {
      id: 7,
      name: "Havna vår 3",
      description: "Fra kaia.",
      createdTime: "2026-08-21T12:00:00Z",
      organization: { id: 2, name: "Havneforeningen", description: "" },
      series: { id: 4, name: "Havna vår", synopsis: "", imageUrl: "" },
      episodeNumber: 3,
    } as Video;

    render(<VideoCardMeta video={video} />);

    const link = screen.getByRole("link", { name: "Havna vår" });
    expect(link.getAttribute("href")).toBe("/series/4");
    expect(screen.getByText(/episode 3/)).toBeDefined();
  });
});
