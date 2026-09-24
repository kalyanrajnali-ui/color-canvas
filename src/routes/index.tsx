import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChromaLab — Color Picker Suite" },
      {
        name: "description",
        content:
          "A precision color instrument: pick colors, generate harmonious palettes, and check WCAG contrast.",
      },
      { property: "og:title", content: "ChromaLab — Color Picker Suite" },
      {
        property: "og:description",
        content:
          "Pick colors, generate palettes, and check WCAG contrast in one dark glass instrument.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// The color picker suite is built as standalone HTML/CSS/JS pages served
// from /color-picker/. The app root forwards visitors there.
function Index() {
  useEffect(() => {
    window.location.replace("/color-picker/index.html");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <a
        href="/color-picker/index.html"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Open ChromaLab
      </a>
    </div>
  );
}
