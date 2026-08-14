#!/usr/bin/env python3
"""Build word-level timing mapped onto the jump-cut timeline, then emit
a minimal CapCut-style ASS caption file (small word groups, current word
highlighted, no bounce/scale animation)."""
import argparse
import re

TRIM_START = 0.8  # matches -ss used when producing clip1_trimmed_normalized.mp4


def load_keep_segments(path):
    segs = []
    with open(path) as f:
        for line in f:
            s, e = line.strip().split("\t")
            segs.append((float(s), float(e)))
    return segs


def make_mapper(segs):
    cum = []
    total = 0.0
    for s, e in segs:
        cum.append(total)
        total += e - s

    def mapper(t):
        for i, (s, e) in enumerate(segs):
            if t < s:
                return cum[i]
            if s <= t <= e:
                return cum[i] + (t - s)
        return total

    return mapper


def load_transcript(path):
    segs = []
    with open(path) as f:
        for line in f:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            start, end, text = line.split("\t", 2)
            segs.append((float(start), float(end), text.strip()))
    return segs


def words_with_timing(transcript_segs, mapper):
    words = []
    for orig_start, orig_end, text in transcript_segs:
        t_start = max(0.0, orig_start - TRIM_START)
        t_end = max(0.0, orig_end - TRIM_START)
        toks = text.split()
        weights = [len(w) + 1 for w in toks]
        total_w = sum(weights)
        span = t_end - t_start
        cursor = t_start
        for w, wt in zip(toks, weights):
            dur = span * (wt / total_w)
            w_start = cursor
            w_end = cursor + dur
            cursor = w_end
            words.append((w, mapper(w_start), mapper(w_end)))
    return words


def chunk_words(words, per_chunk=3):
    chunks = []
    for i in range(0, len(words), per_chunk):
        group = words[i:i + per_chunk]
        chunks.append(group)
    return chunks


def fmt_ass_time(t):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return f"{h:d}:{m:02d}:{s:05.2f}"


ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Montserrat,58,&H00FFFFFF,&H0000D7FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,0,2,60,60,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def build_ass(chunks):
    lines = [ASS_HEADER]
    for group in chunks:
        if not group:
            continue
        chunk_start = group[0][1]
        chunk_end = group[-1][2]
        if chunk_end <= chunk_start:
            continue
        for i, (word, w_start, w_end) in enumerate(group):
            parts = []
            for j, (w2, _, _) in enumerate(group):
                if j == i:
                    parts.append("{\\c&H00D7FF&}" + w2 + "{\\c&HFFFFFF&}")
                else:
                    parts.append(w2)
            text = " ".join(parts)
            seg_start = w_start
            seg_end = group[i + 1][1] if i + 1 < len(group) else chunk_end
            if seg_end <= seg_start:
                seg_end = seg_start + 0.05
            lines.append(
                f"Dialogue: 0,{fmt_ass_time(seg_start)},{fmt_ass_time(seg_end)},"
                f"Caption,,0,0,0,,{text}"
            )
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep-segments", default="scripts/keep_segments.tsv")
    ap.add_argument("--transcript", default="scripts/transcript.tsv")
    ap.add_argument("--out", default="scripts/captions.ass")
    ap.add_argument("--words-per-chunk", type=int, default=3)
    ap.add_argument("--dump-words", default=None)
    args = ap.parse_args()

    segs = load_keep_segments(args.keep_segments)
    mapper = make_mapper(segs)
    transcript = load_transcript(args.transcript)
    words = words_with_timing(transcript, mapper)

    if args.dump_words:
        with open(args.dump_words, "w") as f:
            for w, s, e in words:
                f.write(f"{s:.2f}\t{e:.2f}\t{w}\n")

    chunks = chunk_words(words, args.words_per_chunk)
    ass = build_ass(chunks)
    with open(args.out, "w") as f:
        f.write(ass)
    print(f"words={len(words)} chunks={len(chunks)} -> {args.out}")


if __name__ == "__main__":
    main()
