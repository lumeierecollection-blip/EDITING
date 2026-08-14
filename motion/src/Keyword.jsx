import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  staticFile,
  delayRender,
  continueRender,
} from "remotion";

// Self-hosted (not fetched from Google Fonts at render time - the sandboxed
// render browser doesn't trust the outbound TLS proxy for third-party CDNs).
const newsreaderFamily = "Newsreader Italic Local";
const geistFamily = "Geist Medium Local";

const newsreaderHandle = delayRender("Loading Newsreader");
const geistHandle = delayRender("Loading Geist");

const newsreaderFace = new FontFace(
  newsreaderFamily,
  `url('${staticFile("fonts/Newsreader-Italic.ttf")}')`,
  { style: "italic", weight: "400" }
);
const geistFace = new FontFace(
  geistFamily,
  `url('${staticFile("fonts/Geist-Medium.ttf")}')`,
  { weight: "500" }
);

newsreaderFace
  .load()
  .then((f) => {
    document.fonts.add(f);
    continueRender(newsreaderHandle);
  })
  .catch(() => continueRender(newsreaderHandle));
geistFace
  .load()
  .then((f) => {
    document.fonts.add(f);
    continueRender(geistHandle);
  })
  .catch(() => continueRender(geistHandle));

// Premium/Elegance motion archetype (motion-design-skill):
// 500-600ms entrance, cubic-bezier(0.4,0,0.2,1), 0% overshoot, gentle arc.
// Minimalist editorial palette (open-design minimalist-skill):
// warm bone canvas, charcoal ink, single muted pastel accent, hairline rule.
const PREMIUM_EASE = Easing.bezier(0.4, 0, 0.2, 1);
const FADE_OUT_FRAMES = 12;

export const Keyword = ({
  text = "",
  accentWord = "",
  totalFrames = 90,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.trim().split(/\s+/);

  const entranceFrames = fps * 0.55; // 550ms, Premium archetype

  const entranceFade = interpolate(frame, [0, entranceFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: PREMIUM_EASE,
  });
  const exitFade = interpolate(
    frame,
    [totalFrames - FADE_OUT_FRAMES, totalFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }
  );
  const opacity = Math.min(entranceFade, exitFade);

  // Primary: gentle vertical settle with a slight horizontal arc, no overshoot.
  const driftY = interpolate(frame, [0, entranceFrames], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: PREMIUM_EASE,
  });
  const arcMidX = interpolate(
    frame,
    [0, entranceFrames / 2, entranceFrames],
    [0, 8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: PREMIUM_EASE }
  );

  // Secondary layer: hairline rule draws in ~100ms after the primary lands.
  const ruleDelay = fps * 0.1;
  const ruleWidth = interpolate(
    frame,
    [entranceFrames + ruleDelay, entranceFrames + ruleDelay + fps * 0.4],
    [0, 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: PREMIUM_EASE }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#F7F6F3",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 88px",
      }}
    >
      {/* Ambient layer: static low-opacity radial gradient for depth, no empty flatness */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 60%)",
        }}
      />
      <div
        style={{
          opacity,
          transform: `translate(${arcMidX}px, ${driftY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: newsreaderFamily,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 62,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            textAlign: "center",
            color: "#111111",
          }}
        >
          {words.map((w, i) => {
            const isAccent =
              accentWord && w.toLowerCase().includes(accentWord.toLowerCase());
            return (
              <span key={i} style={{ color: isAccent ? "#8A5A00" : "#111111" }}>
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 22,
            width: `${ruleWidth}%`,
            maxWidth: 220,
            height: 1,
            backgroundColor: "rgba(0,0,0,0.18)",
          }}
        />
        <div
          style={{
            marginTop: 18,
            opacity: ruleWidth > 0 ? Math.min(ruleWidth / 40, 1) : 0,
            fontFamily: geistFamily,
            fontWeight: 500,
            fontSize: 15,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#787774",
          }}
        >
          dear younger me
        </div>
      </div>
    </AbsoluteFill>
  );
};
