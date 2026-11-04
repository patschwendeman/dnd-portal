Feature: Fight in the admin screen

Scenario: I prepare a fight
    Given a scene is active and no fight is running
    And I am on the admin screen
    When I click on the menu item Kampf
    Then the panel Kampf vorbereiten lists all players of the party
    When I add an enemy with the label Ghul
    Then Gegner 1 with Ghul is last and the number field suggests 2
    When I add the number 1 once more
    Then the panel says the number 1 is taken and the list stays the same
    When I remove the first player
    Then the player is missing from the list and can be added again

Scenario: I start a fight and end turns until the next round
    Given a scene is active and no fight is running
    And I am on the admin screen
    When I click on the menu item Kampf
    And I prepare two players and one enemy
    And I click Kampf starten
    Then Am Zug shows the first combatant in round 1, then Initiative, Audio, Spieltisch
    When I click Zug beenden three times
    Then the first combatant is on turn in round 2

Scenario: Scene and adventure are locked during a fight
    Given a fight is running
    And I am on the admin screen
    When I click on the menu item Szenen
    And I click on a scene that is not active
    Then no dialog opens and the panel says that the fight is running
    When I click on the menu item Einstellungen and on the adventure select
    Then the adventure select is locked and no list opens

Scenario: I end the fight
    Given a fight is running
    And I am on the admin screen
    When I click on the menu item Kampf
    And I click Kampf beenden and Decline
    Then the fight is still running
    When I click Kampf beenden and Confirm
    Then the stage, the party and the panel Kampf vorbereiten are back

Scenario: Defeated combatants are skipped
    Given a fight of the first player, enemy 1 and the second player is running
    And I am on the admin screen
    When I mark Gegner 1 as defeated and click Zug beenden
    Then Gegner 1 shows Besiegt and the second player is on turn

Scenario: Reinforcement and removing the combatant on turn
    Given a fight of the first player, enemy 1 and the second player is running
    And I am on the admin screen
    When I click on the menu item Kampf
    And I add an enemy as reinforcement
    Then Gegner 2 is at the end of the initiative
    When I remove the combatant on turn
    Then enemy 1 is on turn and the round stays 1
