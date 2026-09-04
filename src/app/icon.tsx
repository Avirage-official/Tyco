import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#211c18",
          borderRadius: 6,
          position: "relative",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", color: "#f4ecdc", fontSize: 20, fontWeight: 700 }}>
          T
        </div>
        <div
          style={{
            position: "absolute",
            width: 4,
            height: 4,
            borderRadius: 999,
            background: "#d8402f",
            right: 6,
            bottom: 7,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
