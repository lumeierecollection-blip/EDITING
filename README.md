# EDITING

A Claude Code–driven video editing workspace. No Palmier Pro / macOS required —
edits are done with `ffmpeg` directly in this repo, scripted and reproducible.

## Workflow

1. Drop source footage into `raw/`.
2. Tell Claude in plain English what you want done (trim, cut, concatenate,
   crossfade, add text/captions, color correct, mix audio, change speed,
   export to a given format/resolution, etc.).
3. Claude writes/updates a script in `scripts/` that performs the edit with
   `ffmpeg` (or `ffmpeg` + `python` for anything more involved, e.g. captions
   from a transcript) and runs it.
4. Rendered results land in `output/`.

## Folders

- `raw/` — untouched source clips you drop in. Not modified.
- `scripts/` — one script per edit/project, so every render is reproducible.
- `output/` — rendered results.

## Notes

- Large binary video files are not meant to be committed to git history by
  default (they bloat the repo). Ask if you want them tracked/pushed, or
  keep them local to this session.
- `ffmpeg`/`ffprobe` are installed in this environment.
