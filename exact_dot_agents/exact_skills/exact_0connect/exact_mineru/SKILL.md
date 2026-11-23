---
name: mineru
description: Use MinerU when reading, parsing, OCR, searching, inspecting documents.
---

# MinerU

Use `uvx` for isolated MinerU commands.

## PDF Reading

Use stateless `mineru-kit parse` for ordinary PDFs. It uses local Standard parsing, writes Markdown, reads all PDF pages by default, and does not start Doclib.

```bash
uvx --from mineru mineru-kit parse .agents/notes/research/standard-parts/datasheets/AS5047P_DS000324.pdf -o .agents/tmp/AS5047P.md --tier standard
```

Set a task-appropriate output path and do not overwrite unrelated files. Add `--pages 1-10` for a bounded read. Omit `--tier standard` only when relying on the CLI default. The Markdown format is the default, so do not add `--format`.

Markdown embeds PDF images as data URIs, which can make image-heavy output large. Use `--format zip` only when separate image assets are preferable, then extract the archive and read `markdown.md` beside its `images/` directory.

If Standard models are missing, ask before downloading them. Standard and Advanced share a model set; Advanced does not require a separate model download.

## Doclib

Use Doclib only for indexed search, cached reads, or stable page/block locators. It is a background service and is not needed for ordinary PDF conversion.

```bash
uvx mineru server status --json
uvx mineru server start
uvx mineru server stop
```

Check status first and start only if stopped. **Stop Doclib when the task is finished, even if it was already running beforehand.** Do not leave MinerU resident in the background or kill its processes by name.

For Doclib parsing, use `--json` for control flow, show only `.content.content`, and follow the exact `next_request` locator/page range. Do not expose raw JSON envelopes or guess continuation pages.

Stable locators look like `doc:{short_id}/tier:{tier}/page:{page_no}/block:{block_no}`. Use `mineru read <locator>` for follow-up reads and `--format image` when the source image is needed.

## Quality And Accuracy

Use Standard for normal active reading. Advanced is slower and spends more inference compute, and it is not uniformly more accurate. A Standard Doclib service ceiling does not accept Advanced requests; enabling Advanced requires `parse_server.local.managed_tier=advanced`, a persistent configuration change that needs user approval. It still uses the Standard model set.

For important specifications, formulas, tables, or figures, inspect the source page when extraction is ambiguous. Chart curves converted to numeric tables can be wrong; verify such values against the image.

Read plain-text files directly instead of sending them to MinerU. Local Office and other native document formats use Flash; PDF and images support all tiers.
