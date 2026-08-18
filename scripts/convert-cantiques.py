"""Convertit un recueil de cantiques au format Word (.docx) vers le JSON
consommé par l'application.

    python scripts/convert-cantiques.py <source.docx> <sortie.json>

Le document source n'a pas de structure typographique exploitable : les
cantiques y sont séparés par des lignes vides et les strophes par une ligne
vide simple. La conversion repose donc sur cette mise en page, pas sur des
styles. Voir CANTIQUES.md pour ce que le résultat garantit — et ne garantit
pas.
"""

import html
import json
import re
import sys
import unicodedata
import zipfile

# Un paragraphe est tenu pour anglais au-delà de ce taux de mots outils.
EN_WORDS = set(
    "the i will my and of to he his you your we is are that this with for in "
    "be a not it me him her them our us have has all who what when there they "
    "so no oh let come lord god jesus praise sing name holy".split()
)
EN_RATIO = 0.34


def docx_text(path):
    xml = zipfile.ZipFile(path).read("word/document.xml").decode("utf-8")
    xml = xml.replace("</w:p>", "\n")
    xml = re.sub(r"<w:br[^>]*/>", "\n", xml)
    return html.unescape(re.sub(r"<[^>]+>", "", xml))


def split_songs(text):
    """Un cantique par bloc séparé d'au moins trois lignes vides."""
    songs, current, blank = [], [], 0
    for line in text.split("\n"):
        if line.strip() == "":
            blank += 1
            if blank >= 3 and current:
                songs.append(current)
                current = []
        else:
            if blank >= 1 and current:
                current.append("")
            blank = 0
            current.append(line.rstrip())
    if current:
        songs.append(current)
    return [s for s in songs if any(l.strip() for l in s)]


def is_english(paragraph):
    words = re.findall(r"[a-zA-Z']+", paragraph.lower())
    if len(words) < 5:
        return False
    return sum(1 for w in words if w in EN_WORDS) / len(words) > EN_RATIO


def slug(title):
    plain = unicodedata.normalize("NFD", title)
    plain = "".join(c for c in plain if unicodedata.category(c) != "Mn")
    plain = re.sub(r"[^a-zA-Z0-9]+", "-", plain).strip("-").lower()
    return plain[:48] or "cantique"


def build_song(block, seen):
    title = block[0].strip()
    body = "\n".join(block[1:])
    paragraphs = [p.strip("\n") for p in body.split("\n\n") if p.strip()]

    french, english = [], []
    for paragraph in paragraphs:
        # Marqueur explicite, présent sur une poignée de cantiques seulement.
        marker = re.match(r"^\s*refrain\s*:?\s*\n?", paragraph, re.I)
        if marker:
            text = paragraph[marker.end():].strip()
            if text:
                french.append(("refrain", text))
            continue
        (english if is_english(paragraph) else french).append(("strophe", paragraph))

    parts, verse = [], 0
    # Les couplets anglais suivent les français : l'assemblée chante en
    # français d'abord, et l'opérateur ne doit pas tomber dessus par surprise.
    for kind, text in french + english:
        if kind == "refrain":
            parts.append({"kind": "refrain", "body": text})
        else:
            verse += 1
            parts.append({"kind": "strophe", "number": verse, "body": text})

    identifier = slug(title)
    if identifier in seen:
        seen[identifier] += 1
        identifier = f"{identifier}-{seen[identifier]}"
    else:
        seen[identifier] = 1

    return {"id": identifier, "title": title, "parts": parts}


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    source, output = sys.argv[1], sys.argv[2]

    blocks = split_songs(docx_text(source))
    seen = {}
    songs = [build_song(b, seen) for b in blocks]
    songs = [s for s in songs if s["parts"]]

    book = {
        "id": "cmr",
        "name": "Recueil CMR",
        "note": (
            "Converti automatiquement depuis un document Word. Le document "
            "source ne marque pas les refrains : sauf mention explicite, "
            "toutes les parties sont numérotées comme des strophes et "
            "projetées dans l'ordre du document. Les couplets anglais "
            "suivent les français. Corriger un cantique se fait dans la "
            "régie, bouton « Cantiques »."
        ),
        "songs": songs,
    }
    with open(output, "w", encoding="utf-8") as f:
        json.dump(book, f, ensure_ascii=False, indent=1)

    refrains = sum(1 for s in songs for p in s["parts"] if p["kind"] == "refrain")
    anglais = sum(1 for b, s in zip(blocks, songs) if len(s["parts"]) and any(
        is_english(p["body"]) for p in s["parts"]))
    print(f"{len(songs)} cantiques, {sum(len(s['parts']) for s in songs)} parties")
    print(f"  refrains explicites : {refrains}")
    print(f"  cantiques avec des couplets anglais : {anglais}")


if __name__ == "__main__":
    main()
