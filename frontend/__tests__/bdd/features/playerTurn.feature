Feature: Hero card and "Zug beenden" on the player screen

Scenario: The player screen shows the hero card above the resources
    Given a scene is active and no fight is running
    When the first player opens his player screen
    Then the hero card and the resources each take half of the height
    And the hero card shows player name, character name, race, class, the level and the settings menu
    And the hero card is not on turn
    And hero card and resources have the same surface as the settings button
    And the open settings menu lies above the resources

Scenario: The player on turn ends his turn
    Given a fight of the first player, an enemy and the second player is running
    And the admin screen is open
    When the first player opens his player screen
    Then the hero card shows frame, badge "Am Zug" and the button "Zug beenden"
    When the first player taps "Zug beenden"
    Then the enemy is on turn
    And the admin shows the enemy on turn
    And the hero card is not on turn

Scenario: A player gets the button only when the turn passes to him
    Given a fight of the first player, an enemy and the second player is running
    When the second player opens his player screen
    Then the hero card is not on turn
    When the game master ends the turn of the first player
    Then the enemy is on turn
    And the hero card is not on turn
    When the game master ends the turn of the enemy
    Then the second player is on turn
    And the hero card shows frame, badge "Am Zug" and the button "Zug beenden"

Scenario: The turn passes only once
    Given a fight of the first player, an enemy and the second player is running
    When the first player opens his player screen
    And the first player taps "Zug beenden" while a second phone ends the same turn
    Then the enemy is on turn

Scenario: The level on the hero card follows the game master
    Given a scene is active and no fight is running
    When the first player opens his player screen
    And the game master changes the level of the adventure
    Then the hero card shows the new level without a reload
