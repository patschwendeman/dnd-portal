Feature: Select a main scene

Scenario: I select a main scene to see the main map at the ground screen
    Given I am on the admin screen
    When I click on a main scene
    And I click the Confirm button
    And I go to ground screen
    Then I see the correct main map

Scenario: I select a main scene to see the updated map overview at the wall screen
    Given I am on the admin screen
    When I click on a main scene
    And I click the Confirm button
    And I go to wall screen
    Then I see the updated map overview

Scenario: I select a main scene to see the correct wall image at the wall screen
    Given I am on the admin screen
    When I click on a main scene
    And I click the Confirm button
    And I go to wall screen
    Then I see the correct wall image
