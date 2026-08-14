#!/usr/bin/env python3
"""Build word-level timing mapped onto the jump-cut timeline, then emit
caption data as JSON for the Remotion kinetic-typography caption
composition (motion-skills / kinetic-typography-skills: mask-reveal per
word, no karaoke color-sweep, no CapCut-style highlight)."""
import argparse
import json
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


def build_json(chunks):
    out = []
    for group in chunks:
        if not group:
            continue
        chunk_start = group[0][1]
        chunk_end = group[-1][2]
        if chunk_end <= chunk_start:
            continue
        out.append({
            "start": round(chunk_start, 3),
            "end": round(chunk_end, 3),
            "words": [
                {"text": w, "start": round(s, 3), "end": round(e, 3)}
                for (w, s, e) in group
            ],
        })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep-segments", default="scripts/keep_segments.tsv")
    ap.add_argument("--transcript", default="scripts/transcript.tsv")
    ap.add_argument("--out", default="scripts/captions.json")
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
    data = build_json(chunks)
    with open(args.out, "w") as f:
        json.dump(data, f, indent=2)
    print(f"words={len(words)} chunks={len(data)} -> {args.out}")


if __name__ == "__main__":
    main()
