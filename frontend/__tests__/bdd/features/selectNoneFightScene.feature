Feature: Select a none fight scene

Scenario: I select a none fight scene to see the correct wall image at the wall screen
    Given I am on the admin screen
    When I click on a none fight scene
    And I click the Confirm button
    And I go to wall screen
    Then I see the correct wall image