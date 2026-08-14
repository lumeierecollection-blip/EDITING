import React from "react";
import { Composition } from "remotion";
import { Keyword } from "./Keyword";
import { Captions } from "./Captions";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Keyword"
        component={Keyword}
        durationInFrames={300}
        fps={30}
        width={480}
        height={864}
        defaultProps={{ text: "", totalFrames: 90, image: null, panDirection: 1 }}
      />
      <Composition
        id="Captions"
        component={Captions}
        durationInFrames={3509}
        fps={30}
        width={480}
        height={864}
      />
    </>
  );
};
