from sqlalchemy.orm import Session
from db.models import Scene, GraphicsWall, GraphicsGround, BattleMap, Music


def seed_battle_maps_data(db: Session):
    battlemap1 = BattleMap(name='1 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source='https://example.com/battle1.png', source_locked='https://example.com/locked-battle1.png')
    battlemap2 = BattleMap( name='2 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=False, source='https://example.com/battle2.png', source_locked='https://example.com/locked-battle2.png')
    battlemap3 = BattleMap(name='3 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source='https://example.com/battle3.png', source_locked='https://example.com/locked-battle3.png')
    battlemap4 = BattleMap( name='4 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=False, source='https://example.com/battle4.png', source_locked='https://example.com/locked-battle4.png')
    battlemap5 = BattleMap(name='5 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source='https://example.com/battle5.png', source_locked='https://example.com/locked-battle5.png')
    battlemap6 = BattleMap( name='6 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=False, source='https://example.com/battle6.png', source_locked='https://example.com/locked-battle6.png')
    battlemap7 = BattleMap(name='7 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source='https://example.com/battle7.png', source_locked='https://example.com/locked-battle7.png')
    battlemap8 = BattleMap( name='8 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=False, source='https://example.com/battle8.png', source_locked='https://example.com/locked-battle8.png')
    battlemap9 = BattleMap(name='9 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source='https://example.com/battlee9.png', source_locked='https://example.com/locked-battle9.png')
    battlemap10 = BattleMap( name='10 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=False, source='https://example.com/battle10.png', source_locked='https://example.com/locked-battle10.png')
    battlemap11 = BattleMap(name='11 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source='https://example.com/battle11.png', source_locked='https://example.com/locked-battle11.png')
    battlemap12 = BattleMap( name='12 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=False, source='https://example.com/battle12.png', source_locked='https://example.com/locked-battle12.png')
    battlemap13 = BattleMap(name='13 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source='https://example.com/battle13.png', source_locked='https://example.com/locked-battle13.png')
    battlemap14 = BattleMap( name='14 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=False, source='https://example.com/battle14.png', source_locked='https://example.com/locked-battle14.png')
    battlemap15 = BattleMap(name='15 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source='https://example.com/battle15.png', source_locked='https://example.com/locked-battle15.png')
    battlemap16 = BattleMap(name='16 Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source='https://example.com/battle16.png', source_locked='https://example.com/locked-battle16.png')
    
    db.add(battlemap1)
    db.add(battlemap2)
    db.add(battlemap3)
    db.add(battlemap4)
    db.add(battlemap5)
    db.add(battlemap6)
    db.add(battlemap7)
    db.add(battlemap8)
    db.add(battlemap9)
    db.add(battlemap10)
    db.add(battlemap11)
    db.add(battlemap12)
    db.add(battlemap13)
    db.add(battlemap14)
    db.add(battlemap15)
    db.add(battlemap16)

    db.commit()


def seed_graphics_wall_data(db: Session):
    graphicwall1 = GraphicsWall(name='Forest', source='https://example.com/Forest.png')
    graphicwall2 = GraphicsWall(name='Fight', source='https://example.com/Fight.png')
    graphicwall3 = GraphicsWall(name='Shop', source='https://example.com/Shop.png')
    graphicwall4 = GraphicsWall(name='Tavern', source='https://example.com/Tavern.png')
    db.add(graphicwall1)
    db.add(graphicwall2)
    db.add(graphicwall3)
    db.add(graphicwall4)
    db.commit()


def seed_graphics_ground_data(db: Session):
    graphicground1 = GraphicsGround(name='Forest', source='https://example.com/Ground_Forest.png')
    graphicground2 = GraphicsGround(name='Shop', source='https://example.com/Shop.png')
    graphicground3 = GraphicsGround(name='Tavern', source='https://example.com/Tavern.png')
    db.add(graphicground1)
    db.add(graphicground2)
    db.add(graphicground3)
    db.commit()


def seed_music_data(db: Session):
    music1 = Music(name='Forest', source='https://example.com/Forest.mp3')
    music2 = Music(name='Fight', source='https://example.com/Fight.mp3')
    music3 = Music(name='Shop', source='https://example.com/Shop.mp3')
    music4 = Music(name='tavern', source='https://example.com/Tavern.mp3')
    db.add(music1)
    db.add(music2)
    db.add(music3)
    db.add(music4)
    db.commit()


def seed_scene_data(db: Session):
    scene1 = Scene(name='Default', description='A siltent little Village', fight=False, graphics_ground_id=1, graphics_wall_id=1, music_id=1)
    scene2 = Scene(name='Fight 1', description='A spooky Champer', fight=True, battlemaps_id=1, graphics_wall_id=2, music_id=2)
    scene3 = Scene(name='Fight 2', description='A small shop', fight=True, battlemaps_id=2, graphics_wall_id=2, music_id=2)
    scene4 = Scene(name='Fight 3', description='A lonely Forest', fight=True, battlemaps_id=3, graphics_wall_id=2, music_id=2)
    scene5 = Scene(name='Fight 4', description='A spooky Champer', fight=True, battlemaps_id=4, graphics_wall_id=2, music_id=2)
    scene6 = Scene(name='Fight 5', description='A small shop', fight=True, battlemaps_id=5, graphics_wall_id=2, music_id=2)
    scene7 = Scene(name='Fight 6', description='A lonely Forest', fight=True, battlemaps_id=6, graphics_wall_id=2, music_id=2)
    scene8 = Scene(name='Fight 7', description='A spooky Champer', fight=True, battlemaps_id=7, graphics_wall_id=2, music_id=2)
    scene9 = Scene(name='Fight 8', description='A small shop', fight=True, battlemaps_id=8, graphics_wall_id=2, music_id=2)
    scene10 = Scene(name='Fight 9', description='A lonely Forest', fight=True, battlemaps_id=9, graphics_wall_id=2, music_id=2)
    scene11 = Scene(name='Fight 10', description='A spooky Champer', fight=True, battlemaps_id=10, graphics_wall_id=2, music_id=2)
    scene12 = Scene(name='Fight 11', description='A small shop', fight=True, battlemaps_id=11, graphics_wall_id=2, music_id=2)
    scene13 = Scene(name='Fight 12', description='A lonely Forest', fight=True, battlemaps_id=12, graphics_wall_id=2, music_id=2)
    scene14 = Scene(name='Fight 13', description='A spooky Champer', fight=True, battlemaps_id=13, graphics_wall_id=2, music_id=2)
    scene15 = Scene(name='Fight 14', description='A small shop', fight=True, battlemaps_id=14, graphics_wall_id=2, music_id=2)
    scene16 = Scene(name='Fight 15', description='A lonely Forest', fight=True, battlemaps_id=15, graphics_wall_id=2, music_id=2)
    scene17 = Scene(name='Fight 16', description='A spooky Champer', fight=True, battlemaps_id=16, graphics_wall_id=2, music_id=2)
    scene18 = Scene(name='Shop', description='A small shop', fight=False, graphics_ground_id=2, graphics_wall_id=3, music_id=3)
    scene19 = Scene(name='tavern', description='A small tavern', fight=False, graphics_ground_id=3, graphics_wall_id=4, music_id=4)

    db.add(scene1)
    db.add(scene2)
    db.add(scene3)
    db.add(scene4)
    db.add(scene5)
    db.add(scene6)
    db.add(scene7)
    db.add(scene8)
    db.add(scene9)
    db.add(scene10)
    db.add(scene11)
    db.add(scene12)
    db.add(scene13)
    db.add(scene14)
    db.add(scene15)
    db.add(scene16)
    db.add(scene17)
    db.add(scene18)
    db.add(scene19)
    db.commit()

def seed_data(db: Session):
    if not db.query(BattleMap).first():
        seed_battle_maps_data(db)
    if not db.query(GraphicsWall).first():
        seed_graphics_wall_data(db)
    if not db.query(GraphicsGround).first():
        seed_graphics_ground_data(db)
    if not db.query(Music).first():
        seed_music_data(db)
    if not db.query(Scene).first():
        seed_scene_data(db)
