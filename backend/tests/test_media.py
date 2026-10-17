"""Media files under /media (StaticFiles on the media folder) and the `source` format of the API."""

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

IMAGE_KEY = "images/wall_screen/test.jpg"
IMAGE_CONTENT = b"\xff\xd8\xff test image"
AUDIO_KEY = "music/side/test/track.mp3"
AUDIO_CONTENT = bytes(range(256)) * 4
SECRET_CONTENT = b"outside the media folder"
REPO_ROOT = Path(__file__).resolve().parents[2]
REPO_MEDIA_DIR = REPO_ROOT / "media"


@pytest.fixture(scope="module", autouse=True)
def media_files(media_dir: Path) -> None:
    for key, content in ((IMAGE_KEY, IMAGE_CONTENT), (AUDIO_KEY, AUDIO_CONTENT)):
        path = media_dir / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    (media_dir.parent / "secret.txt").write_bytes(SECRET_CONTENT)


def test_image_is_served_with_content_type(client: TestClient) -> None:
    response = client.get(f"/media/{IMAGE_KEY}")

    assert response.status_code == 200
    assert response.content == IMAGE_CONTENT
    assert response.headers["content-type"] == "image/jpeg"


def test_audio_is_served_completely_with_accept_ranges(client: TestClient) -> None:
    response = client.get(f"/media/{AUDIO_KEY}")

    assert response.status_code == 200
    assert response.content == AUDIO_CONTENT
    assert response.headers["content-type"] == "audio/mpeg"
    assert response.headers["accept-ranges"] == "bytes"


def test_audio_range_request_returns_partial_content(client: TestClient) -> None:
    response = client.get(f"/media/{AUDIO_KEY}", headers={"Range": "bytes=100-199"})

    assert response.status_code == 206
    assert response.content == AUDIO_CONTENT[100:200]
    assert response.headers["content-range"] == f"bytes 100-199/{len(AUDIO_CONTENT)}"


def test_missing_file_returns_404(client: TestClient) -> None:
    response = client.get("/media/images/wall_screen/missing.jpg")

    assert response.status_code == 404


@pytest.mark.parametrize(
    "path",
    [
        "/media/%2e%2e/secret.txt",
        "/media/..%2fsecret.txt",
        "/media/images/%2e%2e/%2e%2e/secret.txt",
    ],
)
def test_path_traversal_out_of_the_media_folder_is_rejected(client: TestClient, path: str) -> None:
    response = client.get(path)

    # The encoded dot segments reach the app unchanged (the client does not normalise them away).
    assert str(response.request.url).endswith(path)
    assert response.status_code == 404
    assert SECRET_CONTENT not in response.content


def test_scene_sources_point_to_media_paths(client: TestClient, seed: dict[str, Any]) -> None:
    storage_keys = {item["storage_key"] for item in seed["media"]}

    for scene in client.get("/adventures/1/scenes").json():
        for item in (scene["wall_image"], scene["ground_image"], *scene["tracks"]):
            assert item["source"].startswith("/media/")
            assert item["source"].removeprefix("/media/") in storage_keys


@pytest.mark.parametrize("maptype", ["main", "side"])
def test_map_sources_point_to_media_paths(client: TestClient, seed: dict[str, Any], maptype: str) -> None:
    storage_keys = {item["storage_key"] for item in seed["media"]}

    for entry in client.get(f"/adventures/1/maps/{maptype}").json():
        assert entry["source"].removeprefix("/media/") in storage_keys
        assert entry["source"].startswith("/media/")


def test_every_seeded_media_file_exists_in_the_repository(seed: dict[str, Any]) -> None:
    # In the API container the tests live in /app/tests: the parent is no repository (Debian has its own /media).
    if not (REPO_ROOT / "backend").is_dir() or not REPO_MEDIA_DIR.is_dir():
        pytest.skip("media/ of the repository is not available (e.g. in the API container)")

    missing = [item["storage_key"] for item in seed["media"] if not (REPO_MEDIA_DIR / item["storage_key"]).is_file()]

    assert missing == []
