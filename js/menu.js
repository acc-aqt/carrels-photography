document.addEventListener("DOMContentLoaded", () => {
  const mainMenu = document.querySelector("#main-menu");
  const menuIcon = document.querySelector(".menu-nav-icon");
  const portfolioNav = document.querySelector(".portfolio-nav");
  const portfolioToggle = document.querySelector(".portfolio-toggle");
  const placeholder = document.querySelector("#portfolio-menu-placeholder");

  menuIcon?.addEventListener("click", (e) => {
    e.preventDefault();
    mainMenu?.classList.toggle("visible-menu");
  });

  portfolioToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = portfolioNav?.classList.toggle("is-open");

    portfolioToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    portfolioToggle.classList.toggle("menu-open", isOpen);
  });

  document.addEventListener("click", (e) => {
    if (!portfolioNav?.contains(e.target)) {
      portfolioNav?.classList.remove("is-open");
      portfolioToggle?.setAttribute("aria-expanded", "false");
      portfolioToggle?.classList.remove("menu-open");
    }
  });

  if (placeholder) {
    const pathPrefix =
      window.location.pathname === "/" ||
      window.location.pathname.endsWith("/index.html")
        ? ""
        : "../";

    fetch(`${pathPrefix}portfolio-menu.html`, { cache: "no-cache" })
      .then((res) => res.text())
      .then((html) => {
        placeholder.innerHTML = html;
      });
  }


  /* Gallery pages only: auto-hide header on scroll down, reveal on scroll up */
const isGalleryPage = document.querySelector(".p-grid-isotope");

if (isGalleryPage) {
  let lastScrollY = window.scrollY;
  let ticking = false;
  const hideThreshold = 10;
  const showThreshold = 4;
  const topOffset = 10;

  const updateGalleryHeader = () => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;

    /* Always show header near the top */
    if (currentScrollY <= topOffset) {
      document.body.classList.remove("gallery-header-hidden");
    }

    /* Do not hide header while mobile menu is open */
    else if (document.querySelector(".main-menu.visible-menu")) {
      document.body.classList.remove("gallery-header-hidden");
    }

    /* Hide when scrolling down */
    else if (delta > hideThreshold) {
      document.body.classList.add("gallery-header-hidden");
    }

    /* Reveal quickly when scrolling up */
    else if (delta < -showThreshold) {
      document.body.classList.remove("gallery-header-hidden");
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateGalleryHeader);
        ticking = true;
      }
    },
    { passive: true }
  );
}
  
});