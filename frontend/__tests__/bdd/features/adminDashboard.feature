Feature: Dashboard in the admin screen

Scenario: The dashboard shows its panels next to the notes
    Given I am on the admin screen
    Then I see the dashboard with the panels Aktive Szene, Musik, Sounds, Screens
    And Aktive Szene and Musik span the full width, below them Sounds and Screens side by side
    And there is no bottom bar, no sound button and no join button in the top bar

Scenario: I collapse and expand the dashboard
    Given I am on the admin screen
    And I selected the notes entry Leveling and scrolled down the notes
    When I click on the dashboard icon in the top bar
    Then the dashboard is hidden, the notes are wider, the icon is off
    And Leveling is still selected and the notes are at the same scroll position
    When I click on the dashboard icon again
    Then the dashboard is shown again and the icon is highlighted
    When I reload the admin screen after collapsing the dashboard
    Then the dashboard is shown

Scenario: I control music and sounds from the dashboard
    Given I am on the admin screen
    When I click on the play button in the panel Musik
    Then the music state on the server switches and the panel shows it
    When I click on the play button again
    Then the music state on the server switches back
    When I click on a sound button in the panel Sounds
    Then no error bar is shown

Scenario: I see which screens are connected
    Given a wall screen and a ground screen are open
    And I am on the admin screen
    Then the panel Screens shows Wall and Ground as connected
    When the ground screen is closed
    Then the panel Screens shows Ground as not connected

Scenario: I open the QR code from the panel Screens
    Given I am on the admin screen
    When I click on the button QR-Code in the panel Screens
    Then the dialog with the QR code and the player URL is shown
    When I press Escape
    Then the dialog is closed and the focus is back on the button QR-Code
