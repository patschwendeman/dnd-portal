Feature: Navigation rail in the admin screen

Scenario: The notes panel is open when the admin screen is loaded
    Given I am on the admin screen
    Then I see the navigation rail with the active menu item Notizen
    And the panel shows the notes entries Main, Fight, Side, Leveling, Mechaniken
    And Main is selected and the main notes are shown

Scenario: I select notes in the panel
    Given I am on the admin screen
    When I click on the notes entry Leveling
    Then Leveling is selected and the leveling notes are shown

Scenario: I collapse and expand the panel
    Given I am on the admin screen
    And I selected the notes entry Leveling and scrolled down the notes
    When I click on the menu item Notizen
    Then the panel is hidden, the notes are wider and the menu item is not active
    When I click on the menu item Notizen again
    Then the panel is shown again with Leveling selected and the notes at the same scroll position
