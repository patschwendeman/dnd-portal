Feature: Settings in the admin screen

Scenario: The header shows the active adventure and no settings button
    Given I am on the admin screen
    Then the header shows the name of the active adventure, not clickable
    And the header has only the buttons Zurück, Vor, Vollbild and Dashboard

Scenario: I open the settings from the lower end of the navigation rail
    Given I am on the admin screen
    When I click on the menu item Einstellungen
    Then Einstellungen is highlighted at the lower end of the rail
    And the panel shows the sections Abenteuer, Darstellung and Ground-Raster
    And the notes are still shown
    When I click on the menu item Einstellungen again
    Then the panel is hidden
    When I click on the menu item Einstellungen and then on the menu item Szenen
    Then the panel shows the scenes

Scenario: I open the adventure select in the settings
    Given I am on the admin screen with the settings open
    When I click on the adventure select
    Then the list shows the active adventure as selected
    When I press Escape
    Then the list is closed and the focus is back on the adventure select

Scenario: I switch the theme with the keyboard and the mouse
    Given the theme is Dunkel and a wall screen is open
    And I am on the admin screen with the settings open
    Then the theme select shows Dunkel
    When I focus the theme select and press the arrow down
    Then the list opens with Dunkel selected and focused
    When I press the arrow down and Enter
    Then the theme on the server is Taverne, the wall shows Taverne and the select shows Taverne
    When I open the theme select and click on Dunkel
    Then the theme on the server is Dunkel, the wall shows Dunkel and the select shows Dunkel
