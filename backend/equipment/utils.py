from typing import Iterable, Optional
import re

from .models import Equipment


def _parse_equipment_number(value: object) -> Optional[int]:
    text = str(value).strip()
    match = re.search(r'\d+', text)
    if not match:
        return None

    number = int(match.group(0))
    if number <= 0:
        return None

    return number


def get_next_equipment_number(equipment_type_id: str, existing_numbers: Optional[Iterable[str]] = None) -> str:
    numbers = set()

    if existing_numbers is None:
        existing_numbers = Equipment.objects.filter(equipment_type_id=equipment_type_id).values_list(
            'equipment_number',
            flat=True,
        )

    for value in existing_numbers:
        parsed = _parse_equipment_number(value)
        if parsed is not None:
            numbers.add(parsed)

    next_number = 1
    while next_number in numbers:
        next_number += 1

    return str(next_number)
