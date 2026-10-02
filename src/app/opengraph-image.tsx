import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const markData = await readFile(join(process.cwd(), "public/brand/mindlead-mark.png"), "base64");
const markSrc = `data:image/png;base64,${markData}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAFAF9",
          padding: "72px",
        }}
      >
        <img src={markSrc} width={96} height={96} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: "#6E6D69" }}>MINDLEAD GROUP</div>
          <div
            style={{
              marginTop: 28,
              fontSize: 76,
              lineHeight: 0.95,
              letterSpacing: -2,
              color: "#0E0E0D",
              maxWidth: 900,
            }}
          >
            We build software companies.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
