import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VideoFileDropzone } from "./VideoFileDropzone";

const Harness = () => {
  const [file, setFile] = useState<File | null>(null);
  return <VideoFileDropzone file={file} onFileChange={setFile} />;
};

afterEach(cleanup);

describe("VideoFileDropzone", () => {
  it("accepts a dropped video and shows its name", () => {
    render(<Harness />);
    const file = new File(["video"], "sending.mxf", { type: "application/mxf" });

    fireEvent.drop(screen.getByRole("button", { name: "Videofil" }), {
      dataTransfer: { files: [file] },
    });

    expect(screen.getByText("sending.mxf")).toBeDefined();
  });

  it("reports file-picker selections", () => {
    const onFileChange = vi.fn();
    const { container } = render(<VideoFileDropzone file={null} onFileChange={onFileChange} />);
    const file = new File(["video"], "sending.mp4", { type: "video/mp4" });

    fireEvent.change(container.querySelector("input")!, { target: { files: [file] } });

    expect(onFileChange).toHaveBeenCalledWith(file);
  });
});
