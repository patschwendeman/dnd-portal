// The panel next to the navigation rail shows at most one menu item. Clicking the open item
// collapses the panel, so the notes get the width; any other item opens (or switches) the panel.
const nextOpenPanel = <T extends string>(open: T | null, clicked: T): T | null => (
  open === clicked ? null : clicked
)

export default nextOpenPanel
