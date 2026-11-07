Feature: Settings in the admin screen

Scenario: The header shows the active adventure and no settings button
    Given I am on the admin screen
    Then the header shows the name of the active adventure, not clickable
    And the header has only the buttons Zurück, Vor, Vollbild and Dashboard

Scenario: I open the settings from the lower end of the navigation rail
    Given I am on the admin screen
    When I click on the menu item Einstellungen
    Then Einstellungen is highlighted at the lower end of the rail
    And the panel shows the sections Darstellung and Ground-Raster and below them Abenteuer beenden
    And the notes are still shown
    When I click on the menu item Einstellungen again
    Then the panel is hidden
    When I click on the menu item Einstellungen and then on the menu item Szenen
    Then the panel shows the scenes

Scenario: I decline ending the adventure
    Given I am on the admin screen with the settings open
    Then the button Abenteuer beenden shows the name of the active adventure
    When I click on Abenteuer beenden
    Then the dialog Abenteuer beenden names the active adventure
    When I click on Decline
    Then the dialog is closed and the adventure is still active

Scenario: I switch the theme with the keyboard and the mouse
    Given the theme is Cyber and a wall screen is open
    And I am on the admin screen with the settings open
    Then the theme select shows Cyber
    And the admin shows the adventure image
    When I focus the theme select and press the arrow down
    Then the list opens with Cyber selected and focused
    When I press the arrow down and Enter
    Then the theme on the server is Taverne, the wall shows Taverne and the select shows Taverne
    And the admin still shows the adventure image
    When I open the theme select and click on Cyber
    Then the theme on the server is Cyber, the wall shows Cyber and the select shows Cyber
    And the admin still shows the adventure image
