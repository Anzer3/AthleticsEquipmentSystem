import json
import queue
from typing import Dict, Iterable, Set

from .serializers import EquipmentListSerializer


class EquipmentStream:
    def __init__(self) -> None:
        self._subscribers: Set[queue.Queue] = set()

    def subscribe(self) -> queue.Queue:
        subscriber = queue.Queue()
        self._subscribers.add(subscriber)
        return subscriber

    def unsubscribe(self, subscriber: queue.Queue) -> None:
        self._subscribers.discard(subscriber)

    def publish(self, payload: Dict[str, object]) -> None:
        for subscriber in list(self._subscribers):
            try:
                subscriber.put_nowait(payload)
            except queue.Full:
                continue


EQUIPMENT_STREAM = EquipmentStream()


def stream_equipment() -> Iterable[str]:
    subscriber = EQUIPMENT_STREAM.subscribe()
    try:
        yield "retry: 10000\n\n"
        while True:
            try:
                payload = subscriber.get(timeout=15)
                yield f"data: {json.dumps(payload)}\n\n"
            except queue.Empty:
                yield ": keep-alive\n\n"
    finally:
        EQUIPMENT_STREAM.unsubscribe(subscriber)


def publish_equipment_upsert(equipment) -> None:
    EQUIPMENT_STREAM.publish({
        'type': 'equipment_upsert',
        'equipment': EquipmentListSerializer(equipment).data,
    })


def publish_equipment_delete(equipment_uuid) -> None:
    EQUIPMENT_STREAM.publish({
        'type': 'equipment_delete',
        'uuid': str(equipment_uuid),
    })


def publish_equipment_bulk(equipments) -> None:
    serialized = EquipmentListSerializer(equipments, many=True).data
    if not serialized:
        return

    EQUIPMENT_STREAM.publish({
        'type': 'equipment_bulk_upsert',
        'equipment': serialized,
    })


