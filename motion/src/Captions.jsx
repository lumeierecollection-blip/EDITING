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
import captionsData from "./captions.json";

// Chroma-key background: this composition is composited onto footage via
// ffmpeg colorkey, not real alpha, so the canvas must be a pure key color
// that never appears in the text or footage.
const CHROMA_KEY = "#00FF00"; // greenscreen, so ffmpeg's despill filter can clean spill

// Monochrome, no color hierarchy - no karaoke/CapCut highlight color
// here, ever. Font: Fraunces (warm variable serif, not a grotesk/mono -
// the content is a personal letter, not a tech-product demo, so the
// type should read human rather than robotic).
const fontFamily = "Fraunces Captions Local";
const TEXT_COLOR = "#FAFAF9";

// Font loading is scoped to this component's own mount (not module-level)
// so an unrelated composition sharing this bundle can never block on it.
const useLocalFont = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const handle = delayRender("Loading Fraunces (Captions)");
    const face = new FontFace(
      fontFamily,
      `url('${staticFile("fonts/Fraunces-Medium.ttf")}')`,
      { weight: "500", style: "normal" }
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

// kinetic-typography-skills (iart-ai): word-level mask/clip reveal -
// "most robust... GPU-efficient, artifact-free" - translateY(100%) -> 0
// inside an overflow:hidden parent, ease-out cubic-bezier(0.16,1,0.3,1),
// 400-600ms per fragment.
const REVEAL_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const REVEAL_MS = 420;
const EXIT_MS = 130;

function findActiveChunk(t) {
  for (const c of captionsData) {
    if (t >= c.start && t < c.end) return c;
  }
  return null;
}

const Word = ({ word, frame, fps }) => {
  const revealFrames = fps * (REVEAL_MS / 1000);
  const startFrame = word.start * fps;
  const progress = interpolate(
    frame,
    [startFrame, startFrame + revealFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: REVEAL_EASE }
  );
  const translateY = (1 - progress) * 100;

  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
      <span
        style={{
          display: "inline-block",
          transform: `translateY(${translateY}%)`,
        }}
      >
        {word.text}
      </span>
    </span>
  );
};

export const Captions = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontReady = useLocalFont();
  const t = frame / fps;

  const chunk = findActiveChunk(t);

  return (
    <AbsoluteFill style={{ backgroundColor: CHROMA_KEY }}>
      {fontReady && chunk && (() => {
        const exitFrames = fps * (EXIT_MS / 1000);
        const chunkEndFrame = chunk.end * fps;
        const exitOpacity = interpolate(
          frame,
          [chunkEndFrame - exitFrames, chunkEndFrame],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }
        );
        return (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 130,
              display: "flex",
              justifyContent: "center",
              opacity: exitOpacity,
            }}
          >
            <div
              style={{
                maxWidth: 400,
                fontFamily,
                fontWeight: 500,
                fontSize: 34,
                lineHeight: 1.4,
                letterSpacing: "-0.01em",
                textAlign: "center",
                color: TEXT_COLOR,
                textShadow: "0 1px 12px rgba(0,0,0,0.55)",
              }}
            >
              {chunk.words.map((w, i) => (
                <React.Fragment key={i}>
                  <Word word={w} frame={frame} fps={fps} />
                  {i < chunk.words.length - 1 ? " " : ""}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
