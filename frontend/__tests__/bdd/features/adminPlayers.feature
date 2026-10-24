Feature: Players and level in the admin dashboard

Scenario: The panel Spieler shows the players of the adventure
    Given I am on the admin screen
    Then the panel Spieler shows a hero card for Aragorn, Legolas, Gimli and Gandalf in this order
    And each card shows player name, character name, race, class, initials and the level of the adventure
    And the panel Level spans the full width directly above the panel Spieler

Scenario: I change the level of all players
    Given the level of the active adventure is 1
    And I am on the admin screen in two windows
    Then the panel Level shows 1 and its minus button is disabled
    When I click on the plus button in the panel Level
    Then the panel Level and all level badges show 2 in both windows
    When I click on the minus button in the panel Level
    Then the panel Level and all level badges show 1 in both windows

Scenario: The level does not go above 20
    Given the level of the active adventure is 20
    And I am on the admin screen
    Then the panel Level shows 20 and its plus button is disabled
