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

CREATE TABLE scene (
    scene_id INTEGER PRIMARY KEY,
    name VARCHAR,
    description TEXT,
    graphics_wall_id INTEGER REFERENCES graphics_wall(graphics_wall_id),
    graphics_ground_id INTEGER REFERENCES graphics_ground(graphics_ground_id)
);

CREATE TABLE scene_music (
    scene_id INTEGER REFERENCES scene(scene_id),
    music_id INTEGER REFERENCES music(music_id),
    PRIMARY KEY (scene_id, music_id)
);

CREATE TABLE battlemap_tracker (
    battlemapTracker_id INTEGER PRIMARY KEY,
    loot VARCHAR,
    xp VARCHAR,
    enemies VARCHAR,
    locked BOOLEAN NOT NULL,
    graphics_id INTEGER REFERENCES graphics_ground(graphics_ground_id),
    graphicsLocked_id INTEGER REFERENCES graphics_ground(graphics_ground_id)
);

INSERT INTO graphics_ground (graphics_ground_id, name, source) VALUES 
(1, 'Chamber 1 battlefiel', 'https://example.com/ground.png'), 
(2, 'Chamber 1 battlefield Locked', 'https://example.com/ground_locked.png');

INSERT INTO graphics_wall (graphics_wall_id, name, source) VALUES 
(1, 'Chamber 1 wall', 'https://example.com/wall.png');

INSERT INTO music (music_id, source) VALUES 
(1, 'https://example.com/music1.mp3');

INSERT INTO scene (scene_id, name, description, graphics_ground_id, graphics_wall_id) VALUES 
(1, 'Battle at the River', 'A battle scene set near a river.', 1, 1);

INSERT INTO scene_music (scene_id, music_id) VALUES 
(1, 1);

INSERT INTO battlemap_tracker (battlemapTracker_id, loot, xp, enemies, locked, graphics_id, graphicsLocked_id) VALUES 
(1, 'Old Fish', '200 xp', 'Archer', false, 1, 2);
