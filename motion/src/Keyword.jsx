import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

// Minimal keyword motion graphic: dark background, phrase fades/drifts in
// word by word, one word picked out in accent color. No bounce/scale pop -
// kept deliberately understated to match the caption style.
export const Keyword = ({ text = "", accentWord = "" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.trim().split(/\s+/);

  const fadeIn = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const drift = interpolate(frame, [0, fps * 0.5], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111214",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 90px",
      }}
    >
      <div
        style={{
          opacity: fadeIn,
          transform: `translateY(${drift}px)`,
          fontFamily: "Montserrat, Helvetica, Arial, sans-serif",
          fontWeight: 600,
          fontSize: 64,
          lineHeight: 1.25,
          textAlign: "center",
          color: "#FFFFFF",
        }}
      >
        {words.map((w, i) => {
          const isAccent =
            accentWord && w.toLowerCase().includes(accentWord.toLowerCase());
          return (
            <span
              key={i}
              style={{ color: isAccent ? "#FFD700" : "#FFFFFF" }}
            >
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
