Feature: Overlay of the wall screens

Scenario: I show and hide the world map on all walls from the admin
    Given no overlay is shown and I am on the admin screen with two wall screens open
    When I click on Weltkarte in the row Wall of the panel Spieltisch
    Then both wall screens show the world map and the panel highlights Weltkarte
    When I click on Aus in the row Wall of the panel Spieltisch
    Then both wall screens hide the world map and the panel highlights Aus

Scenario: A scene change hides the world map
    Given the world map is shown and I am on the admin screen with two wall screens open
    When the active scene changes
    Then both wall screens hide the world map and the panel highlights Aus

Scenario: I show and hide the QR code for the players on all walls with the button in the row Spieler
    Given no overlay is shown and I am on the admin screen with two wall screens open
    When I click on the QR code icon in the row Spieler of the panel Spieltisch
    Then both wall screens show the panel Spieler verbinden with the QR code and the URL of the player screen, the icon is pressed and no option of the row Wall is highlighted
    And the screen below the panel is dimmed and the QR code is completely visible
    When I click on the QR code icon in the row Spieler of the panel Spieltisch
    Then both wall screens show no overlay, the icon is not pressed and the panel highlights Aus

Scenario: I switch between the world map, the QR code and Aus
    Given the QR code is shown and I am on the admin screen with two wall screens open
    When I click on Weltkarte in the row Wall of the panel Spieltisch
    Then both wall screens show the world map without the QR code, the icon is not pressed and the panel highlights Weltkarte
    When I click on the QR code icon in the row Spieler of the panel Spieltisch
    Then both wall screens show the panel Spieler verbinden with the QR code and the URL of the player screen, the icon is pressed and no option of the row Wall is highlighted
    When I click on Aus in the row Wall of the panel Spieltisch
    Then both wall screens show no overlay, the icon is not pressed and the panel highlights Aus

Scenario: The walls show a hint if the player URL is unknown
    Given no overlay is shown and I am on the admin screen with two wall screens open
    And the player URL cannot be loaded on the wall screens
    When I click on the QR code icon in the row Spieler of the panel Spieltisch
    Then both wall screens show the panel Spieler verbinden with the hint and no QR code

Scenario: A wall opened later shows the QR code at once
    Given the QR code is shown and I am on the admin screen with two wall screens open
    When another wall screen is opened
    Then it shows the panel Spieler verbinden with the QR code and the URL of the player screen

Scenario: A scene change hides the QR code
    Given the QR code is shown and I am on the admin screen with two wall screens open
    When the active scene changes
    Then both wall screens show no overlay, the icon is not pressed and the panel highlights Aus
