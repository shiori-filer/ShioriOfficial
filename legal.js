// Terms / privacy: builds the route map from the article headings and lights up the
// station for the article being read; the line is filled up to it.
(() => {
  const route = document.querySelector(".route");
  const arts = [...document.querySelectorAll(".articles > li[id]")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => document.body.classList.add("ready"));
  if (!route || !arts.length) return;

  const ol = document.createElement("ol");
  const items = arts.map((a, i) => {
    const li = document.createElement("li");
    const c = getComputedStyle(a).getPropertyValue("--c").trim();
    li.style.setProperty("--c", c || "var(--green)");
    li.style.setProperty("--i", i);
    const link = document.createElement("a");
    link.href = "#" + a.id;
    link.innerHTML = "<i></i>";
    link.append(a.querySelector("h2").textContent);
    li.append(link);
    ol.append(li);
    return li;
  });
  route.append(ol);
  route.hidden = false;

  let last = -1;
  function update() {
    const line = innerHeight * 0.4;
    let here = 0;
    arts.forEach((a, i) => { if (a.getBoundingClientRect().top < line) here = i; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) here = arts.length - 1;
    if (here === last) return;
    last = here;
    items.forEach((li, i) => {
      li.classList.toggle("here", i === here);
      li.classList.toggle("passed", i < here);
    });
    const dot = items[here].querySelector("i");
    const y = dot.offsetTop + items[here].offsetTop + dot.offsetHeight / 2 - 18;
    ol.style.setProperty("--fill", Math.max(0, y) + "px");
    if (reduce) ol.style.transition = "none";
  }
  let queued = false;
  addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  addEventListener("resize", update);
  update();
})();
