class BattleMap:
    def __init__(self, name, id, source_clear, loot, xp, enemies, locked, source_locked):
        self.name = name
        self.id = id
        self.source_clear = source_clear
        self.loot = loot
        self.xp = xp
        self.enemies = enemies
        self.locked = locked
        self.source_locked = source_locked
