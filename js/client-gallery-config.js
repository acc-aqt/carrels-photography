// Use the local API when the site is served from localhost; use Render in production.
const galleryApiIsLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
window.CLIENT_GALLERY_API = galleryApiIsLocal
  ? "http://localhost:10000"
  : "https://carrels-client-galleries.onrender.com";
