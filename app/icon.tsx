import { ImageResponse } from "next/og";

export function generateImageMetadata() {
  return [
    {
      id: "192",
      size: { width: 192, height: 192 },
      contentType: "image/png",
      alt: "Pull Up",
    },
    {
      id: "512",
      size: { width: 512, height: 512 },
      contentType: "image/png",
      alt: "Pull Up",
    },
    {
      id: "maskable",
      size: { width: 512, height: 512 },
      contentType: "image/png",
      alt: "Pull Up",
    },
  ];
}

function PuGlyph({
  fontSize,
  padPct,
}: {
  fontSize: number;
  padPct: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${padPct}%`,
        background: "linear-gradient(145deg, #09090b 0%, #18181b 42%, #86198f 100%)",
        color: "#fafafa",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 800,
          letterSpacing: "-0.06em",
          lineHeight: 1,
        }}
      >
        PU
      </div>
    </div>
  );
}

export default async function Icon({
  id,
}: {
  id: Promise<string | number>;
}) {
  const key = String(await id);
  const pad = key === "maskable" ? 14 : 0;
  const fontSize =
    key === "512" || key === "maskable" ? 200 : key === "192" ? 72 : 72;
  const size =
    key === "192"
      ? { width: 192, height: 192 }
      : { width: 512, height: 512 };

  return new ImageResponse(<PuGlyph fontSize={fontSize} padPct={pad} />, {
    ...size,
  });
}
