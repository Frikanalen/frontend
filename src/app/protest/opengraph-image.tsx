import { ImageResponse } from "next/og";

export const alt = "Frikanalen går i svart i protest mot udemokratisk overtakelse av kanalen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Link-preview card for /protest: the headline in white on black, matching the
// statement shown on air.
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#000",
        color: "#fff",
      }}
    >
      <div style={{ fontSize: 32, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7 }}>
        Frikanalen
      </div>
      <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.15 }}>{alt}</div>
      <div style={{ fontSize: 30, opacity: 0.7 }}>frikanalen.no/protest</div>
    </div>,
    size,
  );
}
