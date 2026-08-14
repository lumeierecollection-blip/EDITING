#!/usr/bin/env python3
"""Generate B-roll stills with a small open-weight text-to-image model
(stabilityai/sd-turbo, single-/few-step, CPU-feasible) for Remotion to
animate procedurally (Ken Burns pan/zoom). Runs in GitHub Actions, not
in the sandboxed dev session, since it needs Hugging Face access.

Each still is a moody, desaturated cinematic frame matching the video's
dark monochrome caption/B-roll system - not a literal illustration of
the words, just an evocative backdrop for the kinetic-typography text
that sits on top of it.
"""
import os

import torch
from diffusers import AutoPipelineForText2Image

STYLE_SUFFIX = (
    ", cinematic still, moody, desaturated charcoal and warm-grey tones, "
    "soft directional light, shallow depth of field, 35mm film grain, "
    "minimal composition, negative space, no text, no watermark"
)

PROMPTS = [
    {
        "slug": "carry-the-responsibility",
        "prompt": "a single stone resting in open upturned hands" + STYLE_SUFFIX,
    },
    {
        "slug": "proud-of-you",
        "prompt": "warm window light falling across an empty chair in a quiet room"
        + STYLE_SUFFIX,
    },
    {
        "slug": "god-will-receive-me",
        "prompt": "soft light breaking through parted clouds seen through a window"
        + STYLE_SUFFIX,
    },
]

OUT_DIR = os.path.join("motion", "public", "broll-stills")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sd-turbo", torch_dtype=torch.float32
    )
    pipe.to("cpu")

    for item in PROMPTS:
        out_path = os.path.join(OUT_DIR, f"{item['slug']}.png")
        image = pipe(
            prompt=item["prompt"],
            num_inference_steps=2,
            guidance_scale=0.0,
            height=512,
            width=384,
        ).images[0]
        image = image.resize((768, 1024))
        image.save(out_path)
        print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
