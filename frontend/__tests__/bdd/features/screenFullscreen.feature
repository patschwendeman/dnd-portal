Feature: Full screen overlay of the wall and ground screens

Scenario Outline: I switch the <screen> screen to full screen with the overlay
    Given the <screen> screen is open and the mouse was not over it
    Then no overlay is shown
    When I move the mouse over the <screen> screen
    Then the overlay darkens the whole screen and shows the text Vollbild
    When I click on the overlay
    Then the window is in full screen and the overlay shows the text Vollbild beenden
    When I click on the overlay again
    Then the window is no longer in full screen and the overlay shows the text Vollbild
    When the mouse leaves the window
    Then no overlay is shown

    Examples:
        | screen |
        | wall   |
        | ground |
