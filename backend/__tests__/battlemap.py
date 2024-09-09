class BattleMap:
    def __init__(self, name, id, source, loot, xp, enemies, locked, source_locked):
        self.name = name
        self.id = id
        self.source = source
        self.loot = loot
        self.xp = xp
        self.enemies = enemies
        self.locked = locked
        self.source_locked = source_locked
