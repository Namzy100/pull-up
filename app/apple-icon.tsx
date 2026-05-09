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
          background:
            "linear-gradient(145deg, #09090b 0%, #18181b 42%, #86198f 100%)",
          color: "#fafafa",
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: "-0.06em",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        PU
      </div>
    ),
    { ...size }
  );
}
