import { useState, useRef, useEffect } from "react";

const API_URL = "https://receipt-api-3.onrender.com";

export default function ReceiptScanner({ onReceiptParsed }) {
  const [status, setStatus]   = useState("idle");
  const [preview, setPreview] = useState(null);
  const [error, setError]     = useState(null);
  const inputRef              = useRef(null);

  // ── Check for receipt shared from bank app on mount ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("shared") !== "true") return;

    // Clean the URL so refreshing doesn't re-trigger
    window.history.replaceState({}, "", window.location.pathname);

    (async () => {
      try {
        const cache    = await caches.open("shared-receipt");
        const response = await cache.match("/pending-receipt");
        if (!response) return;

        const blob = await response.blob();
        const file = new File([blob], "shared-receipt.jpg", { type: blob.type });

        // Delete from cache so it doesn't re-process on next visit
        await cache.delete("/pending-receipt");

        // Process it exactly like a manual upload
        handleFile(file);
      } catch (err) {
        console.error("Failed to load shared receipt:", err);
      }
    })();
  }, []);

  const handleFile = async (file) => {
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API_URL}/parse-receipt`, {
        method: "POST",
        body: formData,
      });
     

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Server error");
      }

      const data = await res.json();
      setStatus("success");

      if (onReceiptParsed) {
  onReceiptParsed({
    amount:    data.amount,
    date:      data.transaction_date,
    narration: data.narration,
    title:     data.title,     // ✅ add this
    category:  data.category,  // ✅ add this
  });
}
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStatus("idle");
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
          ${status === "uploading" ? "border-blue-400 bg-blue-50" : ""}
          ${status === "success"   ? "border-green-400 bg-green-50" : ""}
          ${status === "error"     ? "border-red-400 bg-red-50" : ""}
          ${status === "idle"      ? "border-gray-300 bg-gray-50 hover:border-cyan-400 hover:bg-cyan-50" : ""}
        `}
      >
        {preview && (
          <img
            src={preview}
            alt="Receipt preview"
            className="mx-auto mb-4 max-h-40 rounded-lg object-contain shadow"
          />
        )}

        {status === "idle" && (
          <>
            <div className="text-4xl mb-2">🧾</div>
            <p className="text-gray-600 font-medium">Upload a receipt</p>
            <p className="text-gray-400 text-sm mt-1 hidden sm:block">
              Click or drag & drop an image
            </p>
            <p className="text-gray-400 text-sm mt-1 sm:hidden">
              Tap to pick from Gallery, WhatsApp, or Files
            </p>
          </>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-600 font-medium">Scanning receipt...</p>
          </div>
        )}

        {status === "success" && (
          <p className="text-green-600 font-medium">✅ Receipt scanned successfully!</p>
        )}

        {status === "error" && (
          <p className="text-red-600 font-medium">❌ {error}</p>
        )}
      </div>

      {status !== "idle" && (
        <button
          onClick={(e) => { e.stopPropagation(); reset(); }}
          className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Scan another receipt
        </button>
      )}
    </div>
  );
}