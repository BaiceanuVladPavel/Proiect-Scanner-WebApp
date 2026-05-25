import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

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
          background:
            "radial-gradient(circle at top, rgba(34,211,238,0.35), transparent 35%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
          color: "white",
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: -4,
        }}
      >
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 36,
            border: "8px solid rgba(103,232,249,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 36px rgba(34,211,238,0.28)",
            background: "rgba(15,23,42,0.72)",
          }}
        >
          S
        </div>
      </div>
    ),
    size,
  );
}
