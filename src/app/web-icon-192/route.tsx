import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", color: "#f6f5f7", fontSize: 100, fontWeight: 700 }}>
          T
        </div>
        <div
          style={{
            position: "absolute",
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "#d8402f",
            right: 36,
            bottom: 40,
          }}
        />
      </div>
    ),
    { width: 192, height: 192 }
  );
}
