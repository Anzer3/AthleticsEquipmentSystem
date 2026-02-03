from equipment.models import Equipment, EquipmentStatus, EquipmentType
from .EventData import eventData

from django.utils import timezone

def equipentData():
    # Načtení dat z eventData
    event_data = eventData()
    categories = event_data["categories"]
    
    # Vytvoření typů vybavení
    equipment_types = {
        "ostep": EquipmentType.objects.get_or_create(name="Oštěp", defaults={"description": "Oštěp"})[0],
        "koule": EquipmentType.objects.get_or_create(name="Koule", defaults={"description": "Koule pro vrh koulí"})[0],
        "disk": EquipmentType.objects.get_or_create(name="Disk", defaults={"description": "Disk pro hod diskem"})[0],
    }

    # Vytvoření stavů vybavení
    equipment_statuses = {
        "neregistrovano": EquipmentStatus.objects.get_or_create(name="Neregistrováno", defaults={"description": "Náčiní nebylo registrováno"})[0],
        "v_systemu": EquipmentStatus.objects.get_or_create(name="V systému", defaults={"description": "Náčiní bylo registrováno a nachází se v systému"})[0],
        "pripravene": EquipmentStatus.objects.get_or_create(name="Připravené", defaults={"description": "Náčiní bylo úspěšně změřeno a je připravené pro použití v soutěži"})[0],
        "vydano": EquipmentStatus.objects.get_or_create(name="Vydáno", defaults={"description": "Náčiní bylo vydáno zpět a již se nanachízí v systému"})[0],
    }

    # Vytvoření vybavení
    equipment = {
        "043_ostep": Equipment.objects.get_or_create(
        athlete_number="043",
        equipment_type=equipment_types["ostep"],
        category=categories["dorosti_u18"],
        defaults={
            "measured": False,
            "status": equipment_statuses["pripravene"],
            "created_at": timezone.now(),
            "updated_at": timezone.now()
        }
)[0],
    "042_koule": Equipment.objects.get_or_create(
        athlete_number="042",
        equipment_type=equipment_types["koule"],
        category=categories["muzi"],
        defaults={
            "measured": True,
            "status": equipment_statuses["v_systemu"],
            "created_at": timezone.now(),
            "updated_at": timezone.now()
        }
    )[0],
        "051_disk": Equipment.objects.get_or_create(
        athlete_number="051",
        equipment_type=equipment_types["disk"],
        category=categories["zeny"],
        defaults={
            "measured": False,
            "status": equipment_statuses["vydano"],
            "created_at": timezone.now(),
            "updated_at": timezone.now()
        }
    )[0],
    }
    # Vrácení všech dat pro použití v jiných souborech
    return {
        "equipment_types": equipment_types,
        "equipment_statuses": equipment_statuses,
        "equipment": equipment,
    }