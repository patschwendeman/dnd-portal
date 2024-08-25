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
