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
          background: "#100e0d",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", color: "#f4ecdc", fontSize: 268, fontWeight: 700 }}>
          T
        </div>
        <div
          style={{
            position: "absolute",
            width: 58,
            height: 58,
            borderRadius: 999,
            background: "#d8402f",
            right: 96,
            bottom: 106,
          }}
        />
      </div>
    ),
    { width: 512, height: 512 }
  );
}
