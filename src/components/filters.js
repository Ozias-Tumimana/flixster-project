import { Clapperboard, Heart, Eye } from "lucide-react";

// Shared view-switcher filters, used by both Sidebar (desktop panel) and
// MobileNav (drawer) so the two never drift. "all" is the browse view;
// favorites/watched are focused list views. Keys match App's sidebarFilter.
export const FILTERS = [
  { key: "all", label: "All Movies", Icon: Clapperboard },
  { key: "favorites", label: "Favorites", Icon: Heart },
  { key: "watched", label: "Watched", Icon: Eye },
];
