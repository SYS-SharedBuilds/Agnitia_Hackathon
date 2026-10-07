from shared.events import Event, EventType


def test_event_serialization():
    evt = Event(
        order_id="ord_test_01",
        seq=5,
        type=EventType.TASK_STARTED,
        task_id="provision_network",
        system="network",
        attempt=1,
        state="RUNNING",
        detail={"vlan_id": 100},
    )

    redis_dict = evt.to_redis_dict()
    assert redis_dict["order_id"] == "ord_test_01"
    assert redis_dict["seq"] == "5"
    assert redis_dict["type"] == "task.started"

    deserialized = Event.from_redis_dict(redis_dict)
    assert deserialized.order_id == "ord_test_01"
    assert deserialized.seq == 5
    assert deserialized.type == EventType.TASK_STARTED
    assert deserialized.detail == {"vlan_id": 100}
