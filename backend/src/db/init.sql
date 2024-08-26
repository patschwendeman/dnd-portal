CREATE TABLE music (
    music_id SERIAL PRIMARY KEY,
    source VARCHAR NOT NULL
);

CREATE TABLE graphics (
    graphics_id SERIAL PRIMARY KEY,
    source VARCHAR NOT NULL
);

CREATE TABLE scene (
    scene_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    screen_type VARCHAR,
    screen_id INTEGER,
    graphics_id INTEGER REFERENCES graphics(graphics_id)
);

CREATE TABLE scene_music (
    scene_id INTEGER REFERENCES scene(scene_id),
    music_id INTEGER REFERENCES music(music_id),
    PRIMARY KEY (scene_id, music_id)
);

CREATE TABLE battlemap_tracker (
    battlemapTracker_id SERIAL PRIMARY KEY,
    locked BOOLEAN NOT NULL,
    graphics_id INTEGER REFERENCES graphics(graphics_id),
    graphicsLocked_id INTEGER REFERENCES graphics(graphics_id)
);

INSERT INTO music (source) VALUES 
('https://example.com/music1.mp3'), 
('https://example.com/music2.mp3');


INSERT INTO graphics (source) VALUES 
('https://example.com/graphics1.png'), 
('https://example.com/graphics2.png');


INSERT INTO scene (name, description, screen_type, screen_id, graphics_id) VALUES 
('Battle at the River', 'A battle scene set near a river.', 'fullscreen', 1, 1);


INSERT INTO scene_music (scene_id, music_id) VALUES 
(1, 1), 
(1, 2);


INSERT INTO battlemap_tracker (locked, graphics_id, graphicsLocked_id) VALUES 
(false, 1, 2);
