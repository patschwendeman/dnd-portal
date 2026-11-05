Feature: Party and initiative on the wall screen

Scenario: The wall shows the players left and right, the world map lies above them
    Given a scene is active, no fight is running and no overlay is shown
    And the wall screen is open
    Then the wall shows the first half of the players left and the rest right
    When the world map is shown on the walls
    Then the world map lies above the players

Scenario: The wall follows the fight
    Given a scene is active, no fight is running and no overlay is shown
    And the wall screen is open
    When the game master starts a fight of the first player, enemy 1 with a label and the second player
    Then the wall shows the first player large in round 1, then Gegner 1 and the second player, and no party tiles
    When the game master ends the turn
    Then the wall shows Gegner 1 large, then the second player, the divider Runde 2 and the first player
    When the game master ends the fight
    Then the wall shows the players left and right again
