Feature: Select a scene

Scenario: I select a fight scene to see the battle map at the ground screen
    Given I am on the admin screen
    When I click on a fight scene
    And I click the Confirm button
    And I go to ground screen
    Then I see the correct battle map