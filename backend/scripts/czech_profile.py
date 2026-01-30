import random
from equipment import Equipment, EquipmentType, EquipmentStatus
from event import Category

# Globální seznamy
equipment_type_list = []
equipment_status_list = []
category_list = []

def equipment_type_czech():
    javelin, _ = EquipmentType.objects.get_or_create(name="Oštěp", defaults={"description":"Oštěp pro hod oštěpem"})
    discus, _ = EquipmentType.objects.get_or_create(name="Disk", defaults={"description":"Disk pro hod diskem"})
    hammer, _ = EquipmentType.objects.get_or_create(name="Kladivo", defaults={"description":"Kladivo pro hod kladivem"})
    shot, _ = EquipmentType.objects.get_or_create(name="Koule", defaults={"description":"Koule pro vrh koulí"})

    equipment_type_list = [javelin, discus, hammer, shot]
    print("[CZ] Typy náčiní nahrány")

def equipment_status_czech():
    registered, _ = EquipmentStatus.objects.get_or_create(name="Registrované", defaults={"description":"Náčiní je zaregistrováno v systému"})
    measured, _ = EquipmentStatus.objects.get_or_create(name="Změřené", defaults={"description":"Náčiní bylo změřeno a je připraveno k použití"})
    waiting, _ = EquipmentStatus.objects.get_or_create(name="Čeká na převoz", defaults={"description":"Náčiní čeká na převoz na sektor"})
    in_use, _ = EquipmentStatus.objects.get_or_create(name="Právě používáno", defaults={"description":"Náčiní je momentálně používáno"})
    illegal, _ = EquipmentStatus.objects.get_or_create(name="Nelegální", defaults={"description":"Náčiní je nelegální pro použití v soutěži"})
    returned, _ = EquipmentStatus.objects.get_or_create(name="Vrácené", defaults={"description":"Náčiní bylo vydáno zpět maiteli"})

    equipment_status_list = [registered, measured, waiting, in_use, illegal, returned]
    print("[CZ] Stavy náčiní nahrány")

def category_czech():
    u16_male, _ = Category.objects.get_or_create(name="Žáci - U16", defaults={"gender":1})
    u18_male, _ = Category.objects.get_or_create(name="Dorostenci - U18", defaults={"gender":1})
    u20_male, _ = Category.objects.get_or_create(name="Junioři - U20", defaults={"gender":1})
    men, _ = Category.objects.get_or_create(name="Muži", defaults={"gender":1})
    
    u16_female, _ = Category.objects.get_or_create(name="Žákyně - U16", defaults={"gender":0})
    u18_female, _ = Category.objects.get_or_create(name="Dorostenky - U18", defaults={"gender":0})
    u20_female, _ = Category.objects.get_or_create(name="Juniorky - U20", defaults={"gender":0})
    women, _ = Category.objects.get_or_create(name="Ženy", defaults={"gender":0})

    category_list = [u16_male, u18_male, u20_male, men, u16_female, u18_female, u20_female, women]
    print("[CZ] Kategorie závodníků nahrány")


# generace náhodnch náčiní
def equipment_samples_generation(n):
    for i in range(n):
        random_category = random.choice(category_list)
        random_equipment_type = random.choice(equipment_type_list)
        status = EquipmentStatus.objects.get(name="Registrované")
        athlete_number = str(49 + i).zfill(3)  # unikátní číslo


        Equipment.objects.create(
            athlete_number=athlete_number,
            category=random_category,
            equipment_type=random_equipment_type,
            measured=False,
            status=status
        )
    print(f"{n} náhodných náčiní vytvořeno")

def czech_profile():
    equipment_type_czech()
    equipment_status_czech()
    category_czech()
    equipment_samples_generation(20)

czech_profile()