import csv
from dataclasses import dataclass
from pathlib import Path

import requests

API_BASE = "http://localhost:8000/api"


@dataclass
class ZoneSeed:
    name: str
    slug: str
    color: str | None = None
    icon: str | None = None
    description: str | None = None


ZONES = [
    ZoneSeed("Command Center", "command-center", "#ffb703", "inbox", "Universal inbox"),
    ZoneSeed("Work", "work", "#219ebc", "briefcase", "Client + admin work"),
    ZoneSeed("Home", "home", "#8ecae6", "home", "House logistics, bills, errands"),
    ZoneSeed("Projects", "projects", "#fb8500", "wrench", "Creative builds and tinkering"),
    ZoneSeed("Self", "self", "#ff6f91", "heart", "Health, routines, reflections"),
    ZoneSeed("Dad", "dad", "#8338ec", "users", "Parenting logistics and memories"),
    ZoneSeed("Jillian / Relationships", "relationships", "#ffbe0b", "sparkles", "Partnership, communication"),
    ZoneSeed("Family", "family", "#70d6ff", "users", "Extended family touchpoints"),
    ZoneSeed("Gouverneur", "gouverneur", "#b5179e", "map", "Up-north routines and tasks"),
    ZoneSeed("Cross-Pollination", "cross-pollination", "#457b9d", "link", "Idea shelf across zones"),
]


def seed_zones() -> dict[str, str]:
    print("Seeding zones...")
    response = requests.get(f"{API_BASE}/zones")
    response.raise_for_status()
    existing = {zone["slug"]: zone for zone in response.json()}

    zone_ids: dict[str, str] = {}
    for zone in ZONES:
        if zone.slug in existing:
            zone_ids[zone.slug] = existing[zone.slug]["id"]
            continue
        payload = {
            "name": zone.name,
            "slug": zone.slug,
            "color": zone.color,
            "icon": zone.icon,
            "description": zone.description,
        }
        res = requests.post(f"{API_BASE}/zones", json=payload)
        res.raise_for_status()
        zone_ids[zone.slug] = res.json()["id"]
        print(f"  created zone {zone.name}")
    return zone_ids


def seed_anchors(zone_ids: dict[str, str]) -> None:
    seed_path = Path("docs/anchors_seed.csv")
    if not seed_path.exists():
        print("Anchor seed CSV not found, skipping anchors.")
        return
    print("Seeding anchors...")
    with seed_path.open() as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            anchor_id = row["anchor_id"].upper()
            zone_key = row["zone"].strip().lower().replace(" ", "-")
            zone_id = zone_ids.get(zone_key)
            if not zone_id:
                print(f"  missing zone for anchor {anchor_id} (zone column: {row['zone']})")
                continue
            payload = {
                "anchor_id": anchor_id,
                "name": row["friendly_label"],
                "zone_id": zone_id,
                "description": "",
                "photo_url": None,
                "floorplan_ref": None,
                "coords": None,
                "tags": [],
            }
            res = requests.post(f"{API_BASE}/anchors", json=payload)
            if res.status_code not in (200, 201):
                print(f"  failed to upsert anchor {anchor_id}: {res.text}")
            else:
                print(f"  upserted anchor {anchor_id}")


def main() -> None:
    zone_ids = seed_zones()
    seed_anchors(zone_ids)


if __name__ == "__main__":
    main()
