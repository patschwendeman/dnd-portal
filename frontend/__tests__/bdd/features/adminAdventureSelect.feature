Feature: Adventure selection before the admin screen

Scenario: The selection shows the adventures with the active one marked
    Given the adventure Erstes Abenteuer is active
    When I open the adventure selection
    Then I see a card for every adventure
    And the card of Erstes Abenteuer is marked as active
    And the card shows image, name, level, description and the party of the adventure
    And the background is plain

Scenario: I start an adventure while none is active
    Given no adventure is active and a player screen is open
    When I open the adventure selection
    Then no card is marked as active and the background is plain
    And still no adventure is active on the server
    When I click on the card of Erstes Abenteuer
    Then Erstes Abenteuer is active on the server and the admin screen shows it
    And the player screen shows the characters of Erstes Abenteuer

Scenario: I continue the active adventure
    Given the adventure Erstes Abenteuer is active
    When I open the adventure selection
    And I click on the card of Erstes Abenteuer
    Then the admin screen shows Erstes Abenteuer and the active adventure is unchanged

Scenario: The admin screen builds up after entering from the selection, not after a reload
    Given the adventure Erstes Abenteuer is active
    When I open the adventure selection
    And I click on the card of Erstes Abenteuer
    Then the admin screen builds up its tiles until all of them stand
    When I reload the admin screen
    Then the admin screen stands at once without building up its tiles

Scenario: I end the adventure
    Given an adventure with an active scene is active, a wall and a second admin screen are open
    And I am on the admin screen with the settings open
    When I click on Abenteuer beenden and confirm the dialog
    Then no adventure is active on the server and the wall shows no scene image
    And both admin screens show the adventure selection

Scenario: A fight locks the change of the adventure
    Given a fight is running in the active adventure
    When I open the adventure selection
    Then the selection says that a fight is running
    And the card of the active adventure is not locked
    When I click on the card of the active adventure
    Then the admin screen opens

Scenario: The admin screen without an active adventure leads to the selection
    Given no adventure is active
    When I open the admin screen directly
    Then I am on the adventure selection

Scenario: The selection reports that the adventures cannot be loaded
    Given the adventures cannot be loaded
    When I open the adventure selection
    Then the selection says Keine Verbindung zum Server with Erneut versuchen
    When the adventures can be loaded again and I click on Erneut versuchen
    Then I see a card for every adventure

Scenario: The selection without adventures
    Given the server has no adventures
    When I open the adventure selection
    Then the selection says Noch keine Abenteuer
