import React, { useEffect, useState } from "react";
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

// Single typeface, single size, single weight - no hierarchy through
// typography, no ornamentation (no rules, no kickers, no borders-as-
// decoration). Font: Space Grotesk Bold (motion-skills / kinetic-
// typography-skills - a grotesk built for display/kinetic use).
const fontFamily = "Space Grotesk Keyword Local";
const BG = "#0C0A09";
const TEXT = "#FAFAF9";

// kinetic-typography-skills (iart-ai): word-level mask/clip reveal,
// ease-out cubic-bezier(0.16,1,0.3,1), 400-600ms per fragment,
// 40-70ms word stagger.
const REVEAL_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const REVEAL_MS = 480;
const STAGGER_MS = 55;
const FADE_OUT_FRAMES = 12;

const useLocalFont = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const handle = delayRender("Loading Space Grotesk (Keyword)");
    const face = new FontFace(
      fontFamily,
      `url('${staticFile("fonts/SpaceGrotesk-Bold.ttf")}')`,
      { weight: "700", style: "normal" }
    );
    face
      .load()
      .then((f) => {
        document.fonts.add(f);
        setReady(true);
        continueRender(handle);
      })
      .catch(() => {
        setReady(true);
        continueRender(handle);
      });
  }, []);
  return ready;
};

const Word = ({ text, index, frame, fps }) => {
  const revealFrames = fps * (REVEAL_MS / 1000);
  const startFrame = index * fps * (STAGGER_MS / 1000);
  const progress = interpolate(
    frame,
    [startFrame, startFrame + revealFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: REVEAL_EASE }
  );
  const translateY = (1 - progress) * 100;
  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
      <span style={{ display: "inline-block", transform: `translateY(${translateY}%)` }}>
        {text}
      </span>
    </span>
  );
};

export const Keyword = ({ text = "", totalFrames = 90 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontReady = useLocalFont();
  const words = text.trim().split(/\s+/);

  const exitFade = interpolate(
    frame,
    [totalFrames - FADE_OUT_FRAMES, totalFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }
  );

  if (!fontReady) {
    return <AbsoluteFill style={{ backgroundColor: BG }} />;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          opacity: exitFade,
          fontFamily,
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          textAlign: "center",
          color: TEXT,
        }}
      >
        {words.map((w, i) => (
          <React.Fragment key={i}>
            <Word text={w} index={i} frame={frame} fps={fps} />
            {i < words.length - 1 ? " " : ""}
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};
