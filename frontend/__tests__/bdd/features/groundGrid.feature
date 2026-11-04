Feature: Grid of the ground screens

Scenario: I set the grid of all grounds from the admin
    Given no grid is shown and I am on the admin screen with two ground screens open
    And the panel Einstellungen is open
    When I click on Weiß in the row Ground of the panel Spieltisch
    Then both ground screens show a white grid with cell size 100 and the panel highlights Weiß
    And the panel Spieltisch shows no Zellgröße
    When I move the slider Zellgröße in the panel Einstellungen to 150 and release it
    Then both ground screens show a white grid with cell size 150 and the panel shows 150
    And a ground screen opened afterwards shows a white grid with cell size 150
    When the active scene changes
    Then both ground screens still show a white grid with cell size 150
    When I click on Aus in the row Ground of the panel Spieltisch
    Then both ground screens show no grid and the panel highlights Aus
