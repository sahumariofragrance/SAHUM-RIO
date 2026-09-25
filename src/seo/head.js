/**
 * Client-side <head> management for the single-page app.
 * Keeps title, description, canonical, robots, Open Graph and Twitter tags in
 * sync with the current route. /middleware.js renders the same tags on the
 * server, so the first HTML response is already correct for crawlers.
 */
import { DEFAULT_IMAGE, INDEXABLE_ROBOTS, PRIVATE_ROBOTS, SITE_NAME, absoluteUrl } from "./site";

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function applyPageMeta({ title, description, path = "/", image, type = "website", noindex = false }) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image || DEFAULT_IMAGE);
  const robots = noindex ? PRIVATE_ROBOTS : INDEXABLE_ROBOTS;

  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", robots);
  upsertMeta("name", "googlebot", robots);
  upsertLink("canonical", url);

  upsertMeta("property", "og:type", type);
  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:image", imageUrl);

  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", imageUrl);

  // Square logo dimensions are only valid for the default image.
  if (imageUrl !== DEFAULT_IMAGE) {
    document.head.querySelectorAll('meta[property="og:image:width"], meta[property="og:image:height"]').forEach((el) => el.remove());
  }
}

const PAGE_JSON_LD_ID = "ld-page";

/** Sets (or clears, when `data` is null) the page-specific JSON-LD block. */
export function setPageJsonLd(data) {
  let el = document.getElementById(PAGE_JSON_LD_ID);
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = PAGE_JSON_LD_ID;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}
