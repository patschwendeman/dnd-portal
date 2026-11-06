Feature: Dashboard in the admin screen

Scenario: The dashboard shows its panels next to the notes
    Given I am on the admin screen
    Then I see the dashboard with the panels Aktive Szene, Audio, Spieltisch, Party and no panel Level
    And the panels lie in one column over the full width of the dashboard, each as high as its content
    And the dashboard takes a third of the width, at least 400 and at most 560 pixels
    And no panel scrolls on its own
    And there is no bottom bar, no sound button and no join button in the header

Scenario: I collapse and expand the dashboard
    Given I am on the admin screen
    And I selected the notes entry Leveling and scrolled down the notes
    When I click on the dashboard icon in the header
    Then the dashboard is hidden, the notes are wider, the icon is off
    And Leveling is still selected and the notes are at the same scroll position
    When I click on the dashboard icon again
    Then the dashboard is shown again and the icon is highlighted
    When I reload the admin screen after collapsing the dashboard
    Then the dashboard is shown

Scenario: I control music and sounds from the dashboard
    Given I am on the admin screen
    When I click on the play button in the panel Audio
    Then the music state on the server switches and the panel shows it
    When I click on the play button again
    Then the music state on the server switches back
    When I move the volume slider to 50 and release it
    Then the volume on the server is 50 and the panel shows 50
    When I click on a sound button in the panel Audio
    Then no error bar is shown

Scenario: The first interaction makes an admin window the audio output
    Given I am on the admin screen and no window is the audio output
    And a second admin window is open
    Then both admin windows show the hint Keine Audioausgabe bereit and no button Hier abspielen
    When I click on the notes in the first admin window
    Then the hint is gone in both admin windows
    When I press a key in the second admin window and the first admin window is closed
    Then the second admin window shows the hint Keine Audioausgabe bereit
    When I click on the play button in the second admin window
    Then the hint is gone and the music plays
    When I reload the second admin window
    Then it shows the hint Keine Audioausgabe bereit until I press a key there

Scenario: I see which screens are connected
    Given I am on the admin screen
    And I noted how many wall and ground screens the panel Spieltisch shows as connected
    When a wall screen and a ground screen are opened
    Then the panel Spieltisch shows one more Wall and one more Ground as connected
    When the ground screen is closed
    Then the panel Spieltisch shows one Ground less as connected

Scenario: The QR code button in the row Spieler switches the wall and opens no dialog
    Given I am on the admin screen
    Then the row Spieler in the panel Spieltisch shows the connected players, the text Spieler QR-Code and the QR code icon
    And the row Wall of the panel Spieltisch offers only Weltkarte and Aus
    When I click on the QR code icon in the row Spieler
    Then the QR code icon is pressed and no dialog is open in the admin screen
    When I click on the QR code icon again
    Then the QR code icon is no longer pressed

Scenario: I switch the admin window to full screen
    Given I am on the admin screen
    When I click on the full screen icon in the header
    Then the admin window is in full screen and the icon is highlighted
    When I click on the full screen icon again
    Then the admin window is no longer in full screen
