"""Tests for /table/fight: start, turns and rounds, end, editing during the fight (combatants, defeated, order), the
lock of scene and adventure changes during a fight, the push `fight` to the Admins and (without labels) to the Walls
and Players and the cascades of the tables.

Changing tests use the fixture `db` (tests/conftest.py): everything is rolled back afterwards. The fixture
`fight_table` makes adventure 1 active with scene 5 (seed players 1-4 belong to adventure 1).
"""

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.testclient import WebSocketTestSession

from tests.test_ws import receive_message, receive_snapshot

pytestmark = pytest.mark.usefixtures("reset_audio")

SCENE_ID = 5
OTHER_SCENE_ID = 6
FIGHT_FIELDS = {"round", "active_combatant_id", "scene_id", "combatants"}
COMBATANT_FIELDS = {"id", "kind", "player_id", "number", "label", "defeated"}
NO_FIGHT = {"detail": "No fight"}
FIGHT_IN_PROGRESS = {"detail": "Fight in progress"}
COMBATANT_NOT_FOUND = {"detail": "Combatant not found"}


def player(player_id: int) -> dict[str, Any]:
    return {"kind": "player", "player_id": player_id}


def enemy(number: int, label: str | None = None) -> dict[str, Any]:
    return {"kind": "enemy", "number": number, "label": label}


def ally(number: int, label: str | None = None) -> dict[str, Any]:
    return {"kind": "ally", "number": number, "label": label}


def start(client: TestClient, *combatants: dict[str, Any]) -> dict[str, Any]:
    response = client.post("/table/fight", json={"combatants": list(combatants)})
    assert response.status_code == 201, response.json()
    body: dict[str, Any] = response.json()
    return body


def ids(fight: dict[str, Any]) -> list[int]:
    return [combatant["id"] for combatant in fight["combatants"]]


def end_turn(client: TestClient, fight: dict[str, Any]) -> dict[str, Any]:
    response = client.post("/table/fight/turn", json={"from_combatant_id": fight["active_combatant_id"]})
    assert response.status_code == 200, response.json()
    body: dict[str, Any] = response.json()
    return body


def defeat(client: TestClient, combatant_id: int, defeated: bool = True) -> dict[str, Any]:
    response = client.patch(f"/table/fight/combatants/{combatant_id}", json={"defeated": defeated})
    assert response.status_code == 200, response.json()
    body: dict[str, Any] = response.json()
    return body


@pytest.fixture
def fight_table(client: TestClient, db: Session) -> Session:
    assert client.patch("/table", json={"active_adventure_id": 1}).status_code == 200
    assert client.patch("/adventures/1", json={"active_scene_id": SCENE_ID}).status_code == 200
    return db


@pytest.fixture
def other_player(db: Session, other_adventure: dict[str, int]) -> int:
    from app.models import Player

    other = Player(
        adventure_id=other_adventure["id"], player_name="X", character_name="Y", race="Elf", character_class="Mage"
    )
    db.add(other)
    db.commit()
    return other.id


def receive_fight(websocket: WebSocketTestSession) -> dict[str, Any] | None:
    """The next `fight` message, skipping the others (state, audio, screens)."""
    message = receive_message(websocket)
    while message["type"] != "fight":
        message = receive_message(websocket)
    assert set(message) == {"type", "payload"}
    payload: dict[str, Any] | None = message["payload"]
    return payload


def test_get_returns_null_without_fight(client: TestClient, fight_table: Session) -> None:
    response = client.get("/table/fight")

    assert response.status_code == 200
    assert response.json() is None


def test_get_returns_null_without_active_adventure(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": None})

    assert client.get("/table/fight").json() is None


def test_start_creates_round_one_with_the_first_combatant_on_turn(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(2), enemy(1, "  Ghul  "), ally(4, "   "), player(1))

    assert set(fight) == FIGHT_FIELDS
    assert (fight["round"], fight["scene_id"]) == (1, SCENE_ID)
    assert fight["active_combatant_id"] == fight["combatants"][0]["id"]
    assert all(set(combatant) == COMBATANT_FIELDS for combatant in fight["combatants"])
    assert [{k: c[k] for k in ("kind", "player_id", "number", "label", "defeated")} for c in fight["combatants"]] == [
        {"kind": "player", "player_id": 2, "number": None, "label": None, "defeated": False},
        {"kind": "enemy", "player_id": None, "number": 1, "label": "Ghul", "defeated": False},
        {"kind": "ally", "player_id": None, "number": 4, "label": None, "defeated": False},
        {"kind": "player", "player_id": 1, "number": None, "label": None, "defeated": False},
    ]
    assert client.get("/table/fight").json() == fight


def test_start_without_active_adventure_is_rejected(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": None})

    response = client.post("/table/fight", json={"combatants": [enemy(1)]})

    assert response.status_code == 409
    assert response.json() == {"detail": "No active adventure"}


def test_start_without_active_scene_is_rejected(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": 1})

    response = client.post("/table/fight", json={"combatants": [enemy(1)]})

    assert response.status_code == 409
    assert response.json() == {"detail": "No active scene"}
    assert client.get("/table/fight").json() is None


def test_start_during_a_fight_is_rejected(client: TestClient, fight_table: Session) -> None:
    fight = start(client, enemy(1))

    response = client.post("/table/fight", json={"combatants": [enemy(2)]})

    assert response.status_code == 409
    assert response.json() == FIGHT_IN_PROGRESS
    assert client.get("/table/fight").json() == fight


@pytest.mark.parametrize(
    "combatants",
    [
        [],
        [player(1), player(1)],
        [enemy(1), ally(1)],
        [{"kind": "player"}],
        [{"kind": "player", "player_id": 1, "number": 2}],
        [{"kind": "player", "player_id": 1, "label": "Held"}],
        [{"kind": "enemy"}],
        [{"kind": "enemy", "number": 1, "player_id": 1}],
        [{"kind": "monster", "number": 1}],
        [enemy(0)],
        [enemy(100)],
        [enemy(1, "x" * 61)],
        [player(99999)],
    ],
)
def test_start_rejects_invalid_combatants(
    client: TestClient, fight_table: Session, combatants: list[dict[str, Any]]
) -> None:
    response = client.post("/table/fight", json={"combatants": combatants})

    assert response.status_code == 422
    assert client.get("/table/fight").json() is None


def test_start_rejects_player_of_another_adventure(client: TestClient, fight_table: Session, other_player: int) -> None:
    response = client.post("/table/fight", json={"combatants": [player(1), player(other_player)]})

    assert response.status_code == 422
    assert response.json() == {"detail": "Player does not belong to the active adventure"}
    assert client.get("/table/fight").json() is None


def test_label_of_sixty_characters_is_accepted(client: TestClient, fight_table: Session) -> None:
    fight = start(client, enemy(1, "x" * 60))

    assert fight["combatants"][0]["label"] == "x" * 60


def test_end_turn_passes_to_the_next_and_starts_a_new_round_after_the_last(
    client: TestClient, fight_table: Session
) -> None:
    fight = start(client, player(1), enemy(1), player(2))
    first, second, third = ids(fight)

    fight = end_turn(client, fight)
    assert (fight["active_combatant_id"], fight["round"]) == (second, 1)
    fight = end_turn(client, fight)
    assert (fight["active_combatant_id"], fight["round"]) == (third, 1)
    fight = end_turn(client, fight)
    assert (fight["active_combatant_id"], fight["round"]) == (first, 2)
    assert client.get("/table/fight").json() == fight


def test_end_turn_skips_defeated_combatants(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1), player(2), enemy(2))
    first, enemy_1, second, enemy_2 = ids(fight)
    defeat(client, enemy_1)
    fight = defeat(client, enemy_2)

    fight = end_turn(client, fight)
    assert (fight["active_combatant_id"], fight["round"]) == (second, 1)
    fight = end_turn(client, fight)
    assert (fight["active_combatant_id"], fight["round"]) == (first, 2)


def test_stale_end_turn_changes_nothing(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1), player(2))
    first = fight["active_combatant_id"]
    after = end_turn(client, fight)

    response = client.post("/table/fight/turn", json={"from_combatant_id": first})

    assert response.status_code == 200
    assert response.json() == after
    assert client.get("/table/fight").json() == after


def test_defeated_combatant_keeps_the_turn_until_it_ends(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1))
    first, second = ids(fight)

    fight = defeat(client, first)
    assert fight["active_combatant_id"] == first
    assert end_turn(client, fight)["active_combatant_id"] == second


def test_nobody_has_the_turn_when_all_are_defeated(client: TestClient, fight_table: Session) -> None:
    fight = start(client, enemy(1), enemy(2))
    first, second = ids(fight)
    defeat(client, second)
    fight = defeat(client, first)

    fight = end_turn(client, fight)

    assert (fight["active_combatant_id"], fight["round"]) == (None, 1)
    response = client.post("/table/fight/turn", json={"from_combatant_id": first})
    assert response.json() == fight


def test_taking_back_defeated_gives_the_turn_to_the_first_not_defeated(
    client: TestClient, fight_table: Session
) -> None:
    fight = start(client, enemy(1), enemy(2), enemy(3))
    first, second, third = ids(fight)
    for combatant_id in (first, second, third):
        defeat(client, combatant_id)
    assert end_turn(client, client.get("/table/fight").json())["active_combatant_id"] is None

    fight = defeat(client, third, defeated=False)

    assert fight["active_combatant_id"] == third
    assert [c["defeated"] for c in fight["combatants"]] == [True, True, False]


@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("POST", "/table/fight/turn", {"from_combatant_id": 1}),
        ("DELETE", "/table/fight", None),
        ("POST", "/table/fight/combatants", {"kind": "enemy", "number": 1}),
        ("PATCH", "/table/fight/combatants/1", {"defeated": True}),
        ("DELETE", "/table/fight/combatants/1", None),
        ("PUT", "/table/fight/order", {"combatant_ids": []}),
    ],
)
def test_requests_without_fight_return_404(
    client: TestClient, fight_table: Session, method: str, path: str, body: dict[str, Any] | None
) -> None:
    response = client.request(method, path, json=body)

    assert response.status_code == 404
    assert response.json() == NO_FIGHT


def test_requests_without_active_adventure_return_409(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": None})

    response = client.post("/table/fight/turn", json={"from_combatant_id": 1})

    assert response.status_code == 409
    assert response.json() == {"detail": "No active adventure"}


def test_end_deletes_the_fight(client: TestClient, fight_table: Session) -> None:
    start(client, player(1), enemy(1))

    response = client.delete("/table/fight")

    assert response.status_code == 204
    assert client.get("/table/fight").json() is None
    assert fight_table.scalar(text("SELECT count(*) FROM fight")) == 0
    assert fight_table.scalar(text("SELECT count(*) FROM combatant")) == 0
    assert start(client, enemy(1))["round"] == 1


def test_added_combatant_is_appended(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1))

    response = client.post("/table/fight/combatants", json=ally(2, " Borin "))

    assert response.status_code == 201
    added = response.json()
    assert ids(added)[:2] == ids(fight)
    assert {k: added["combatants"][2][k] for k in ("kind", "number", "label")} == {
        "kind": "ally",
        "number": 2,
        "label": "Borin",
    }
    assert added["active_combatant_id"] == fight["active_combatant_id"]
    response = client.post("/table/fight/combatants", json=player(3))
    assert response.status_code == 201
    assert response.json()["combatants"][3]["player_id"] == 3


@pytest.mark.parametrize(
    ("body", "detail"),
    [
        (player(1), "Player already takes part"),
        (enemy(1), "Number already taken"),
        (ally(1), "Number already taken"),
        (player(99999), "Player does not belong to the active adventure"),
    ],
)
def test_add_rejects_taken_player_or_number(
    client: TestClient, fight_table: Session, body: dict[str, Any], detail: str
) -> None:
    fight = start(client, player(1), enemy(1))

    response = client.post("/table/fight/combatants", json=body)

    assert response.status_code == 422
    assert response.json() == {"detail": detail}
    assert client.get("/table/fight").json() == fight


def test_add_rejects_invalid_body(client: TestClient, fight_table: Session) -> None:
    start(client, enemy(1))

    assert client.post("/table/fight/combatants", json={"kind": "enemy"}).status_code == 422
    assert client.post("/table/fight/combatants", json=enemy(100)).status_code == 422


def test_number_of_a_removed_combatant_is_free_again(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1))

    client.delete(f"/table/fight/combatants/{ids(fight)[1]}")

    assert client.post("/table/fight/combatants", json=ally(1)).status_code == 201


def test_added_combatant_gets_the_turn_if_nobody_has_it(client: TestClient, fight_table: Session) -> None:
    fight = start(client, enemy(1))
    fight = end_turn(client, defeat(client, ids(fight)[0]))
    assert fight["active_combatant_id"] is None

    added = client.post("/table/fight/combatants", json=enemy(2)).json()

    assert added["active_combatant_id"] == ids(added)[1]


def test_defeated_unknown_combatant_returns_404(client: TestClient, fight_table: Session) -> None:
    fight = start(client, enemy(1))

    response = client.patch("/table/fight/combatants/99999", json={"defeated": True})

    assert response.status_code == 404
    assert response.json() == COMBATANT_NOT_FOUND
    assert client.patch(f"/table/fight/combatants/{ids(fight)[0]}", json={"defeated": None}).status_code == 422


def test_removing_the_active_combatant_passes_the_turn_without_a_new_round(
    client: TestClient, fight_table: Session
) -> None:
    fight = start(client, player(1), enemy(1), player(2))
    first, _, third = ids(fight)
    fight = end_turn(client, end_turn(client, fight))
    assert fight["active_combatant_id"] == third
    defeat(client, ids(fight)[1])

    response = client.delete(f"/table/fight/combatants/{third}")

    assert response.status_code == 200
    assert (response.json()["active_combatant_id"], response.json()["round"]) == (first, 1)
    assert third not in ids(response.json())


def test_removing_the_last_combatant_leaves_nobody_on_turn(client: TestClient, fight_table: Session) -> None:
    fight = start(client, enemy(1))

    response = client.delete(f"/table/fight/combatants/{ids(fight)[0]}")

    assert response.json()["combatants"] == []
    assert response.json()["active_combatant_id"] is None


def test_removing_an_unknown_combatant_returns_404(client: TestClient, fight_table: Session) -> None:
    fight = start(client, enemy(1))

    response = client.delete("/table/fight/combatants/99999")

    assert response.status_code == 404
    assert response.json() == COMBATANT_NOT_FOUND
    assert client.get("/table/fight").json() == fight


def test_reorder_keeps_the_turn_and_violates_no_constraint(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1), player(2), ally(2))
    first, second, third, fourth = ids(fight)
    fight = end_turn(client, fight)

    response = client.put("/table/fight/order", json={"combatant_ids": [fourth, second, first, third]})
    # The unique position is checked at the end of the transaction, which the fixture rolls back: check it now.
    fight_table.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))

    assert response.status_code == 200
    assert ids(response.json()) == [fourth, second, first, third]
    assert response.json()["active_combatant_id"] == second
    assert ids(client.get("/table/fight").json()) == [fourth, second, first, third]
    assert ids(end_turn(client, response.json()))[0] == fourth
    assert client.get("/table/fight").json()["active_combatant_id"] == first


@pytest.mark.parametrize("order", ["missing", "duplicate", "foreign"])
def test_reorder_rejects_anything_but_a_permutation(client: TestClient, fight_table: Session, order: str) -> None:
    fight = start(client, player(1), enemy(1), player(2))
    first, second, _ = ids(fight)
    combatant_ids = {
        "missing": [first, second],
        "duplicate": [first, second, second],
        "foreign": [first, second, 99999],
    }[order]

    response = client.put("/table/fight/order", json={"combatant_ids": combatant_ids})

    assert response.status_code == 422
    assert client.get("/table/fight").json() == fight


def test_scene_change_is_rejected_during_a_fight(client: TestClient, fight_table: Session) -> None:
    start(client, enemy(1))

    response = client.patch("/adventures/1", json={"active_scene_id": OTHER_SCENE_ID})

    assert response.status_code == 409
    assert response.json() == FIGHT_IN_PROGRESS
    assert client.patch("/adventures/1", json={"active_scene_id": None, "global_level": 3}).status_code == 409
    assert client.get("/adventures/1").json()["global_level"] == 1
    assert client.get("/table").json()["active_scene_id"] == SCENE_ID
    # The same scene is no change; other fields stay editable.
    assert client.patch("/adventures/1", json={"active_scene_id": SCENE_ID, "global_level": 2}).status_code == 200


def test_adventure_change_is_rejected_during_a_fight(
    client: TestClient, fight_table: Session, other_adventure: dict[str, int]
) -> None:
    start(client, enemy(1))
    before = client.get("/table").json()
    other_theme = "dark" if before["theme"] == "tavern" else "tavern"

    for adventure_id in (other_adventure["id"], None):
        response = client.patch("/table", json={"active_adventure_id": adventure_id, "theme": other_theme})
        assert response.status_code == 409
        assert response.json() == FIGHT_IN_PROGRESS
    assert client.get("/table").json() == before
    assert client.patch("/table", json={"active_adventure_id": 1}).status_code == 200


def test_scene_and_adventure_change_again_after_the_fight(
    client: TestClient, fight_table: Session, other_adventure: dict[str, int]
) -> None:
    start(client, enemy(1))
    client.delete("/table/fight")

    assert client.patch("/adventures/1", json={"active_scene_id": OTHER_SCENE_ID}).status_code == 200
    assert client.patch("/table", json={"active_adventure_id": other_adventure["id"]}).status_code == 200


def test_admins_receive_the_fight_after_connecting_and_after_changes(client: TestClient, fight_table: Session) -> None:
    with (
        client.websocket_connect("/ws?screen=admin") as admin,
        client.websocket_connect("/ws?screen=admin") as other_admin,
    ):
        assert receive_fight(admin) is None
        assert receive_fight(other_admin) is None

        fight = start(client, player(1), enemy(1))
        assert receive_fight(admin) == fight
        assert receive_fight(other_admin) == fight

        fight = end_turn(client, fight)
        assert receive_fight(admin) == fight

        client.delete("/table/fight")
        assert receive_fight(admin) is None


def test_every_change_is_pushed(client: TestClient, fight_table: Session) -> None:
    with client.websocket_connect("/ws?screen=admin") as admin:
        assert receive_fight(admin) is None
        fight = start(client, player(1), enemy(1))
        assert receive_fight(admin) == fight

        for response in (
            client.post("/table/fight/combatants", json=ally(2)),
            client.patch(f"/table/fight/combatants/{ids(fight)[1]}", json={"defeated": True}),
            client.put("/table/fight/order", json={"combatant_ids": list(reversed(ids(fight))) + [99]}),
            client.delete(f"/table/fight/combatants/{ids(fight)[0]}"),
        ):
            if response.status_code < 300:
                assert receive_fight(admin) == response.json()

        current = client.get("/table/fight").json()
        response = client.put("/table/fight/order", json={"combatant_ids": list(reversed(ids(current)))})
        assert receive_fight(admin) == response.json()


def test_new_admin_receives_the_running_fight(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1))

    with client.websocket_connect("/ws?screen=admin") as admin:
        receive_snapshot(admin)
        assert receive_message(admin)["type"] == "screens"
        assert receive_fight(admin) == fight


def without_labels(fight: dict[str, Any]) -> dict[str, Any]:
    return {**fight, "combatants": [{**combatant, "label": None} for combatant in fight["combatants"]]}


def test_walls_receive_the_fight_without_labels_after_connecting_and_after_changes(
    client: TestClient, fight_table: Session
) -> None:
    with (
        client.websocket_connect("/ws?screen=wall") as wall,
        client.websocket_connect("/ws?screen=wall") as other_wall,
    ):
        assert receive_fight(wall) is None
        assert receive_fight(other_wall) is None

        fight = start(client, player(1), enemy(1, "Ork"), ally(2, "Wache"))
        assert receive_fight(wall) == without_labels(fight)
        assert receive_fight(other_wall) == without_labels(fight)
        assert [combatant["label"] for combatant in fight["combatants"]] == [None, "Ork", "Wache"]

        fight = end_turn(client, fight)
        assert receive_fight(wall) == without_labels(fight)

        fight = defeat(client, ids(fight)[1])
        assert receive_fight(wall) == without_labels(fight)

        client.delete("/table/fight")
        assert receive_fight(wall) is None


def test_new_wall_receives_the_running_fight_without_labels(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1, "Ork"))

    with client.websocket_connect("/ws?screen=wall") as wall:
        receive_snapshot(wall)
        assert receive_fight(wall) == without_labels(fight)


def test_admins_keep_the_labels_while_walls_are_connected(client: TestClient, fight_table: Session) -> None:
    with (
        client.websocket_connect("/ws?screen=wall") as wall,
        client.websocket_connect("/ws?screen=admin") as admin,
    ):
        assert receive_fight(wall) is None
        assert receive_fight(admin) is None

        fight = start(client, enemy(1, "Ork"))
        assert receive_fight(admin) == fight
        assert receive_fight(wall) == without_labels(fight)


def test_players_receive_the_fight_without_labels_after_connecting_and_after_changes(
    client: TestClient, fight_table: Session
) -> None:
    with (
        client.websocket_connect("/ws?screen=player") as phone,
        client.websocket_connect("/ws?screen=player") as other_phone,
    ):
        assert receive_fight(phone) is None
        assert receive_fight(other_phone) is None

        fight = start(client, player(1), enemy(1, "Ork"), ally(2, "Wache"))
        assert receive_fight(phone) == without_labels(fight)
        assert receive_fight(other_phone) == without_labels(fight)

        fight = end_turn(client, fight)
        assert receive_fight(phone) == without_labels(fight)
        assert receive_fight(other_phone) == without_labels(fight)

        client.delete("/table/fight")
        assert receive_fight(phone) is None
        assert receive_fight(other_phone) is None


def test_new_player_receives_the_running_fight_without_labels(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1, "Ork"))

    with client.websocket_connect("/ws?screen=player") as phone:
        receive_snapshot(phone)
        assert receive_fight(phone) == without_labels(fight)


def test_end_turn_of_a_player_reaches_admins_walls_and_players(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1, "Ork"), player(2))
    with (
        client.websocket_connect("/ws?screen=admin") as admin,
        client.websocket_connect("/ws?screen=wall") as wall,
        client.websocket_connect("/ws?screen=player") as phone,
    ):
        assert receive_fight(admin) == fight
        assert receive_fight(wall) == without_labels(fight)
        assert receive_fight(phone) == without_labels(fight)

        # The phone ends its own turn: a plain REST request, no Admin connection involved.
        response = client.post("/table/fight/turn", json={"from_combatant_id": ids(fight)[0]})
        assert response.status_code == 200
        fight = response.json()
        assert fight["active_combatant_id"] == ids(fight)[1]

        assert receive_fight(admin) == fight
        assert receive_fight(wall) == without_labels(fight)
        assert receive_fight(phone) == without_labels(fight)


def test_ground_does_not_receive_the_fight(client: TestClient, fight_table: Session) -> None:
    with client.websocket_connect("/ws?screen=ground") as websocket:
        receive_snapshot(websocket)

        start(client, enemy(1))
        client.patch("/table", json={"theme": "tavern"})

        assert receive_message(websocket)["type"] == "state"


def test_failed_and_stale_changes_are_not_pushed(client: TestClient, fight_table: Session) -> None:
    fight = start(client, player(1), enemy(1))
    with client.websocket_connect("/ws?screen=admin") as admin:
        assert receive_fight(admin) == fight
        first = fight["active_combatant_id"]
        fight = end_turn(client, fight)
        assert receive_fight(admin) == fight

        client.post("/table/fight/turn", json={"from_combatant_id": first})
        client.post("/table/fight/combatants", json=enemy(1))
        client.post("/table/fight", json={"combatants": [enemy(5)]})
        client.patch("/table", json={"theme": "tavern"})

        # The first message after the stale and failed requests is the state of the theme change.
        assert receive_message(admin)["type"] == "state"


def test_adventure_change_pushes_the_fight_of_the_new_adventure(
    client: TestClient, fight_table: Session, other_adventure: dict[str, int]
) -> None:
    with client.websocket_connect("/ws?screen=admin") as admin:
        assert receive_fight(admin) is None

        client.patch("/table", json={"active_adventure_id": other_adventure["id"]})

        assert receive_fight(admin) is None


@pytest.fixture
def committed_fight(client: TestClient) -> Iterator[None]:
    """Without the rolled-back transaction: scene and fight are committed; restores the seed state afterwards."""
    table_before = client.get("/table").json()
    client.patch("/table", json={"active_adventure_id": 1})
    client.patch("/adventures/1", json={"active_scene_id": SCENE_ID})
    try:
        yield
    finally:
        client.delete("/table/fight")
        client.patch("/adventures/1", json={"active_scene_id": None})
        client.patch("/table", json={"active_adventure_id": table_before["active_adventure_id"]})


@pytest.mark.usefixtures("committed_fight")
def test_fight_survives_a_restart(client: TestClient) -> None:
    from app.main import app

    fight = start(client, player(1), enemy(1), player(2))
    fight = end_turn(client, end_turn(client, end_turn(client, fight)))
    assert fight["round"] == 2

    with TestClient(app, raise_server_exceptions=False) as restarted:
        assert restarted.get("/table/fight").json() == fight


def test_deleting_a_player_removes_the_combatant(client: TestClient, fight_table: Session) -> None:
    from app.models import Player

    fight = start(client, player(1), enemy(1))
    player_row = fight_table.get(Player, 1)
    fight_table.delete(player_row)
    fight_table.commit()

    after = client.get("/table/fight").json()
    assert ids(after) == ids(fight)[1:]
    assert after["active_combatant_id"] is None


def test_deleting_the_scene_removes_the_fight(client: TestClient, fight_table: Session) -> None:
    start(client, player(1), enemy(1))

    fight_table.execute(text("DELETE FROM scene_track WHERE scene_id = :id"), {"id": SCENE_ID})
    fight_table.execute(text("DELETE FROM scene WHERE id = :id"), {"id": SCENE_ID})
    fight_table.commit()

    assert client.get("/table/fight").json() is None
    assert fight_table.scalar(text("SELECT count(*) FROM combatant")) == 0
