"""Baseline (DND-31): existing dead code found by vulture, to be cleaned up in follow-up tasks.

Read by vulture together with the code ([tool.vulture] in pyproject.toml), so these names count as used. Do not add
new entries: remove an entry together with the dead code it stands for.
"""

# ruff: noqa: B018, F821

# Relationship never read (only `active_scene_id` is used), app/models/adventure.py
active_scene
