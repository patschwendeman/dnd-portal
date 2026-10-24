"""Names vulture reports as unused although they are used indirectly (false positives).

Read by vulture together with the code ([tool.vulture] in pyproject.toml). Only genuine false positives belong here;
real dead code goes into vulture_baseline.py.
"""

# ruff: noqa: B018, F821

# First argument of a Pydantic validator (`@classmethod`), app/core/config.py
cls

# ORM foreign key of the relationship `avatar`, filled by the seeder (`Player(**item)`), app/models/player.py
avatar_media_id
_.avatar_media_id

# Pydantic field, set via keyword argument in app/realtime/audio.py
output_ready

# pytest fixture requested only for its side effect, tests/test_audio.py
first_track
