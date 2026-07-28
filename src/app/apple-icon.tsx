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
          background: "#100e0d",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", color: "#f4ecdc", fontSize: 96, fontWeight: 700 }}>
          T
        </div>
        <div
          style={{
            position: "absolute",
            width: 20,
            height: 20,
            borderRadius: 999,
            background: "#d8402f",
            right: 34,
            bottom: 38,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
