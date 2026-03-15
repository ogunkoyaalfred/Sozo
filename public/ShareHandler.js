// public/share-handler.js
// Service worker intercepts the POST from the bank app's share sheet,
// extracts the image, and passes it to the React app via IndexedDB.

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/share-receipt" && event.request.method === "POST") {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const image    = formData.get("image");

        if (image) {
          // Store the shared file in a cache the React app can read
          const cache = await caches.open("shared-receipt");
          await cache.put(
            "/pending-receipt",
            new Response(image, { headers: { "Content-Type": image.type } })
          );
        }

        // Redirect to dashboard — React will pick up the pending receipt
        return Response.redirect("/?shared=true", 303);
      })()
    );
  }
});