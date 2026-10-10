Feature: Select a side scene

Scenario: I select a side scene to see the correct wall image at the wall screen
    Given I am on the admin screen
    When I click on a side scene
    And I click the Confirm button
    And I go to wall screen
    Then I see the correct wall image
