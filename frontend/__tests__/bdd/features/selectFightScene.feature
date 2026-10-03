Feature: Select a fight scene

Scenario: I select a fight scene to see the battle map at the ground screen
    Given I am on the admin screen
    When I click on a fight scene
    And I click the Confirm button
    And I go to ground screen
    Then I see the correct battle map

Scenario: I select a fight scene to see the updated map overview at the wall screen
    Given I am on the admin screen
    When I click on a fight scene
    And I click the Confirm button
    And I go to wall screen
    Then I see the updated map overview

Scenario: I select a fight scene to see the correct wall image at the wall screen
    Given I am on the admin screen
    When I click on a fight scene
    And I click the Confirm button
    And I go to wall screen
    Then I see the correct wall image