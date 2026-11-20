import { categories, profile } from "./content.js";
import { escapeHTML as h, safeUrl } from "./schema.js";
import { COPY, field } from "./i18n.js";

const states = new Map();
let current;
const links = (items = [], locale = "en") =>
  (Array.isArray(items) ? items : [])
    .filter((link) => safeUrl(link.url))
    .map((link) => `<a class="action-link" href="${h(safeUrl(link.url))}" target="_blank" rel="noopener noreferrer">${h(field(link, "label", locale) || COPY[locale].seeLink)} ↗</a>`)
    .join("");
const metrics = (items = [], locale = "en") =>
  Array.isArray(items) && items.length
    ? `<div class="ex-metrics">${items.map((metric) => `<div><strong>${h(metric.value)}</strong><span>${h(field(metric, "label", locale))}</span></div>`).join("")}</div>`
    : "";
const imageUrl = (path) =>
  path?.startsWith("/")
    ? `${import.meta.env?.BASE_URL ?? "/"}${path.slice(1)}`
    : path;
const picture = (item, cls = "", locale = "en") => {
  if (!item.image) return "";
  const alt = field(item, "alt", locale) || field(item, "title", locale);
  const src = imageUrl(item.image);
  return `<button class="evidence ${cls}" data-photo="${h(src)}" data-caption="${h(alt)}" aria-label="${h(COPY[locale].zoom)}: ${h(alt)}"><img src="${h(src)}" alt="${h(alt)}" loading="lazy"/><span class="zoom-hint">${h(COPY[locale].zoom)} ↗</span></button>`;
};
const badge = (item, locale = "en") => {
  if (!item.status) return "";
  const label = COPY[locale][{ live: "statusLive", "in-progress": "statusInProgress", "coming-soon": "statusComingSoon" }[item.status]];
  return `<span class="status-badge is-${h(item.status)}">${h(label)}</span>`;
};
const logoMark = (item, cls = "logo-mark") => {
  if (item.logo) return `<span class="${cls}"><img src="${h(imageUrl(item.logo))}" alt="" loading="lazy"/></span>`;
  const name = field(item, "company", "en") || field(item, "title", "en");
  const initials = name.split(/[\s·]+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return `<span class="${cls} is-initials">${h(initials)}</span>`;
};
export const exhibitMediaGrid = (item, locale = "en") => {
  const media = Array.isArray(item.media) ? item.media : [];
  if (!media.length) return "";
  const demo = (item.links || []).find((link) => safeUrl(link.url));
  const cells = media
    .map((entry, index) => {
      const caption = field(entry, "caption", locale);
      const src = imageUrl(entry.src);
      const size = entry.size ? ` is-${h(entry.size)}` : "";
      const sticker =
        index === 0 && demo
          ? `<a class="try-sticker" href="${h(safeUrl(demo.url))}" target="_blank" rel="noopener noreferrer"><b>${h(COPY[locale].tryLive)}</b><span>↗</span></a>`
          : "";
      if (entry.type === "video") {
        const poster = entry.poster ? ` poster="${h(imageUrl(entry.poster))}"` : "";
        return `<figure class="media-cell is-video${size}"><video src="${h(src)}"${poster} controls playsinline preload="none"></video><figcaption>${h(caption)}</figcaption></figure>`;
      }
      return `<figure class="media-cell is-image${size}">${sticker}<button class="media-zoom" data-photo="${h(src)}" data-caption="${h(caption)}" aria-label="${h(COPY[locale].zoom)}: ${h(caption)}"><img src="${h(src)}" alt="${h(caption)}" loading="lazy"/></button><figcaption>${h(caption)}</figcaption></figure>`;
    })
    .join("");
  return `<section class="media-mosaic${media.length > 4 ? " is-many" : ""}" aria-label="${h(COPY[locale].workSamples)}">${cells}</section>`;
};
const mediaGrid = exhibitMediaGrid;
const crossLink = (item, locale = "en") => {
  const link = item.crossLink;
  if (!link) return "";
  const index = categories.findIndex((category) => category.id === link.module);
  if (index < 0) return "";
  return `<button class="cross-link" data-jump="${index}" data-jump-item="${Number(link.item) || 0}">${h(field(link, "label", locale))} →</button>`;
};
const header = (item, locale = "en", tag = "h3") => {
  const company = field(item, "company", locale) || field(item, "title", locale);
  const industry = field(item, "industry", locale);
  const role = field(item, "role", locale);
  const period = field(item, "period", locale);
  return `<div class="case-id">${logoMark(item)}<div class="case-id-text">${industry ? `<span class="industry-tag">${h(industry)}</span>` : ""}<${tag}>${h(company)}</${tag}>${role ? `<p class="role-line">${h(role)}${period ? ` <span>· ${h(period)}</span>` : ""}</p>` : ""}</div>${badge(item, locale)}</div><p class="case-summary">${h(field(item, "summary", locale))}</p>`;
};
const companySwitch = (items, selected, locale = "en") =>
  `<nav class="co-switch" aria-label="${h(COPY[locale].chooseItem)}" style="--count:${items.length}">${items
    .map((entry, index) => {
      const flag = entry.status && entry.status !== "live" ? `<i class="choice-flag">${h(COPY[locale][entry.status === "coming-soon" ? "statusComingSoon" : "statusInProgress"])}</i>` : "";
      return `<button data-pick="item" data-index="${index}" aria-pressed="${index === selected}">${logoMark(entry, "co-logo")}<span class="co-text"><b>${h(field(entry, "company", locale) || field(entry, "title", locale))}</b><small>${h(field(entry, "group", locale) || field(entry, "industry", locale))}</small></span>${flag}</button>`;
    })
    .join("")}</nav>`;
const depth = (meters, label, body) => (body ? `<section class="dive-layer"><div class="depth-tag"><b>−${meters} m</b><span>${label}</span></div><div class="dive-body">${body}</div></section>` : "");
const voyage = (module, locale = "en") => {
  const stops = module.timeline || [];
  const nodes = stops
    .map(
      (entry, index) =>
        `<li class="voyage-stop ${index % 2 ? "is-right" : "is-left"}"><span class="buoy">${entry.logo ? `<img src="${h(imageUrl(entry.logo))}" alt="" loading="lazy"/>` : `<i>⚓</i>`}</span><article><small>${h(field(entry, "period", locale))}</small><h4>${h(field(entry, "title", locale))}</h4><p>${h(field(entry, "text", locale))}</p>${entry.metric ? `<div class="stop-metric"><strong>${h(entry.metric.value)}</strong><span>${h(field(entry.metric, "label", locale))}</span></div>` : ""}</article></li>`,
    )
    .join("");
  const showcase = module.showcase
    ? `<figure class="voyage-showcase"><button class="media-zoom" data-photo="${h(imageUrl(module.showcase.src))}" data-caption="${h(field(module.showcase, "caption", locale))}"><img src="${h(imageUrl(module.showcase.src))}" alt="${h(field(module.showcase, "caption", locale))}" loading="lazy"/></button><figcaption>${h(field(module.showcase, "caption", locale))}</figcaption></figure>`
    : "";
  return `<ol class="voyage">${nodes}<li class="voyage-port"><span class="port-light"></span><b>${h(COPY[locale].nextPort)}</b></li></ol>${showcase}`;
};
const fold = (title, text) =>
  text
    ? `<details class="field-fold"><summary>${h(title)} <span>＋</span></summary><p>${h(text)}</p></details>`
    : "";

export function mountExhibit(host, id, locale = "en") {
  const module = categories.find((category) => category.id === id);
  if (!module) return;
  current = { host, id, locale };
  const copy = COPY[locale];
  if (!module.items.length) {
    host.innerHTML = `<article class="award-card story-enter"><h3>${h(copy.empty)}</h3></article>`;
    return;
  }
  if (!states.has(id)) states.set(id, { item: 0, chapter: 0 });
  const state = states.get(id);
  const item = module.items[state.item];
  const chapters = item.chapters || [];
  let view = "";

  if (module.kind === "gallery") {
    view = voyage(module, locale);
  } else {
    if (module.items.length > 1) view += companySwitch(module.items, state.item, locale);
    let body = `<div class="case-head">${header(item, locale)}</div>`;
    body += mediaGrid(item, locale);
    const plainLinks = (item.links || []).length && !(item.media || []).length ? `<div class="paper-links">${links(field(item, "links", locale), locale)}</div>` : "";
    body += plainLinks;
    body += depth(10, copy.depthResults, metrics(field(item, "metrics", locale), locale));
    body += depth(
      20,
      copy.depthStory,
      chapters.length
        ? `<div class="gar-row">${chapters.map((chapter) => `<article><span class="tiny-label">${h(field(chapter, "title", locale))}</span><p>${h(field(chapter, "text", locale))}</p></article>`).join("")}</div>`
        : "",
    );
    const note = field(item, "sourceNote", locale);
    body += crossLink(item, locale) + (note ? `<p class="source-note">${h(note)}</p>` : "");
    view += `<article class="case story-enter" data-case="${state.item}">${body}</article>`;
  }

  const contactLinks = links(field(profile, "links", locale), locale);
  host.innerHTML =
    view +
    (contactLinks ? `<div class="conversation-card"><b>${h(locale === "zh" ? `继续了解${profile.nameZh || profile.name}` : `More about ${profile.name}`)}</b><div class="project-contact-links">${contactLinks}</div></div>` : "");
}

document.addEventListener("click", (event) => {
  const fullscreenButton = event.target.closest("[data-embed-fullscreen]");
  if (fullscreenButton) {
    const stage = fullscreenButton.closest("[data-demo-stage]");
    const expanded = stage?.classList.toggle("is-fullscreen");
    fullscreenButton.textContent = COPY[current?.locale || "en"][expanded ? "exitFullscreenDemo" : "fullscreenDemo"];
    fullscreenButton.setAttribute("aria-pressed", String(Boolean(expanded)));
    return;
  }
  const jump = event.target.closest("[data-jump]");
  if (jump) {
    const target = categories[Number(jump.dataset.jump)];
    if (target) {
      states.set(target.id, { item: Number(jump.dataset.jumpItem) || 0, chapter: 0 });
      window.dispatchEvent(new CustomEvent("portfolio:open", { detail: { index: Number(jump.dataset.jump) } }));
    }
    return;
  }
  const button = event.target.closest("[data-pick]");
  if (button && current) {
    const state = states.get(current.id);
    const scope = button.dataset.pick;
    state[scope] = Number(button.dataset.index);
    if (scope === "item") state.chapter = 0;
    const scrollTop = document.getElementById("work").scrollTop;
    mountExhibit(current.host, current.id, current.locale);
    current.host.querySelector(`[data-pick="${scope}"][data-index="${state[scope]}"]`)?.focus({ preventScroll: true });
    document.getElementById("work").scrollTop = scrollTop;
    if (scope === "item") document.querySelector("#work .co-switch")?.scrollIntoView?.({ block: "start", behavior: "smooth" });
  }
  if (event.target.closest("[data-next]") && current) {
    const state = states.get(current.id);
    state.chapter++;
    mountExhibit(current.host, current.id, current.locale);
    current.host.querySelector(`[data-pick="chapter"][data-index="${state.chapter}"]`)?.focus({ preventScroll: true });
  }
  const photo = event.target.closest("[data-photo]");
  if (photo) {
    const dialog = document.getElementById("evidence-dialog");
    dialog.querySelector("img").src = photo.dataset.photo;
    dialog.querySelector("img").alt = photo.dataset.caption;
    dialog.querySelector("p").textContent = photo.dataset.caption;
    dialog.showModal();
  }
});

document.addEventListener(
  "play",
  (event) => {
    if (event.target.tagName !== "VIDEO") return;
    document.querySelectorAll(".media-grid video").forEach((video) => {
      if (video !== event.target) video.pause();
    });
  },
  true,
);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const stage = document.querySelector("[data-demo-stage].is-fullscreen");
  if (!stage) return;
  stage.classList.remove("is-fullscreen");
  const button = stage.querySelector("[data-embed-fullscreen]");
  button.textContent = COPY[current?.locale || "en"].fullscreenDemo;
  button.setAttribute("aria-pressed", "false");
});

const evidence = document.getElementById("evidence-dialog");
document.getElementById("close-evidence").addEventListener("click", () => evidence.close());
evidence.addEventListener("click", (event) => {
  if (event.target === evidence) evidence.close();
});
evidence.addEventListener("keydown", (event) => {
  if (event.key === "Escape") event.stopPropagation();
});
