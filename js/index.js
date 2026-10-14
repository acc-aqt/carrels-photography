document.addEventListener("DOMContentLoaded", () => {
    AOS.init({ duration: 800, easing: "slide", once: true });
  
    const root = document.querySelector(".images-carousel");
    if (!root) return;
  
    const prev = root.querySelector(".swiper-button-prev");
    const next = root.querySelector(".swiper-button-next");
    const pag  = root.querySelector(".swiper-pagination");
  
    let swiper = null;
  
    function initOrDestroy() {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
  
      if (isMobile) {
        if (swiper) { swiper.destroy(true, true); swiper = null; }
        return;
      }
  
      if (!swiper) {
        swiper = new Swiper(root, {
          freeMode: true,
          spaceBetween: 20,
          slidesPerView: 3,
  
          navigation: { prevEl: prev, nextEl: next },
          pagination: { el: pag, clickable: true },
  
          mousewheel: { forceToAxis: true, releaseOnEdges: true },
  
          breakpoints: {
            668:  { slidesPerView: 1 },
            1024: { slidesPerView: 1 },
            1280: { slidesPerView: 2 },
            1600: { slidesPerView: 3 },
          },
        });
      }
    }
  
    initOrDestroy();
    window.addEventListener("resize", initOrDestroy);
  });