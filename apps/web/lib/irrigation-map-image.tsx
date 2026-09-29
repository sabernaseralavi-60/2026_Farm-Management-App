import { ImageResponse } from "next/og";
import { IRRIGATION_ZONES } from "./reference-data";

export interface ZoneMapImage {
  zone: number;
  title: string;
  gardenNumbers: number[];
  buffer: Buffer;
}

/** Renders each irrigation zone map that has at least one irrigated garden
 * that day, with a green pin over every irrigated garden — used for the
 * Bale photo attached to irrigation notifications (see lib/notify.ts).
 * Reuses the exact same garden coordinates the in-app garden picker uses
 * (lib/reference-data.ts), so a pin always lands on the right spot.
 * Deliberately modest quality/size — a quick visual reference on a chat
 * app, not a print asset. */
export async function renderIrrigatedZoneMaps(gardens: number[], baseUrl: string): Promise<ZoneMapImage[]> {
  const results: ZoneMapImage[] = [];
  for (const z of IRRIGATION_ZONES) {
    const hits = z.gardens.filter((g) => gardens.includes(g.n));
    if (hits.length === 0) continue;

    const img = new ImageResponse(
      (
        <div style={{ position: "relative", width: z.width, height: z.height, display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by satori, not the browser */}
          <img
            src={`${baseUrl}${z.image}`}
            alt=""
            width={z.width}
            height={z.height}
            style={{ position: "absolute", top: 0, left: 0 }}
          />
          {hits.map((g) => (
            <div
              key={g.n}
              style={{
                position: "absolute",
                left: `${g.x}%`,
                top: `${g.y}%`,
                marginLeft: -22,
                marginTop: -22,
                width: 44,
                height: 44,
                borderRadius: 9999,
                background: "rgba(5,150,105,0.92)",
                border: "4px solid white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {g.n}
            </div>
          ))}
        </div>
      ),
      { width: z.width, height: z.height },
    );
    const buffer = Buffer.from(await img.arrayBuffer());
    results.push({ zone: z.zone, title: z.title, gardenNumbers: hits.map((g) => g.n).sort((a, b) => a - b), buffer });
  }
  return results;
}
