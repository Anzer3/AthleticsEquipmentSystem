from measurement.models import MeasuredProperty, MeasurementUnit, MeasurementStatus, Measurement
from .EventData import eventData
from .EquipmentData import equipentData

from django.utils import timezone

def measurementData():
    # Načtení dat z eventData a equipentData
    event_data = eventData()
    equipment_data = equipentData()
    equipment_types = equipment_data["equipment_types"]
    equipment_items = equipment_data["equipment"]
    
    # Vytvoření stavů měření
    measurement_statuses = {
        "measured": MeasurementStatus.objects.get_or_create(name="Změřeno", defaults={"description": "Náčiní bylo úspěšně změřeno"})[0],
        "unmeasured": MeasurementStatus.objects.get_or_create(name="Nezměřeno", defaults={"description": "Náčiní dosud nebylo změřeno"})[0],
    }
    
    # Vytvoření měřitelných vlastností pro oštěp
    measured_properties = {
        "ostep_weight": MeasuredProperty.objects.get_or_create(
            name="Hmotnost",
            equipment_type=equipment_types["ostep"],
            defaults={"description": "Hmotnost oštěpu"}
        )[0],
        "ostep_length": MeasuredProperty.objects.get_or_create(
            name="Délka",
            equipment_type=equipment_types["ostep"],
            defaults={"description": "Délka oštěpu"}
        )[0],
        "koule_weight": MeasuredProperty.objects.get_or_create(
            name="Hmotnost",
            equipment_type=equipment_types["koule"],
            defaults={"description": "Hmotnost koule"}
        )[0],
        "koule_diameter": MeasuredProperty.objects.get_or_create(
            name="Průměr",
            equipment_type=equipment_types["koule"],
            defaults={"description": "Průměr koule"}
        )[0],
        "disk_weight": MeasuredProperty.objects.get_or_create(
            name="Hmotnost",
            equipment_type=equipment_types["disk"],
            defaults={"description": "Hmotnost disku"}
        )[0],
        "disk_diameter": MeasuredProperty.objects.get_or_create(
            name="Průměr",
            equipment_type=equipment_types["disk"],
            defaults={"description": "Průměr disku"}
        )[0],
    }
    
    # Vytvoření jednotek měření
    measurement_units = {
        "grams": MeasurementUnit.objects.get_or_create(
            measured_property=measured_properties["ostep_weight"],
            unit="g"
        )[0],
        "millimeters": MeasurementUnit.objects.get_or_create(
            measured_property=measured_properties["ostep_length"],
            unit="mm"
        )[0],
        "grams_koule": MeasurementUnit.objects.get_or_create(
            measured_property=measured_properties["koule_weight"],
            unit="g"
        )[0],
        "millimeters_koule": MeasurementUnit.objects.get_or_create(
            measured_property=measured_properties["koule_diameter"],
            unit="mm"
        )[0],
        "grams_disk": MeasurementUnit.objects.get_or_create(
            measured_property=measured_properties["disk_weight"],
            unit="g"
        )[0],
        "millimeters_disk": MeasurementUnit.objects.get_or_create(
            measured_property=measured_properties["disk_diameter"],
            unit="mm"
        )[0],
    }
    
    # Vytvoření měření
    measurements = {
        "043_ostep_weight": Measurement.objects.get_or_create(
            equipment=equipment_items["043_ostep"],
            property=measured_properties["ostep_weight"],
            value=800,
            unit=measurement_units["grams"],
            defaults={
                "status": measurement_statuses["measured"],
                "measured_at": timezone.now(),
            }
        )[0],
        "043_ostep_length": Measurement.objects.get_or_create(
            equipment=equipment_items["043_ostep"],
            property=measured_properties["ostep_length"],
            value=2600,
            unit=measurement_units["millimeters"],
            defaults={
                "status": measurement_statuses["measured"],
                "measured_at": timezone.now(),
            }
        )[0],
        "042_koule_weight": Measurement.objects.get_or_create(
            equipment=equipment_items["042_koule"],
            property=measured_properties["koule_weight"],
            value=7260,
            unit=measurement_units["grams_koule"],
            defaults={
                "status": measurement_statuses["measured"],
                "measured_at": timezone.now(),
            }
        )[0],
        "042_koule_diameter": Measurement.objects.get_or_create(
            equipment=equipment_items["042_koule"],
            property=measured_properties["koule_diameter"],
            value=110,
            unit=measurement_units["millimeters_koule"],
            defaults={
                "status": measurement_statuses["measured"],
                "measured_at": timezone.now(),
            }
        )[0],
        "051_disk_weight": Measurement.objects.get_or_create(
            equipment=equipment_items["051_disk"],
            property=measured_properties["disk_weight"],
            value=2000,
            unit=measurement_units["grams_disk"],
            defaults={
                "status": measurement_statuses["measured"],
                "measured_at": timezone.now(),
            }
        )[0],
        "051_disk_diameter": Measurement.objects.get_or_create(
            equipment=equipment_items["051_disk"],
            property=measured_properties["disk_diameter"],
            value=219,
            unit=measurement_units["millimeters_disk"],
            defaults={
                "status": measurement_statuses["measured"],
                "measured_at": timezone.now(),
            }
        )[0],
    }
    
    # Vrácení všech dat pro použití v jiných souborech
    return {
        "measurement_statuses": measurement_statuses,
        "measured_properties": measured_properties,
        "measurement_units": measurement_units,
        "measurements": measurements,
    }
