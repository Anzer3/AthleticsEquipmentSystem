from event.models import Location, Event, EventStatus, Category

def eventData():
    # Vytvoření kategorií
    categories = {
        "zaci_u16": Category.objects.get_or_create(name="Žáci - U16", defaults={"gender": 1})[0],
        "dorosti_u18": Category.objects.get_or_create(name="Dorostenci - U18", defaults={"gender": 1})[0],
        "juniori_u20": Category.objects.get_or_create(name="Junioři - U20", defaults={"gender": 1})[0],
        "muzi": Category.objects.get_or_create(name="Muži", defaults={"gender": 1})[0],
        "zakyne_u16": Category.objects.get_or_create(name="Žákyně - U16", defaults={"gender": 0})[0],
        "dorostenky_u18": Category.objects.get_or_create(name="Dorostenky - U18", defaults={"gender": 0})[0],
        "juniorky_u20": Category.objects.get_or_create(name="Juniorky - U20", defaults={"gender": 0})[0],
        "zeny": Category.objects.get_or_create(name="Ženy", defaults={"gender": 0})[0],
    }

    # Vytvoření lokací
    locations = {
        "draha": Location.objects.get_or_create(name="Dráha", defaults={"description": "Hlavní ovál na stadionu"})[0],
        "dalka1": Location.objects.get_or_create(name="Dálkařský sektor 1", defaults={"description": "Dálka u klece pro hod diskem"})[0],
        "dalka2": Location.objects.get_or_create(name="Dálkařský sektor 2", defaults={"description": "Dálka u výškařského sektoru"})[0],
        "ostep": Location.objects.get_or_create(name="Oštěpařský sektor", defaults={"description": "Havní sektor pro hod oštěpem"})[0],
        "kladiva": Location.objects.get_or_create(name="Kladivařský sektor", defaults={"description": "Sektor pro hod kladivem na louce vedle stadionu"})[0],
    }

    # Vytvoření stavů
    statuses = {
        "nastavajici": EventStatus.objects.get_or_create(display_text="Nastávající", defaults={"description": "Tato soutěž ještě nebyla zaočata"})[0],
        "probihajici": EventStatus.objects.get_or_create(display_text="Právě probíhá", defaults={"description": "Tata soutěž právě probíhá"})[0],
        "dokoncena": EventStatus.objects.get_or_create(display_text="Dokončená", defaults={"description": "Tato soutěž již byla dokončena"})[0],
        "zrusena": EventStatus.objects.get_or_create(display_text="Zrušená", defaults={"description": "Tata soutěž byla zrušena"})[0],
    }

    # Vytvoření eventů s UUID references
    Event.objects.get_or_create(
        name="Rozběh na 100m - Junioři",
        defaults={
            "category": categories["juniori_u20"],
            "status": statuses["nastavajici"],
            "start_time": "2024-07-01T10:00:00Z",
            "end_time": "2024-07-01T11:00:00Z",
            "location": locations["draha"]
        }
    )
    Event.objects.get_or_create(
        name="Dálka - Ženy",
        defaults={
            "category": categories["zeny"],
            "status": statuses["nastavajici"],
            "start_time": "2024-07-01T11:00:00Z",
            "end_time": "2024-07-01T12:30:00Z",
            "location": locations["dalka1"]
        }
    )
    Event.objects.get_or_create(
        name="Oštěp - Muži",
        defaults={
            "category": categories["muzi"],
            "status": statuses["nastavajici"],
            "start_time": "2024-07-01T12:30:00Z",
            "end_time": "2024-07-01T14:00:00Z",
            "location": locations["ostep"]
        }
    )

    # Vrácení všech dat pro použití v jiných souborech
    return {
        "categories": categories,
        "locations": locations,
        "statuses": statuses,
    }