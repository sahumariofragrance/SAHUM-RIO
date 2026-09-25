export const SITE_URL = "https://sahumario.com";

function ensureMeta(attribute, value) {
  const selector = `meta[${attribute}="${value}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  return element;
}

function ensureCanonical() {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  return element;
}

function cleanDescription(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function absoluteUrl(path = "/") {
  const value = String(path || "/");
  if (/^https?:\/\//i.test(value)) return value;
  return SITE_URL + (value.startsWith("/") ? value : `/${value}`);
}

export function applySeo({
  title,
  description,
  path = "/",
  image = "/logo512.png",
  imageAlt = "SAHUMäRIO Eau de Parfum",
  type = "website",
  robots = "index, follow",
}) {
  const pageUrl = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const safeDescription = cleanDescription(description);

  document.title = title;

  ensureMeta("name", "description").setAttribute("content", safeDescription);
  ensureMeta("name", "robots").setAttribute("content", robots);
  ensureMeta("name", "googlebot").setAttribute("content", robots);

  ensureCanonical().setAttribute("href", pageUrl);

  ensureMeta("property", "og:type").setAttribute("content", type);
  ensureMeta("property", "og:site_name").setAttribute("content", "SAHUMäRIO®");
  ensureMeta("property", "og:url").setAttribute("content", pageUrl);
  ensureMeta("property", "og:title").setAttribute("content", title);
  ensureMeta("property", "og:description").setAttribute("content", safeDescription);
  ensureMeta("property", "og:image").setAttribute("content", imageUrl);
  ensureMeta("property", "og:image:alt").setAttribute("content", imageAlt);
  ensureMeta("property", "og:locale").setAttribute("content", "en_IN");

  ensureMeta("name", "twitter:card").setAttribute("content", image === "/logo512.png" ? "summary" : "summary_large_image");
  ensureMeta("name", "twitter:title").setAttribute("content", title);
  ensureMeta("name", "twitter:description").setAttribute("content", safeDescription);
  ensureMeta("name", "twitter:image").setAttribute("content", imageUrl);
  ensureMeta("name", "twitter:image:alt").setAttribute("content", imageAlt);
}

export function setJsonLd(id, payload) {
  const scriptId = `seo-jsonld-${id}`;
  let element = document.getElementById(scriptId);

  if (!payload) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("script");
    element.id = scriptId;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(payload);
}

export function removeJsonLd(id) {
  document.getElementById(`seo-jsonld-${id}`)?.remove();
}
