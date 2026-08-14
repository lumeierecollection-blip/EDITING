#!/usr/bin/env python3
"""Remove excess silence/breath gaps from a talking-head clip.

Gaps shorter than --min-gap are left alone (natural speech pauses).
Gaps at or above --min-gap are shortened to --keep-pad seconds instead
of being cut entirely, so cuts don't feel jarring.
"""
import argparse
import re
import subprocess
import sys


def detect_silences(path, noise_db, min_silence):
    cmd = [
        "ffmpeg", "-i", path,
        "-af", f"silencedetect=noise={noise_db}dB:d={min_silence}",
        "-f", "null", "-",
    ]
    out = subprocess.run(cmd, capture_output=True, text=True).stderr
    starts = [float(m) for m in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(m) for m in re.findall(r"silence_end: ([\d.]+)", out)]
    # silence_end lines carry duration too; ends list already aligned to starts
    # in emission order for non-overlapping windows.
    pairs = list(zip(starts, ends))
    return pairs


def get_duration(path):
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
           "-of", "csv=p=0", path]
    return float(subprocess.run(cmd, capture_output=True, text=True).stdout.strip())


def build_keep_segments(duration, silences, min_gap, keep_pad):
    cuts = []  # (cut_start, cut_end) regions to REMOVE
    for s, e in silences:
        gap = e - s
        if gap >= min_gap:
            cut_start = s + keep_pad / 2
            cut_end = e - keep_pad / 2
            if cut_end > cut_start:
                cuts.append((cut_start, cut_end))
    keep = []
    cursor = 0.0
    for cut_start, cut_end in cuts:
        if cut_start > cursor:
            keep.append((cursor, cut_start))
        cursor = max(cursor, cut_end)
    if cursor < duration:
        keep.append((cursor, duration))
    return keep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--noise-db", default="-35")
    ap.add_argument("--min-silence", type=float, default=0.35,
                     help="min duration (s) for ffmpeg silencedetect to flag a gap")
    ap.add_argument("--min-gap", type=float, default=0.45,
                     help="gaps shorter than this are left untouched")
    ap.add_argument("--keep-pad", type=float, default=0.15,
                     help="seconds of silence to leave at each shortened gap")
    ap.add_argument("--dump-segments", help="write kept segment timestamps to this file")
    args = ap.parse_args()

    duration = get_duration(args.input)
    silences = detect_silences(args.input, args.noise_db, args.min_silence)
    keep = build_keep_segments(duration, silences, args.min_gap, args.keep_pad)

    removed = duration - sum(e - s for s, e in keep)
    print(f"duration={duration:.2f}s  silence_windows={len(silences)}  "
          f"kept_segments={len(keep)}  removed={removed:.2f}s", file=sys.stderr)

    if args.dump_segments:
        with open(args.dump_segments, "w") as f:
            for s, e in keep:
                f.write(f"{s:.3f}\t{e:.3f}\n")

    filter_parts = []
    concat_inputs = []
    for i, (s, e) in enumerate(keep):
        filter_parts.append(f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{i}]")
        filter_parts.append(f"[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS[a{i}]")
        concat_inputs.append(f"[v{i}][a{i}]")
    filter_complex = ";".join(filter_parts)
    filter_complex += f";{''.join(concat_inputs)}concat=n={len(keep)}:v=1:a=1[outv][outa]"

    cmd = [
        "ffmpeg", "-y", "-i", args.input,
        "-filter_complex", filter_complex,
        "-map", "[outv]", "-map", "[outa]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        args.output,
    ]
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()
