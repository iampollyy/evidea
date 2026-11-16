"""Generate SQL that loads Orphanet disorders (en_product4.xml) into the Diseases table.

Usage (from backend/db):
    python3 seeds/import_orphanet.py path/to/en_product4.xml | psql "$DATABASE_URL" -v ON_ERROR_STOP=1

The output is idempotent: existing diseases are updated by orpha_code.
New diseases are inserted with is_active = FALSE; enable the supported set explicitly.
"""

import sys
import xml.etree.ElementTree as ET


def sql_text(value):
    return "'" + value.replace("'", "''") + "'"


def main(path):
    root = ET.parse(path).getroot()
    version = root.get("version", "unknown")
    export_date = root.get("date", "unknown")

    disorders = {}
    for disorder in root.iter("Disorder"):
        code = disorder.findtext("OrphaCode")
        name = disorder.findtext("Name")
        if code and name:
            disorders[f"ORPHA:{code.strip()}"] = name.strip()

    print("BEGIN;")
    print("INSERT INTO diseases (orpha_code, name, is_active) VALUES")
    rows = [f"    ({sql_text(code)}, {sql_text(name)}, FALSE)" for code, name in sorted(disorders.items())]
    print(",\n".join(rows))
    print("ON CONFLICT (orpha_code) DO UPDATE SET name = EXCLUDED.name, updated_at = now();")
    message = (
        f"Orphanet import: {len(disorders)} disorders from en_product4.xml, "
        f"version {version}, export date {export_date}"
    )
    print(
        "INSERT INTO system_logs (log_lvl, message) VALUES "
        f"('INFO', {sql_text(message)});"
    )
    print("COMMIT;")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: import_orphanet.py path/to/en_product4.xml")
    main(sys.argv[1])
