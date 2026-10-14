// js/lazy-grid.js
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector(".p-grid-isotope");
    if (!grid) return; // not a gallery page
  
    const imgs = grid.querySelectorAll("img.lazy[data-src]");
    if (!imgs.length) return;
  
    const rootMargin = "2500px 0px"; // tweak as you like
  
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
  
        const img = e.target;
  
        img.addEventListener(
          "load",
          () => {
            // fade-in hook (optional, if you use CSS .is-loaded)
            img.classList.add("is-loaded");
  
            // relayout isotope after each image
            if (window.jQuery?.fn?.isotope) {
              window.jQuery(grid).isotope("layout");
            }
          },
          { once: true }
        );
  
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        obs.unobserve(img);
      });
    }, { rootMargin });
  
    imgs.forEach((img) => io.observe(img));
  });