import { describe, expect, it } from "vitest";
import { splitRtmp, splitSrt } from "./connections";

describe("splitRtmp", () => {
  it("gives the server without a trailing slash and the rest as the stream key", () => {
    expect(splitRtmp("rtmp://live.example.test:1935/contrib/live/x?user=k&pass=s3cret")).toEqual({
      server: "rtmp://live.example.test:1935/contrib/live",
      streamKey: "x?user=k&pass=s3cret",
    });
  });

  it("copes with an address that has no query", () => {
    expect(splitRtmp("rtmp://host/app/key")).toEqual({
      server: "rtmp://host/app",
      streamKey: "key",
    });
  });
});

describe("splitSrt", () => {
  it("takes the stream ID out as written", () => {
    expect(
      splitSrt(
        "srt://live.example.test:8890?streamid=publish:contrib/live/x:k:s3cret&pkt_size=1316",
      ),
    ).toEqual({
      address: "srt://live.example.test:8890",
      streamId: "publish:contrib/live/x:k:s3cret",
    });
  });

  it("has an empty stream ID when the address carries none", () => {
    expect(splitSrt("srt://host:9000")).toEqual({ address: "srt://host:9000", streamId: "" });
  });
});
