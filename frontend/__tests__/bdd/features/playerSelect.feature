Feature: Character selection on the player screen

Scenario: The selection lists the characters of the active adventure
    Given an adventure with players is active
    When a player opens the selection
    Then the selection shows the name of the adventure and one row per character in the order of the API
    And the selection has no link to admin, wall or ground

Scenario: A player chooses a character and switches back
    Given an adventure with players is active
    And a player opens the selection
    When the player taps the first character
    Then the player screen of the first character is open
    When the player opens the settings menu
    Then the menu offers the themes and "Charakter wechseln"
    When the player chooses "Charakter wechseln"
    Then the selection is open without a hint
    And the settings menu of the selection has no entry "Charakter wechseln"

Scenario Outline: An invalid link leads to the selection
    Given an adventure with players is active
    When a player opens the player screen of <id>
    Then the selection is open without a hint

    Examples:
    | id               |
    | an unknown id    |
    | an invalid id    |
