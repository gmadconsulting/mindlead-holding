import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Il marchio non dipende dalla richiesta: lo leggiamo una volta sola.
const markData = await readFile(join(process.cwd(), "public/brand/mindlead-mark-128.png"), "base64");
const markSrc = `data:image/png;base64,${markData}`;

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src={markSrc} width={30} height={30} alt="" />
      </div>
    ),
    { ...size },
  );
}
