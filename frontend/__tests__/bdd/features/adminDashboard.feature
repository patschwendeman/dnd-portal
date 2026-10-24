Feature: Dashboard in the admin screen

Scenario: The dashboard shows its panels next to the notes
    Given I am on the admin screen
    Then I see the dashboard with the panels Aktive Szene, Musik, Sounds, Screens, Level, Spieler
    And Aktive Szene spans the full width, below it Musik and Sounds side by side, below them Screens, Level and Spieler over the full width
    And no panel scrolls on its own
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
    Given I am on the admin screen
    And I noted how many wall and ground screens the panel Screens shows as connected
    When a wall screen and a ground screen are opened
    Then the panel Screens shows one more Wall and one more Ground as connected
    When the ground screen is closed
    Then the panel Screens shows one Ground less as connected

Scenario: I open the QR code from the panel Screens
    Given I am on the admin screen
    When I click on the QR code icon next to the players in the panel Screens
    Then the dialog with the QR code and the player URL is shown
    When I press Escape
    Then the dialog is closed and the focus is back on the QR code icon

Scenario: I switch the admin window to full screen
    Given I am on the admin screen
    When I click on the full screen icon in the top bar
    Then the admin window is in full screen and the icon is highlighted
    When I click on the full screen icon again
    Then the admin window is no longer in full screen
