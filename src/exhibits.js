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
const mediaGrid = (item, locale = "en") => {
  const media = Array.isArray(item.media) ? item.media : [];
  if (!media.length) return "";
  const cells = media
    .map((entry) => {
      const caption = field(entry, "caption", locale);
      const src = imageUrl(entry.src);
      if (entry.type === "video") {
        const poster = entry.poster ? ` poster="${h(imageUrl(entry.poster))}"` : "";
        return `<figure class="media-cell is-video"><video src="${h(src)}"${poster} controls playsinline preload="none"></video><figcaption>${h(caption)}</figcaption></figure>`;
      }
      return `<figure class="media-cell is-image"><button class="media-zoom" data-photo="${h(src)}" data-caption="${h(caption)}" aria-label="${h(COPY[locale].zoom)}: ${h(caption)}"><img src="${h(src)}" alt="${h(caption)}" loading="lazy"/></button><figcaption>${h(caption)}</figcaption></figure>`;
    })
    .join("");
  return `<section class="media-grid" aria-label="${h(COPY[locale].workSamples)}"><h4>${h(COPY[locale].workSamples)}</h4><div>${cells}</div></section>`;
};
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
  const roleLine = [role, period].filter(Boolean).join(" · ");
  return `<div class="case-id">${industry ? `<span class="industry-tag">${h(industry)}</span>` : ""}<${tag}>${h(company)}</${tag}>${roleLine ? `<p class="role-line">${h(roleLine)}</p>` : ""}</div><p class="case-summary">${h(field(item, "summary", locale))}</p>`;
};
const groupedChoices = (items, selected, locale = "en") => {
  const groups = [];
  items.forEach((entry, index) => {
    const label = field(entry, "group", locale);
    let group = groups.find((g) => g.label === label);
    if (!group) groups.push((group = { label, buttons: [] }));
    const flag = entry.status && entry.status !== "live" ? ` <i class="choice-flag">${h(COPY[locale][entry.status === "coming-soon" ? "statusComingSoon" : "statusInProgress"])}</i>` : "";
    group.buttons.push(`<button data-pick="item" data-index="${index}" aria-pressed="${index === selected}">${h(field(entry, "company", locale) || field(entry, "title", locale))}${flag}</button>`);
  });
  return `<div class="choice-groups" aria-label="${h(COPY[locale].chooseItem)}">${groups
    .map((group) => `<div class="choice-group">${group.label ? `<small>${h(group.label)}</small>` : ""}<div class="choice-strip">${group.buttons.join("")}</div></div>`)
    .join("")}</div>`;
};
const fold = (title, text) =>
  text
    ? `<details class="field-fold"><summary>${h(title)} <span>＋</span></summary><p>${h(text)}</p></details>`
    : "";

function choices(items, scope, selected, locale, cls = "choice-strip") {
  const label = scope === "item" ? COPY[locale].chooseItem : COPY[locale].chooseChapter;
  return `<div class="${cls}" aria-label="${h(label)}">${items.map((item, index) => `<button data-pick="${scope}" data-index="${index}" aria-pressed="${index === selected}">${item}</button>`).join("")}</div>`;
}

export function mountExhibit(host, id, locale = "en") {
  const module = categories.find((category) => category.id === id);
  if (!module) return;
  current = { host, id, locale };
  const copy = COPY[locale];
  const name = field(module, "name", locale);
  if (!module.items.length) {
    host.innerHTML = `<article class="award-card story-enter"><h3>${h(copy.empty)}</h3></article>`;
    return;
  }
  if (!states.has(id)) states.set(id, { item: 0, chapter: 0 });
  const state = states.get(id);
  const item = module.items[state.item];
  const chapters = item.chapters || [];
  let view = "";
  const intro = `${metrics(field(module, "metrics", locale), locale)}<div class="account-links">${links(field(module, "links", locale), locale)}</div>`;

  if (module.kind === "gallery") {
    const companies = module.items.map((entry) => field(entry, "company", "en")).filter(Boolean);
    view = `<div class="experience-grid">${module.items
      .map(
        (entry) =>
          `<article class="experience-card story-enter">${header(entry, locale, "h4")}${metrics(field(entry, "metrics", locale), locale)}</article>`,
      )
      .join("")}</div>`;
    const extras = (module.timeline || []).filter((entry) => !companies.some((company) => field(entry, "title", "en").startsWith(company)));
    if (extras.length) {
      view += `<section class="experience-extras"><h4>${h(copy.alsoLabel)}</h4>${extras
        .map((entry) => `<article><small>${h(field(entry, "period", locale))}</small><b>${h(field(entry, "title", locale))}</b><span>${h(field(entry, "text", locale))}</span></article>`)
        .join("")}</section>`;
    }
  } else {
    if (module.items.length > 1) view += groupedChoices(module.items, state.item, locale);
    view += `<div class="project-cover case-header">${badge(item, locale)}${header(item, locale)}${metrics(field(item, "metrics", locale), locale)}</div>`;
    view += mediaGrid(item, locale);
    view += `<div class="paper-links">${links(field(item, "links", locale), locale)}</div>`;
    if (chapters.length) {
      view += `<div class="gar-row story-enter">${chapters
        .map((chapter) => `<article><span class="tiny-label">${h(field(chapter, "title", locale))}</span><p>${h(field(chapter, "text", locale))}</p></article>`)
        .join("")}</div>`;
    }
    view += crossLink(item, locale);
  }

  const reflection = field(item, "reflection", locale);
  const note = field(item, "sourceNote", locale);
  const contactLinks = links(field(profile, "links", locale), locale);
  host.innerHTML =
    intro +
    view +
    (note ? `<p class="source-note">${h(note)}</p>` : "") +
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
