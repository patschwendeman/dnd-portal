# Quality checks beyond ruff/mypy (DND-31): dead code, dependencies, complexity, duplicates.
# Same targets locally and in CI (.github/workflows/backend.yml, job `quality`). Configuration in pyproject.toml;
# xenon reads no config file, so its limits live here.

.PHONY: check-quality check-deadcode check-deps check-complexity check-dupes

check-quality: check-deadcode check-deps check-complexity check-dupes

check-deadcode:
	uv run vulture

check-deps:
	uv run deptry .

# Baseline (DND-31): ranks of the current code in app/. Tighten them, never loosen them.
check-complexity:
	uv run xenon --max-absolute B --max-modules B --max-average A app

check-dupes:
	uv run pylint app
