Feature: Select a scene

Scenario: The scenes panel lists all scenes of the adventure
    Given a scene is active
    And I am on the admin screen
    When I click on the menu item Szenen
    Then the panel shows all scenes of the adventure in the order they were created
    And the active scene is highlighted

Scenario: I select a scene to see its images at the wall and ground screen
    Given I am on the admin screen
    When I click on the menu item Szenen
    And I click on a scene that is not active
    And I click the Confirm button
    Then the scene is highlighted as active
    When I go to wall screen
    Then I see the wall image of the scene
    When I go to ground screen
    Then I see the ground image of the scene
