"""
Načítání fixtures – zakomentuj řádek, který nechceš načítat.
Pořadí je důležité (závislosti mezi modely).
"""

import json
import os
import subprocess
import sys

# TADY SE DÁ NAVOLIT, KTERÉ FIXTURES SE MAJÍ NAČÍTAT - ZAKOMENTOVAT TO, CO NECHCI
FIXTURES = [
    "fixtures/event/categories.json",
    "fixtures/event/locations.json",
    "fixtures/event/statuses.json",
    "fixtures/event/events.json",

    "fixtures/equipment/types.json",
    "fixtures/equipment/statuses.json",
    "fixtures/equipment/equipments.json",

    "fixtures/measurement/properties.json",
    "fixtures/measurement/units.json",
    "fixtures/measurement/statuses.json",
    "fixtures/measurement/measurements.json",

    "fixtures/log/logs.json",
]

if FIXTURES:
    cmd = [sys.executable, "manage.py", "loaddata"] + FIXTURES
    print(f">>> {' '.join(cmd)}")
    result = subprocess.run(cmd)
    if result.returncode != 0:
        sys.exit(result.returncode)
