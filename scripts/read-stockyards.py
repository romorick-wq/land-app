#!/usr/bin/env python3
"""Read the Stockyards tracking workbook into JSON rows."""

import json
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def column_index(ref: str) -> tuple[int, int]:
    letters = "".join(char for char in ref if char.isalpha())
    row = int("".join(char for char in ref if char.isdigit()))
    index = 0
    for char in letters:
        index = index * 26 + ord(char) - 64
    return index, row


def shared_strings(book: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(book.read("xl/sharedStrings.xml"))
    values = []
    for item in root.findall("m:si", NS):
        values.append("".join(node.text or "" for node in item.findall(".//m:t", NS)))
    return values


def sheet_rows(book: zipfile.ZipFile, sheet: str, strings: list[str]) -> dict[int, dict[int, str]]:
    root = ET.fromstring(book.read(sheet))
    rows: dict[int, dict[int, str]] = {}
    for cell in root.findall(".//m:c", NS):
        ref = cell.attrib.get("r")
        if not ref:
            continue
        column, row = column_index(ref)
        node = cell.find("m:v", NS)
        if node is None or node.text is None:
            value = ""
        elif cell.attrib.get("t") == "s":
            value = strings[int(node.text)]
        else:
            value = node.text
        rows.setdefault(row, {})[column] = value
    return rows


def num(value: str) -> float:
    text = (value or "").strip().replace(",", "").replace("$", "")
    if not text:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def read_sheet(rows: dict[int, dict[int, str]], priority: int) -> list[dict]:
    parsed = []
    for row_number in sorted(key for key in rows if key > 1):
        cells = rows[row_number]
        owner = " ".join((cells.get(11) or "").split())
        township = (cells.get(5) or "").strip()
        if not owner or not township:
            continue
        parsed.append(
            {
                "priority": priority,
                "township": township,
                "range": (cells.get(6) or "").strip(),
                "section": (cells.get(7) or "").strip(),
                "survey": (cells.get(8) or "").strip(),
                "aliquot": (cells.get(9) or "").strip(),
                "parcelId": (cells.get(10) or "").strip(),
                "owner": owner,
                "address": (cells.get(12) or "").strip(),
                "phone": (cells.get(13) or "").strip(),
                "gross": num(cells.get(14, "")),
                "netSurface": num(cells.get(15, "")),
                "netMineral": num(cells.get(16, "")),
                "netGeothermal": num(cells.get(17, "")),
                "lease": (cells.get(18) or "").strip(),
                "title": (cells.get(19) or "").strip(),
                "acquisition": (cells.get(20) or "").strip(),
                "bonus": num(cells.get(21, "")),
                "total": num(cells.get(22, "")),
                "comments": (cells.get(23) or "").strip(),
                "reportUrl": (cells.get(24) or "").strip(),
            }
        )
    return parsed


def main() -> None:
    path = sys.argv[1]
    with zipfile.ZipFile(path) as book:
        strings = shared_strings(book)
        priority_1 = read_sheet(sheet_rows(book, "xl/worksheets/sheet1.xml", strings), 1)
        priority_2 = read_sheet(sheet_rows(book, "xl/worksheets/sheet2.xml", strings), 2)
    json.dump(priority_1 + priority_2, sys.stdout)


if __name__ == "__main__":
    main()
