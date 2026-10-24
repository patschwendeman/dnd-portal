Feature: Overlay of the wall screens

Scenario: I show and hide the world map on all walls from the admin
    Given no overlay is shown and I am on the admin screen with two wall screens open
    When I click on Weltkarte in the panel Wall-Overlay
    Then both wall screens show the world map and the panel highlights Weltkarte
    When I click on Aus in the panel Wall-Overlay
    Then both wall screens hide the world map and the panel highlights Aus

Scenario: I show the world map from the control bar of a wall
    Given no overlay is shown and I am on the admin screen with two wall screens open
    When I click on WORLD in the control bar of the first wall screen
    Then both wall screens show the world map and the panel highlights Weltkarte

Scenario: A scene change hides the world map
    Given the world map is shown and I am on the admin screen with two wall screens open
    When the active scene changes
    Then both wall screens hide the world map and the panel highlights Aus
