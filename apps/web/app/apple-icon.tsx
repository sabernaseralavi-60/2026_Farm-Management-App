import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#059669,#047857 55%,#0369a1)",
        }}
      >
        <div style={{ display: "flex", fontSize: 108 }}>🌴</div>
      </div>
    ),
    { ...size },
  );
}
