# AthleticsEquipmentSystem
Systém slouží k měření a správě náčiní pro rozhodčí na atletických závodech. 

## Fixtures and startup data

Backend now loads seed data through centralized fixture sets.

- Fixture files are stored in `backend/fixtures/`.
- Set definitions are in `backend/fixtures/fixture_sets.json`.
- Manual load command:
	- `python manage.py loadfixtureset --set core`
	- `python manage.py loadfixtureset --set czech_profile`
- Docker startup uses env `FIXTURE_SET` (default `core`) and loads selected data automatically after migrations.

Legacy `api/dataload` and script-based seeding were removed from the active flow.
