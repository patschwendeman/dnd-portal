from urllib.parse import urlsplit

DEFAULT_PORTS = {"http": 80, "ws": 80, "https": 443, "wss": 443}


def _host_and_port(netloc: str, scheme: str) -> tuple[str, int | None] | None:
    try:
        parts = urlsplit(f"//{netloc}")
        port = parts.port
    except ValueError:
        return None
    if parts.hostname is None:
        return None
    return parts.hostname.lower(), port if port is not None else DEFAULT_PORTS.get(scheme)


def is_origin_allowed(origin: str | None, host: str | None, allowed_origins: list[str]) -> bool:
    """CORS does not apply to WebSockets, so the handshake checks the origin itself.

    Allowed: no `Origin` (not a browser), a configured origin, or the same host and port as the `Host` header (the
    frontend and the API behind the same proxy, e.g. http://<IP>:8080 in the LAN).
    """
    if origin is None:
        return True
    if origin in allowed_origins:
        return True
    if host is None:
        return False
    scheme = urlsplit(origin).scheme.lower()
    origin_address = _host_and_port(urlsplit(origin).netloc, scheme)
    return origin_address is not None and origin_address == _host_and_port(host, scheme)
