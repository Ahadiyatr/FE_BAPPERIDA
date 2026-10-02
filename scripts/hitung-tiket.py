#!/usr/bin/env python3
"""Hitung status tiket dari docs/tickets/register-tiket.md.

Angka jumlah tiket sengaja TIDAK disimpan di dalam register supaya tidak bisa basi —
dulu tabel ringkasannya harus dihitung tangan setiap kali satu tiket ditutup, dan itu
sumber ketidakkonsistenan. Jalankan skrip ini kapan pun angkanya dibutuhkan:

    python3 scripts/hitung-tiket.py
    python3 scripts/hitung-tiket.py --terbuka     # hanya daftar tiket yang belum selesai
    python3 scripts/hitung-tiket.py --json

Satu baris tiket dikenali dari sel pertama tabel yang dimulai dengan ID seperti
`P0-R01` atau `P1-15`, dan statusnya dari penanda ✅ / ⚠️ / ❌ / ⏸️ di sel mana pun pada
baris itu. Baris yang dicoret (~~...~~) tetap terhitung sesuai penandanya.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

REGISTER = Path(__file__).resolve().parent.parent / "docs" / "tickets" / "register-tiket.md"

BARIS_TIKET = re.compile(r"^\|\s*\*{0,2}(P[0-3])-(R?\d+)\*{0,2}\s*(.*?)\s*\|")
URUTAN = ["Selesai", "Sebagian", "Belum", "Ditangguhkan", "Dipindah"]

# Status dibaca dari SEL status, bukan dari penanda pertama yang kebetulan muncul di baris:
# beberapa sel respons memakai ⚠️ sebagai penekanan di tengah prosa, dan membaca baris
# secara utuh membuat tiket itu salah hitung.
#
# Emoji penanda tidak diikat ke bentuk tertentu — register memuat ⏸ maupun ⏸️ (dengan dan
# tanpa variation selector), dan mengikat emojinya membuat baris yang sah terbaca "tanpa
# status". Yang mengikat justru bentuk selnya: hanya hiasan, satu kata status, selesai.
SEL_STATUS = re.compile(
    r"^[^A-Za-z]*(Selesai|Sebagian|Belum|Ditangguhkan|Dipindah)[~*\s.]*$",
    re.IGNORECASE,
)


def status_dari(baris: str) -> str | None:
    """Status dari sel pendek yang isinya memang hanya penanda status."""
    for sel in baris.strip().strip("|").split("|"):
        cocok = SEL_STATUS.match(sel.strip())
        if cocok:
            return cocok.group(1).capitalize()
    return None


def baca(path: Path) -> list[dict]:
    if not path.exists():
        sys.exit(f"Register tidak ditemukan: {path}")

    tiket: list[dict] = []
    terlihat: set[str] = set()

    for nomor, baris in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        cocok = BARIS_TIKET.match(baris)
        if not cocok:
            continue

        prioritas, nomor_tiket, judul = cocok.groups()
        tid = f"{prioritas}-{nomor_tiket}"
        if tid in terlihat:  # baris tiket hanya dihitung sekali
            continue
        terlihat.add(tid)

        status = status_dari(baris)
        if status is None:
            print(f"  ! {tid} (baris {nomor}): tanpa penanda status", file=sys.stderr)
            status = "Tanpa status"

        tiket.append(
            {
                "id": tid,
                "prioritas": prioritas,
                "judul": judul.strip(" *"),
                "status": status,
                "baris": nomor,
            }
        )

    return tiket


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--terbuka", action="store_true", help="hanya tiket yang belum selesai")
    ap.add_argument("--json", action="store_true", help="keluaran JSON")
    arg = ap.parse_args()

    tiket = baca(REGISTER)

    if arg.json:
        print(json.dumps(tiket, ensure_ascii=False, indent=2))
        return 0

    if arg.terbuka:
        # "Terbuka" = pekerjaan yang masih menunggu dikerjakan. Ditangguhkan sedang menunggu
        # keputusan di luar kode, dan Dipindah sudah dilanjutkan tiket lain — keduanya bukan
        # pekerjaan terbuka, jadi dihitung terpisah supaya angkanya tidak menipu.
        terbuka = [t for t in tiket if t["status"] in ("Belum", "Sebagian")]
        lain = [t for t in tiket if t["status"] in ("Ditangguhkan", "Dipindah")]

        print(f"{len(terbuka)} tiket menunggu dikerjakan:\n")
        for t in sorted(terbuka, key=lambda t: (t["prioritas"], t["id"])):
            print(f"  {t['status']:10} {t['id']:8} {t['judul'][:70]}")

        if lain:
            print(f"\n{len(lain)} tiket di luar hitungan itu:\n")
            for t in sorted(lain, key=lambda t: (t["prioritas"], t["id"])):
                print(f"  {t['status']:10} {t['id']:8} {t['judul'][:70]}")
        return 0

    per_prioritas: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for t in tiket:
        per_prioritas[t["prioritas"]][t["status"]] += 1

    kolom = [s for s in URUTAN if any(s in v for v in per_prioritas.values())]
    kolom += sorted({t["status"] for t in tiket} - set(URUTAN))

    lebar = max((len(k) for k in kolom), default=8)
    kepala = "  ".join(f"{k:>{lebar}}" for k in kolom)
    print(f"{'':10}{'Jumlah':>7}  {kepala}")

    total_semua = defaultdict(int)
    for prioritas in sorted(per_prioritas):
        hitung = per_prioritas[prioritas]
        jumlah = sum(hitung.values())
        sel = "  ".join(f"{hitung.get(k, 0):>{lebar}}" for k in kolom)
        print(f"{prioritas:10}{jumlah:>7}  {sel}")
        for k, v in hitung.items():
            total_semua[k] += v

    jumlah = sum(total_semua.values())
    sel = "  ".join(f"{total_semua.get(k, 0):>{lebar}}" for k in kolom)
    print(f"{'TOTAL':10}{jumlah:>7}  {sel}")
    print(f"\nSumber: {REGISTER.relative_to(Path.cwd()) if REGISTER.is_relative_to(Path.cwd()) else REGISTER}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
