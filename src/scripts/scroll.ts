// Optimized scroll navigation script in TypeScript
// Handles nav button activation and smooth scrolling with accessibility & reduced motion support.

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Query buttons inside header navigation
  const navButtons: NodeListOf<HTMLButtonElement> = document.querySelectorAll(
    "header nav a button"
  );
  const sections: NodeListOf<HTMLElement> =
    document.querySelectorAll("main section[id]");

  if (navButtons.length === 0 || sections.length === 0) return;

  const ACTIVE_CLASSES = ["bg-accent", "text-accent-foreground"] as const;
  const INACTIVE_CLASS = "text-muted-foreground";

  let isScrolling = false;
  let currentActiveId: string | null = null;

  const setActiveButton = (id: string) => {
    if (currentActiveId === id) return; // Avoid unnecessary updates
    currentActiveId = id;

    navButtons.forEach((button) => {
      const parent = button.parentElement as HTMLAnchorElement | null;
      if (!parent) return;
      const linkHref = parent.getAttribute("href") || "";

      button.classList.remove(...ACTIVE_CLASSES);
      button.classList.add(INACTIVE_CLASS);

      if (linkHref === `#${id}`) {
        button.classList.remove(INACTIVE_CLASS);
        button.classList.add(...ACTIVE_CLASSES);
      }
    });
  };

  // Find the currently visible section based on scroll position
  const getCurrentSection = (): string | null => {
    const scrollPosition = window.scrollY + window.innerHeight * 0.3;

    // Iterate sections in reverse to find the last one that's above the scroll position
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (section.offsetTop <= scrollPosition) {
        return section.id;
      }
    }

    // Default to first section if at the top
    return sections[0]?.id || null;
  };

  // Handle scroll to update active section
  const handleScroll = () => {
    if (isScrolling) return; // Don't update while programmatic scrolling

    const currentSection = getCurrentSection();
    if (currentSection) {
      setActiveButton(currentSection);
    }
  };

  // Attach click handlers
  navButtons.forEach((button) => {
    const anchor = button.parentElement as HTMLAnchorElement | null;
    if (!anchor) return;

    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = anchor.getAttribute("href");
      if (!targetId) return;
      const targetElement = document.querySelector<HTMLElement>(targetId);
      if (!targetElement) return;

      // Update active button immediately
      const sectionId = targetId.replace("#", "");
      setActiveButton(sectionId);

      // Prevent scroll handler from overriding during smooth scroll
      isScrolling = true;

      // Scroll to element
      targetElement.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      // Update URL hash
      history.pushState(null, "", targetId);

      // Re-enable scroll detection after animation completes
      setTimeout(
        () => {
          isScrolling = false;
        },
        prefersReducedMotion ? 50 : 800
      );

      // Accessibility: focus management
      if (!targetElement.hasAttribute("tabindex")) {
        targetElement.setAttribute("tabindex", "-1");
      }
      targetElement.focus({ preventScroll: true });
    });
  });

  // Listen for scroll events with throttling
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 50);
    },
    { passive: true }
  );

  // Handle initial hash on page load
  const initialHash = window.location.hash;
  if (initialHash) {
    const targetElement = document.querySelector<HTMLElement>(initialHash);
    if (targetElement) {
      // Set active button based on hash
      const sectionId = initialHash.replace("#", "");
      setActiveButton(sectionId);

      // Scroll to the section after a brief delay to ensure DOM is ready
      setTimeout(() => {
        targetElement.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }, 0);
    }
  } else {
    // Initialize based on scroll position if no hash
    handleScroll();
  }
});
