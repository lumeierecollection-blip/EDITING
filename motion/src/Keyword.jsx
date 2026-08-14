import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  staticFile,
  delayRender,
  continueRender,
} from "remotion";

// Font: Fraunces (warm variable serif) - matches Captions.jsx. The
// content is a personal letter, not a tech-product demo, so the type
// should read human, not robotic.
const fontFamily = "Fraunces Keyword Local";
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
    const handle = delayRender("Loading Fraunces (Keyword)");
    const face = new FontFace(
      fontFamily,
      `url('${staticFile("fonts/Fraunces-SemiBold.ttf")}')`,
      { weight: "600", style: "normal" }
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

// Procedural Ken Burns: slow continuous zoom + diagonal pan across the
// still's full duration. "direction" flips the pan vector so consecutive
// cutaways don't all drift the same way.
const KenBurns = ({ src, totalFrames, frame, direction = 1 }) => {
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const scale = interpolate(progress, [0, 1], [1.08, 1.22]);
  const translateX = interpolate(progress, [0, 1], [0, -18 * direction]);
  const translateY = interpolate(progress, [0, 1], [0, 12]);

  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        }}
      />
      {/* Legibility scrim - the still is a mood backdrop, not the subject */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const Keyword = ({
  text = "",
  totalFrames = 90,
  image = null,
  panDirection = 1,
}) => {
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
      {image && (
        <KenBurns
          src={staticFile(image)}
          totalFrames={totalFrames}
          frame={frame}
          direction={panDirection}
        />
      )}
      <div
        style={{
          position: "relative",
          opacity: exitFade,
          fontFamily,
          fontWeight: 600,
          fontSize: 48,
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          textAlign: "center",
          color: TEXT,
          textShadow: image ? "0 2px 20px rgba(0,0,0,0.6)" : "none",
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
