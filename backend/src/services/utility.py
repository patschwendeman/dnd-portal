def filter_locked_battlemaps(battlemaps):
    filtered_battlemaps = []

    for battlemap in battlemaps:
        if battlemap.locked:
            filtered_battlemaps.append({
                'id': battlemap.id,
                'source': battlemap.source_locked
            })
        else:
            filtered_battlemaps.append({
                'id': battlemap.id,
                'source': battlemap.source
            })
    return filtered_battlemaps

def filter_battlemaps(battlemaps):
    filtered_battlemaps = []

    for battlemap in battlemaps:
        filtered_battlemaps.append({
            'id': battlemap.id,
            'source': battlemap.source
        })
    return filtered_battlemaps
