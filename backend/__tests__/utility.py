
import os
import unittest
import json
from __tests__.battlemap import BattleMap
from src.services.utility import filter_locked_battlemaps


test_data_clear = [
    BattleMap(
        name="First Room",
        id=1,
        source_clear="https://example.com/battle.png",
        loot="Old Fish",
        xp="200xp",
        enemies="Archer",
        locked=False,
        source_locked="https://example.com/battle_locked.png"
    ),
    BattleMap(
        name="Second Room",
        id=2,
        source_clear="https://example.com/battle.png",
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
        source_clear="https://example.com/battle.png",
        loot="Old Fish",
        xp="200xp",
        enemies="Archer",
        locked=True,
        source_locked="https://example.com/battle_locked.png"
    ),
    BattleMap(
        name="Second Room",
        id=2,
        source_clear="https://example.com/battle.png",
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
        self.assertEqual(filtered_battlemaps, ["https://example.com/battle.png", "https://example.com/battle.png"], "Returned clear data")

    def test_should_return_locked_data(self):
        filtered_battlemaps = filter_locked_battlemaps(test_data_locked)
        self.assertEqual(filtered_battlemaps, ["https://example.com/battle_locked.png", "https://example.com/battle_locked.png"], "Returned locked data")