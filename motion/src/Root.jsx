import React from "react";
import { Composition } from "remotion";
import { Keyword } from "./Keyword";

export const RemotionRoot = () => {
  return (
    <Composition
      id="Keyword"
      component={Keyword}
      durationInFrames={300}
      fps={30}
      width={480}
      height={864}
      defaultProps={{ text: "", accentWord: "" }}
    />
  );
};
