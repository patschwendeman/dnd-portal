CREATE TABLE graphics_wall (
    graphics_wall_id INTEGER PRIMARY KEY,
    name VARCHAR,
    source VARCHAR
);

CREATE TABLE graphics_ground (
    graphics_ground_id INTEGER PRIMARY KEY,
    name VARCHAR,
    source VARCHAR
);

CREATE TABLE music (
    music_id INTEGER PRIMARY KEY,
    source VARCHAR
);

CREATE TABLE battlemaps (
    battlemaps_id INTEGER PRIMARY KEY,
    name VARCHAR,
    loot VARCHAR,
    xp VARCHAR,
    enemies VARCHAR,
    locked BOOLEAN NOT NULL,
    source_clear VARCHAR,
    source_locked VARCHAR
);

CREATE TABLE scene (
    scene_id INTEGER PRIMARY KEY,
    name VARCHAR,
    description VARCHAR,
    graphics_wall_id INTEGER REFERENCES graphics_wall(graphics_wall_id),
    graphics_ground_id INTEGER REFERENCES graphics_ground(graphics_ground_id),
    battlemaps_id INTEGER REFERENCES battlemaps(battlemaps_id)
);

CREATE TABLE scene_music (
    scene_id INTEGER REFERENCES scene(scene_id),
    music_id INTEGER REFERENCES music(music_id),
    PRIMARY KEY (scene_id, music_id)
);



INSERT INTO graphics_ground (graphics_ground_id, name, source) VALUES 
(1, 'Forest', 'https://example.com/Ground_Forest.png'), 
(2, 'Shop', 'https://example.com/Ground_Shop.png');

INSERT INTO graphics_wall (graphics_wall_id, name, source) VALUES 
(1, 'Forest', 'https://example.com/Wall_Forest.png'), 
(2, 'Shop', 'https://example.com/Wall_Shop.png'),
(3, 'Champer', 'https://example.com/Champer.png');

INSERT INTO music (music_id, source) VALUES 
(1, 'https://example.com/music1.mp3');

INSERT INTO battlemaps (battlemaps_id, name, loot, xp, enemies, locked, source_clear, source_locked) VALUES 
(1, 'First Room', 'Old Fish', '200 xp', 'Archer', false, 'https://example.com/battle.png', 'https://example.com/battle_locked.png');


INSERT INTO scene (scene_id, name, description, graphics_ground_id, graphics_wall_id, battlemaps_id) VALUES 
(1, 'Forest', 'A lonely Forest.', 1, 1, NULL),
(2, 'Forest', 'A lonely Forest.', 2, 2, NULL),
(3, 'Battle', 'First Room.', NULL, 3, 1);

INSERT INTO scene_music (scene_id, music_id) VALUES 
(1, 1);