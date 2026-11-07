/**
 * The panel next to the navigation rail shows at most one menu item. Clicking the open item
 * collapses the panel, so the notes get the width; any other item opens (or switches) the panel.
 */
const nextOpenPanel = <T extends string>(open: T | null, clicked: T): T | null => (
  open === clicked ? null : clicked
)

type NavRailPlacement = 'top' | 'bottom'

/**
 * Rarely used menu items (the settings) sit at the lower end of the rail, apart from the ones
 * needed during the game; both groups keep the order of the list
 */
const splitByPlacement = <T extends { placement?: NavRailPlacement }>(
  items: readonly T[],
): { top: T[], bottom: T[] } => ({
  top: items.filter((item) => (item.placement ?? 'top') === 'top'),
  bottom: items.filter((item) => item.placement === 'bottom'),
})

export type { NavRailPlacement }
export { nextOpenPanel, splitByPlacement }
