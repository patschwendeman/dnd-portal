from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from db.models import Scene, GraphicsWall, GraphicsGround, BattleMap, Music


def seed_battle_maps_data(db: Session):
    battlemap1 = BattleMap(name='First Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=True, source_clear='https://example.com/battle.png', source_locked='https://example.com/battle_locked.png')
    battlemap2 = BattleMap(name='Second Room', loot='Old Fish', xp='200xp', enemies='Archer', locked=False, source_clear='https://example.com/battle.png', source_locked='https://example.com/battle_locked.png')
    
    db.add(battlemap1)
    db.add(battlemap2)
    db.commit()

def seed_graphics_wall_data(db: Session):
    graphicwall1 = GraphicsWall(name='Forest', source='https://example.com/Wall_Forest.png')
    graphicwall2 = GraphicsWall(name='Shop', source='https://example.com/Shop.png')
    graphicwall3 = GraphicsWall(name='Champer', source='https://example.com/Champer.png')
    db.add(graphicwall1)
    db.add(graphicwall2)
    db.add(graphicwall3)
    db.commit()

def seed_graphics_ground_data(db: Session):
    graphicground1 = GraphicsGround(name='Forest', source='https://example.com/Groundl_Forest.png')
    graphicground2 = GraphicsGround(name='Champer', source='https://example.com/Shop.png')  
    db.add(graphicground1)
    db.add(graphicground2)
    db.commit()

def seed_music_data(db: Session):
    music1 = Music(name='Fight', source='https://example.com/musicFight.mp3')
    music2 = Music(name='Shop', source='https://example.com/musicShop.mp3')
    db.add(music1)
    db.add(music2)
    db.commit()

def seed_scene_data(db: Session):
    scene1 = Scene(name='Forest', description='A lonely Forest', graphics_ground_id=1, graphics_wall_id=1, music_id=1)
    scene2 = Scene(name='Champer', description='A spooky Champer', graphics_ground_id=2, graphics_wall_id=2, music_id=1)
    scene3 = Scene(name='Shop', description='A small shop', graphics_wall_id=3, battlemaps_id=1, music_id=2)
    db.add(scene1)
    db.add(scene2)
    db.add(scene3)
    db.commit()

def seed_data(db: Session):
    try:
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
        
    except OperationalError:
         #TODO Rollback 
        print(f"OperationalError occurred: {e}")
    except Exception as e:
        #TODO Rollback
        print(f"An error occurred: {e}")