# Vision

## Ziel

Die App ist **keine 1:1-Übertragung von DnD in die digitale Welt**. Gespielt wird weiterhin am echten Tisch.
Die App soll

- den **Spielleiter** bei der Durchführung eines Abenteuers unterstützen (Szenen steuern, Notizen, Musik, Sounds) und
- die **Immersion der Spieler** durch digitale Elemente erhöhen (Atmosphäre-Bilder, digitales Spielbrett, Musik, Soundeffekte).

## Nutzergruppen

### Spielleiter (1, Admin)
- Gestaltet das Abenteuer und erzählt die Geschichte.
- Schlüpft in die Rolle aller anderen Charaktere (NPCs), auf die die Spieler treffen – freundlich wie feindlich.
- Bedient den **Admin Screen**: aktiviert Szenen, liest Notizen, steuert Musik und Sounds.
  Eine Navigationsleiste links wechselt zwischen Notizen, Szenen und Kampf (bisher nur Notizen umgesetzt, siehe
  [screens.md](screens.md#admin-screen)).

### Spieler (n)
- Erleben die Welt durch ihre Charaktere, in die sie schlüpfen.
- Treffen auf NPCs, die freundlich oder feindlich auftreten können.
- Jeder Spieler hat einen **Player Screen** auf dem eigenen Smartphone vor sich auf dem Tisch.
- Alle Spieler sehen gemeinsam **Wall Screen** (Atmosphäre) und **Ground Screen** (Spielbrett).

## Spielsituation / Setup

- Ein Rechner mit mehreren Monitoren: Admin Screen (für den Spielleiter), Wall Screen (Monitor/Wand für Atmosphäre),
  Ground Screen (liegend auf dem Tisch als digitales Spielbrett).
- Smartphones der Spieler mit dem Player Screen.

## Kernkonzept: Szenen

Der Spielleiter steuert das Geschehen über **Szenen**. Eine Szene umfasst immer:
- ein Bild auf dem **Ground Screen**,
- ein Bild auf dem **Wall Screen**,
- ein oder mehrere **Sound-Elemente** (Musik).

Alle Szenen sind gleich (z. B. Dorf, Shop, Taverne, Kampfschauplatz). Ob gekämpft wird, entscheidet nicht die
Szene: Einen Kampf startet der Spielleiter in jeder Szene (geplant, Menüpunkt „Kampf“ im Admin).
Details: [domain.md](domain.md), [screens.md](screens.md).
