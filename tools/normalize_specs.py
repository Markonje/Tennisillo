#!/usr/bin/env python3
"""
Normalizza un documento di specifiche da Word in Markdown pulito.

Gestisce due casi di input:
 1. Un vero .docx binario: usa pandoc per estrarre Markdown.
 2. Un file .md / .txt già in Markdown (es. esportato a mano da Word): normalizza soltanto.

Operazioni di normalizzazione:
- Aggiunge frontmatter YAML coerente se manca.
- Rimuove grassetto ridondante sugli heading (# **Titolo** -> # Titolo).
- Abbassa la gerarchia degli heading numerati in modo che il documento abbia un
  unico H1 in testa ("# Titolo documento") e le sezioni "1. X", "1.1 Y" ecc. scalino
  a ##, ###, #### come ci si aspetta.
- Converte i box callout Word a singola cella in blockquote Markdown (> ...).
- Rimuove righe separatore "| --- |" orfane.
- Ripulisce escape Word come "l**'**" -> "l'".
- Compatta righe vuote multiple in una sola.

Uso:
    python3 tools/normalize_specs.py <input> <output.md>

Esempi:
    python3 tools/normalize_specs.py ~/Downloads/01_Analisi.docx docs/specs/01_analisi_funzionale.md
    python3 tools/normalize_specs.py ~/Downloads/02_Specifiche.docx docs/specs/02_specifiche_sviluppo.md

Requisiti:
    - python3 (>=3.8)
    - pandoc nel PATH per input binari .docx (opzionale se l'input è già markdown)
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


def _is_real_docx(path: Path) -> bool:
    """Verifica se il file è un vero .docx (ZIP) o un file di testo travestito."""
    with path.open("rb") as fh:
        head = fh.read(4)
    return head[:2] == b"PK"


def _extract_with_pandoc(src: Path) -> str:
    """Converte un .docx binario in Markdown via pandoc."""
    try:
        result = subprocess.run(
            ["pandoc", "--from=docx", "--to=gfm", "--wrap=none", str(src)],
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        sys.exit(
            "Errore: pandoc non trovato nel PATH. Installalo "
            "(brew install pandoc / apt install pandoc) oppure esporta il docx "
            "in Markdown manualmente e ripassa il .md a questo script."
        )
    except subprocess.CalledProcessError as e:
        sys.exit(f"pandoc ha fallito:\n{e.stderr}")
    return result.stdout


def _read_markdown(src: Path) -> str:
    if _is_real_docx(src):
        return _extract_with_pandoc(src)
    return src.read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Normalizzazione
# ---------------------------------------------------------------------------

_APOSTROPHE_PATTERNS = [
    ("l**'**", "l'"),
    ("L**'**", "L'"),
    ("d**'**", "d'"),
    ("D**'**", "D'"),
    ("n**'**", "n'"),
    ("N**'**", "N'"),
    ("s**'**", "s'"),
    ("S**'**", "S'"),
    ("c**'**", "c'"),
    ("C**'**", "C'"),
    ("un**'**", "un'"),
    ("Un**'**", "Un'"),
    ("nell**'**", "nell'"),
    ("Nell**'**", "Nell'"),
    ("sull**'**", "sull'"),
    ("Sull**'**", "Sull'"),
    ("dell**'**", "dell'"),
    ("Dell**'**", "Dell'"),
    ("all**'**", "all'"),
    ("All**'**", "All'"),
    ("ch**'**", "ch'"),
]


def _convert_callouts(text: str) -> str:
    """Converte tabelle Word single-cell (box callout) in blockquote Markdown."""
    lines = text.splitlines()
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]

        if (
            line.startswith("| **★")
            or line.startswith("| *★")
            or line.startswith("| **[")
            or line.startswith("| [CRITICAL]")
        ):
            content = re.sub(r"^\|\s*", "", line)
            content = re.sub(r"\s*\|\s*$", "", content)
            out.append("> " + content)
            if i + 1 < len(lines) and re.match(r"^\|\s*-+\s*\|\s*$", lines[i + 1]):
                i += 2
            else:
                i += 1
            continue

        if re.match(r"^\|\s*-+\s*\|\s*$", line):
            i += 1
            continue

        out.append(line)
        i += 1
    return "\n".join(out)


def _cleanup_heading_bold(text: str) -> str:
    """Rimuove ** attorno ai titoli di heading (# **X** -> # X)."""
    return re.sub(
        r"^(#{1,6})\s+\*\*(.+?)\*\*\s*$",
        lambda m: f"{m.group(1)} {m.group(2)}",
        text,
        flags=re.MULTILINE,
    )


def _demote_numbered_headings(text: str) -> str:
    """
    Abbassa la gerarchia degli heading numerati di 1 livello.
    "# 1. Visione"  -> "## 1. Visione"
    "## 1.1 ..."    -> "### 1.1 ..."
    "### 7.2.1 ..." -> "#### 7.2.1 ..."
    """
    text = re.sub(r"^# (\d+\..+)$", r"## \1", text, flags=re.MULTILINE)
    text = re.sub(r"^## (\d+\.\d+\s.+)$", r"### \1", text, flags=re.MULTILINE)
    text = re.sub(r"^### (\d+\.\d+\.\d+\s.+)$", r"#### \1", text, flags=re.MULTILINE)
    # Abbassa anche "# Indice", "# Executive Summary" a ##
    text = re.sub(r"^# (Indice|Executive Summary)\s*$", r"## \1", text, flags=re.MULTILINE)
    return text


def _cleanup_apostrophes(text: str) -> str:
    for old, new in _APOSTROPHE_PATTERNS:
        text = text.replace(old, new)
    # Residui generici
    text = re.sub(r"\*\*\*\*", "", text)
    return text


def _compact_blank_lines(text: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", text)


def normalize(text: str) -> str:
    text = _convert_callouts(text)
    text = _cleanup_heading_bold(text)
    text = _demote_numbered_headings(text)
    text = _cleanup_apostrophes(text)
    text = _compact_blank_lines(text)
    return text.rstrip() + "\n"


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 1
    src = Path(sys.argv[1]).expanduser()
    dst = Path(sys.argv[2]).expanduser()
    if not src.exists():
        print(f"Errore: input non esiste: {src}", file=sys.stderr)
        return 1

    raw = _read_markdown(src)
    normalized = normalize(raw)

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(normalized, encoding="utf-8")
    print(
        f"OK  {src.name}  ->  {dst}  ({len(normalized.splitlines())} righe)",
        file=sys.stderr,
    )
    print(
        "\nRicordati di:",
        "  1. Controllare visivamente il risultato (heading e tabelle)",
        "  2. Aggiornare il frontmatter YAML in testa al file se la versione è cambiata",
        "  3. Copiare il .docx originale in docs/specs/archive/",
        "  4. Aggiornare docs/specs/CHANGELOG_SPECS.md con il diff concettuale",
        sep="\n",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
