(() => {
  const api = (window.CLIENT_GALLERY_API || "").replace(/\/$/, "");
  const params = new URLSearchParams(location.search);
  const slugFromUrl = params.get("slug") || "";
  const tokenKey = (slug) => `client-gallery:${slug}`;

  async function login(slug, password) {
    const response = await fetch(`${api}/login/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Could not open this gallery. Check the link and password.");
    sessionStorage.setItem(tokenKey(slug), body.token);
    return body;
  }

  document.querySelectorAll("[data-gallery-login]").forEach((form) => {
    const slugInput = form.elements.slug;
    const passwordInput = form.elements.password;
    if (slugInput && slugFromUrl) slugInput.value = slugFromUrl;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type=submit]");
      const message = form.querySelector("[role=alert]");
      const slug = (slugInput?.value || slugFromUrl).trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)) {
        message.textContent = "Enter a valid gallery link or job name.";
        message.hidden = false;
        return;
      }
      button.disabled = true;
      message.hidden = true;
      try {
        await login(slug, passwordInput.value);
        location.href = `../client-gallery/?slug=${encodeURIComponent(slug)}`;
      } catch (error) {
        message.textContent = error.message;
        message.hidden = false;
      } finally { button.disabled = false; }
    });
  });

  const grid = document.querySelector("#client-gallery-grid");
  if (!grid) return;

  const slug = slugFromUrl.toLowerCase();
  const title = document.querySelector("#client-gallery-title");
  const count = document.querySelector("#client-gallery-count");
  const passwordPanel = document.querySelector("#gallery-password-panel");
  const content = document.querySelector("#gallery-content");
  const lowResDownload = document.querySelector("#download-all-lowres");
  const highResDownload = document.querySelector("#download-all-highres");
  const viewer = document.querySelector("#client-photo-viewer");
  let photos = [];
  let current = 0;

  function addToken(url, token) {
    const target = new URL(url, api);
    target.searchParams.set("token", token);
    return target.href;
  }
  const lazyImageObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const image = entry.target;
          image.addEventListener("load", () => {
            if (window.jQuery?.fn?.isotope) window.jQuery(grid).isotope("layout");
          }, { once: true });
          image.src = image.dataset.src;
          image.removeAttribute("data-src");
          observer.unobserve(image);
        });
      }, { rootMargin: "800px 0px" })
    : null;

  function openPhoto(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    const image = viewer.querySelector("img");
    image.src = photo.url;
    image.alt = photo.name;
    viewer.querySelector(".viewer-count").textContent = `${current + 1} / ${photos.length}`;
    viewer.showModal();
  }
  viewer.querySelector(".viewer-close").addEventListener("click", () => viewer.close());
  viewer.querySelector(".viewer-previous").addEventListener("click", () => openPhoto(current - 1));
  viewer.querySelector(".viewer-next").addEventListener("click", () => openPhoto(current + 1));
  viewer.addEventListener("click", (event) => { if (event.target === viewer) viewer.close(); });
  document.addEventListener("keydown", (event) => {
    if (!viewer.open) return;
    if (event.key === "ArrowLeft") openPhoto(current - 1);
    if (event.key === "ArrowRight") openPhoto(current + 1);
  });

  async function loadGallery(token) {
    const response = await fetch(`${api}/api/gallery/${encodeURIComponent(slug)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(response.status === 401 ? "Your gallery session expired. Enter the password again." : "Could not load this gallery.");
    const data = await response.json();
    title.textContent = data.title;
    photos = data.images.map((photo) => ({ ...photo, url: addToken(photo.url, token) }));
    count.textContent = `${photos.length} photographs`;
    lowResDownload.href = addToken(`${api}/download-all/${encodeURIComponent(slug)}`, token);
    lowResDownload.hidden = photos.length === 0;
    highResDownload.hidden = !data.hasHighResArchive;
    if (data.hasHighResArchive) highResDownload.href = addToken(`${api}/download-highres/${encodeURIComponent(slug)}`, token);
    grid.replaceChildren();
    const sizer = document.createElement("div");
    sizer.className = "grid-sizer";
    grid.append(sizer);
    if (!photos.length) {
      grid.innerHTML = '<p class="client-gallery-empty">This gallery has no photographs yet.</p>';
      return;
    }
    photos.forEach((photo, index) => {
      const item = document.createElement("div");
      item.className = "p-item client-photo-item";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "client-photo-button";
      button.setAttribute("aria-label", `View ${photo.name}`);
      const image = document.createElement("img");
      image.src = "../logos/white_square.png";
      image.dataset.src = photo.url;
      image.className = "lazy";
      image.alt = photo.name;
      image.decoding = "async";
      if (photo.width && photo.height) image.width = photo.width;
      if (photo.width && photo.height) image.height = photo.height;
      button.append(image);
      button.addEventListener("click", () => openPhoto(index));
      item.append(button);
      grid.append(item);
      if (lazyImageObserver) lazyImageObserver.observe(image);
      else image.src = image.dataset.src;
    });
    if (window.jQuery?.fn?.isotope) {
      window.jQuery(grid).isotope({ itemSelector: ".p-item", percentPosition: true, masonry: { columnWidth: ".grid-sizer" } });
      if (window.jQuery.fn.imagesLoaded) window.jQuery(grid).imagesLoaded().progress(() => window.jQuery(grid).isotope("layout"));
    }
    document.body.classList.add("client-gallery-loaded");
  }

  if (!slug || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)) {
    passwordPanel.hidden = false;
    count.textContent = "Enter your gallery link and password.";
    return;
  }
  document.querySelectorAll("[data-gallery-login] [name=slug]").forEach((input) => { input.value = slug; });
  const session = sessionStorage.getItem(tokenKey(slug));
  if (!session) {
    passwordPanel.hidden = false;
    content.hidden = true;
    count.textContent = "Enter the password to open your gallery.";
  } else {
    // Keep the grid visible while adding observed images. IntersectionObserver
    // treats targets in a display:none subtree as intersecting, which would
    // start every full-size image request at once.
    content.hidden = false;
    loadGallery(session).then(() => { passwordPanel.hidden = true; }).catch((error) => {
      sessionStorage.removeItem(tokenKey(slug));
      passwordPanel.hidden = false;
      content.hidden = true;
      const message = passwordPanel.querySelector("[role=alert]");
      message.textContent = error.message;
      message.hidden = false;
    });
  }
})();
