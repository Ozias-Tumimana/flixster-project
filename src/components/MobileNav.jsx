import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { FILTERS } from "./filters";
import SortControl from "./SortControl";
import "./MobileNav.css";

// Mobile-only slide-in drawer (Prime-style hamburger menu). Carries the same
// view-switcher nav as the desktop Sidebar plus the Sort control, since both are
// hidden from the header on small screens. Mounted by App alongside MovieModal;
// reuses the modal's a11y pattern (Escape, Tab focus-trap, body scroll-lock,
// click-outside-to-close); App restores focus to the hamburger on close.
const MobileNav = ({
  open,
  onClose,
  sidebarFilter,
  onFilterChange,
  favoritesCount,
  watchedCount,
  sortOption,
  onSortChange,
}) => {
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Active only while open: lock scroll, focus the close button, trap Tab,
  // Escape closes. Cleanup restores scroll. (Hooks run unconditionally; the
  // effect body and the render both gate on `open`.)
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // If the viewport grows to desktop while the drawer is open (e.g. resizing
    // to test responsiveness), close it — otherwise the CSS hides the panel but
    // the body scroll-lock below would leak and freeze the page.
    const desktopMq = window.matchMedia("(min-width: 769px)");
    const onDesktop = (e) => {
      if (e.matches) onClose();
    };
    desktopMq.addEventListener("change", onDesktop);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeBtnRef.current?.focus();

    return () => {
      desktopMq.removeEventListener("change", onDesktop);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const countFor = (key) =>
    key === "favorites" ? favoritesCount : key === "watched" ? watchedCount : null;

  // Selecting a view applies the filter, then closes the drawer.
  const handleSelect = (key) => {
    onFilterChange(key);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="mobilenav-overlay" onClick={handleOverlayClick}>
      <div
        className="mobilenav"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        ref={panelRef}
      >
        <button
          type="button"
          className="mobilenav__close"
          onClick={onClose}
          ref={closeBtnRef}
          aria-label="Close menu"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 className="mobilenav__heading">Browse</h2>
        <nav className="mobilenav__nav">
          {FILTERS.map(({ key, label, Icon }) => {
            const count = countFor(key);
            const active = sidebarFilter === key;
            return (
              <button
                key={key}
                type="button"
                className={`mobilenav__btn${active ? " is-active" : ""}`}
                aria-pressed={active}
                onClick={() => handleSelect(key)}
              >
                <span className="mobilenav__label">
                  <Icon size={18} aria-hidden="true" /> {label}
                </span>
                {count !== null && (
                  <span className="mobilenav__count">{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mobilenav__sort">
          <SortControl
            id="sort-select-mobile"
            sortOption={sortOption}
            onChange={onSortChange}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
