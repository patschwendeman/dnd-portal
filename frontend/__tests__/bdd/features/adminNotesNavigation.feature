Feature: Cross references and history of the notes in the admin screen

Scenario: The history buttons when the admin screen is loaded
    Given I am on the admin screen
    Then the header shows Zurück and Vor in their own tile at the far left, both disabled
    And Main is the selected notes entry

Scenario: I follow a cross reference into another folder
    Given I am on the admin screen showing the notes Leveling
    When I click on the link Rast
    Then Mechaniken is selected and the heading Rasten is at the top of the notes
    And the URL of the admin screen is unchanged

Scenario: I follow an anchor in the same folder
    Given I am on the admin screen showing the notes Mechaniken
    When I click on Rettungswurf in the table of contents
    Then the notes scroll to the heading Rettungswurf
    And Zurück is enabled

Scenario: I go back and forward
    Given I scrolled down the notes Leveling and followed the link Rast
    When I click on Zurück
    Then Leveling is selected at the same scroll position as before the link
    And Vor is enabled
    When I click on Vor
    Then Mechaniken is selected and the heading Rasten is at the top of the notes
    And Vor is disabled

Scenario: I go back after selecting another entry in the panel
    Given I scrolled down the notes Main
    When I select the notes entry Fight and click on Zurück
    Then Main is selected at the same scroll position as before

Scenario: A new move after going back drops Vor
    Given I followed the link Rast and went back
    When I select the notes entry Fight
    Then Vor is disabled

Scenario: I go back and forward with the keyboard and the mouse
    Given I scrolled down the notes Leveling and followed the link Rast
    When I press Alt+Left
    Then Leveling is selected at the same scroll position as before the link
    When I press Alt+Right
    Then Mechaniken is selected and the heading Rasten is at the top of the notes
    When I press the back button of the mouse
    Then Leveling is selected at the same scroll position as before the link
    When I press the forward button of the mouse
    Then Mechaniken is selected and the heading Rasten is at the top of the notes
    And the browser is still on the admin screen
