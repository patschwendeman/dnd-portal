def filter_locked_battlemaps(battlemaps):
    filtered_battlemaps = []

    for battlemap in battlemaps:
        if battlemap.locked == True:
            filtered_battlemaps.append(battlemap.source_locked)

        if battlemap.locked == False:
            filtered_battlemaps.append(battlemap.source_clear)
    return filtered_battlemaps