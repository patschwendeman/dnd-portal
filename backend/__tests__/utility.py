
import unittest
from __tests__.battlemap import BattleMap
from src.services.utility import filter_battlemaps, filter_locked_battlemaps


test_data_clear = [
    BattleMap(
        name="First Room",
        id=1,
        source="https://example.com/battle.png",
        loot="Old Fish",
        xp="200xp",
        enemies="Archer",
        locked=False,
        source_locked="https://example.com/battle_locked.png"
    ),
    BattleMap(
        name="Second Room",
        id=2,
        source="https://example.com/battle.png",
        loot="Old Fish",
        xp="200xp",
        enemies="Archer",
        locked=False,
        source_locked="https://example.com/battle_locked.png"
    )
]


test_data_locked = [
    BattleMap(
        name="First Room",
        id=1,
        source="https://example.com/battle.png",
        loot="Old Fish",
        xp="200xp",
        enemies="Archer",
        locked=True,
        source_locked="https://example.com/battle_locked.png"
    ),
    BattleMap(
        name="Second Room",
        id=2,
        source="https://example.com/battle.png",
        loot="Old Fish",
        xp="200xp",
        enemies="Archer",
        locked=True,
        source_locked="https://example.com/battle_locked.png"
    )
]

class TestFilterLockedBattlemaps(unittest.TestCase):

    def test_should_return_clear_data(self):
        filtered_battlemaps = filter_locked_battlemaps(test_data_clear)
        expected_result = [
            {'id': test_data_clear[0].id, 'source': test_data_clear[0].source},
            {'id': test_data_clear[1].id, 'source': test_data_clear[1].source}
        ]
        self.assertEqual(filtered_battlemaps, expected_result, "Returned clear data")

    def test_should_return_locked_data(self):
        filtered_battlemaps = filter_locked_battlemaps(test_data_locked)
        expected_result = [
            {'id': test_data_locked[0].id, 'source': test_data_locked[0].source_locked},
            {'id': test_data_locked[1].id, 'source': test_data_locked[1].source_locked}
        ]
        self.assertEqual(filtered_battlemaps, expected_result, "Returned locked data")

class TestFilterBattlemaps(unittest.TestCase):

    def test_should_return_clear_data(self):
        filtered_battlemaps = filter_battlemaps(test_data_clear)
        expected_result = [
            {'id': test_data_clear[0].id, 'source': test_data_clear[0].source},
            {'id': test_data_clear[1].id, 'source': test_data_clear[1].source}
        ]
        self.assertEqual(filtered_battlemaps, expected_result, "Returned clear data")

    def test_should_return_clear_data(self):
        filtered_battlemaps = filter_battlemaps(test_data_locked)
        expected_result = [
            {'id': test_data_locked[0].id, 'source': test_data_locked[0].source},
            {'id': test_data_locked[1].id, 'source': test_data_locked[1].source}
        ]
        self.assertEqual(filtered_battlemaps, expected_result, "Returned locked data")
