import MoneyTreeWorldPreview from './MoneyTreeWorldPreview';

/**
 * Internal-only preview route for the Money Tree world rebuild - not linked
 * from ToolsIndex, not listed in sitemap.ts. Lets each phase be checked
 * visually while the old `moneytree/` folder stays live at its real route
 * for side-by-side comparison. Deleted (along with this whole route) once
 * Phase 6 swaps `MoneyTreeGameWrapper` over to the new World.
 */
export default function MoneyTreeWorldPreviewPage() {
  return <MoneyTreeWorldPreview />;
}
