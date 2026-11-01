Feature: Party and level in the admin dashboard

Scenario: The panel Party shows the players of the adventure in one column
    Given I am on the admin screen
    Then the panel Party shows a row for Aragorn, Legolas, Gimli and Gandalf in this order
    And each row shows the initials, the character name and race, class and player name
    And each player has a row of its own over the full width of the panel
    And the head of the panel shows Party with the number of players and the level of the adventure

Scenario: I change the level of all players
    Given the level of the active adventure is 1
    And I am on the admin screen in two windows
    Then the head of the panel Party shows level 1 and its minus button is disabled
    When I click on the plus button in the head of the panel Party
    Then the head of the panel Party shows level 2 in both windows
    When I click on the minus button in the head of the panel Party
    Then the head of the panel Party shows level 1 in both windows

Scenario: The level does not go above 20
    Given the level of the active adventure is 20
    And I am on the admin screen
    Then the head of the panel Party shows level 20 and its plus button is disabled
    When I click on the plus button in the head of the panel Party
    Then the level stays 20
    When I click on the minus button in the head of the panel Party
    Then the head of the panel Party shows level 19
