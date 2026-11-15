// The line: each stretch fills with colour up to a point a little below the middle of the
// screen, and the stations it reaches light up. The hero video straightens as it scrolls in.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const segs = [...document.querySelectorAll(".seg")];
  const stations = [...document.querySelectorAll(".nb")];
  const shot = document.querySelector(".stage .win");
  const stage = document.querySelector(".stage");
  const top = document.querySelector(".top");
  const clamp = (v) => Math.max(0, Math.min(1, v));

  function update() {
    const vh = innerHeight;
    const front = vh * 0.62; // where the "train" is
    for (const s of segs) {
      const rr = s.querySelector(".rail").getBoundingClientRect();
      s.style.setProperty("--p", reduce ? 1 : clamp((front - rr.top) / rr.height));
    }
    for (const n of stations) {
      const on = reduce || n.getBoundingClientRect().top + 20 < front;
      n.classList.toggle("on", on);
      if (on) n.closest(".seg").classList.add("seen"); // its screen opens once and stays open
    }
    if (shot && !reduce) {
      const t = clamp((shot.getBoundingClientRect().top - vh * 0.18) / (vh * 0.62));
      shot.style.setProperty("--tilt", t.toFixed(3));
    }
    top.classList.toggle("scrolled", scrollY > 8);
  }

  let queued = false;
  const onScroll = () => {
    document.body.classList.add("scrolling");
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);

  // the green line on the map branches off the page's own line: start it exactly on the rail
  const green = document.getElementById("ln-g");
  function joinRail() {
    if (!stage || !green) return;
    const rail = stage.closest(".seg").querySelector(".rail").getBoundingClientRect();
    const box = stage.getBoundingClientRect();
    const x = (rail.left + rail.width / 2 - box.left) / (box.width / 1600);
    green.setAttribute("d", "M " + x.toFixed(1) + " 560 H 400");
  }
  joinRail();
  addEventListener("resize", joinRail);

  // trains start once the lines are laid, run only while the map is on screen,
  // and stay in the depot for people who asked for less motion
  const map = stage && stage.querySelector(".map");
  if (map && !reduce) {
    const trains = [...map.querySelectorAll("animateMotion")];
    setTimeout(() => {
      // a train is shown only once it is moving (before that it would sit at the map's corner)
      trains.forEach((t, i) => setTimeout(() => { t.beginElement(); t.parentElement.classList.add("go"); }, i * 700));
    }, 2900);
    new IntersectionObserver(([e]) => (e.isIntersecting ? map.unpauseAnimations() : map.pauseAnimations())).observe(stage);
  }

  // first paint: the headline's stations and the first stretch of line come in together
  // (the line starts empty, so its first stretch is drawn rather than already there)
  requestAnimationFrame(() => {
    document.body.classList.add("ready");
    setTimeout(update, reduce ? 0 : 250);
  });

  // feature videos load and play only while they are on screen
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); }
      else v.pause();
    }
  }, { threshold: 0.3 });
  document.querySelectorAll(".feature video, .vs video").forEach((v) => io.observe(v));
})();

// the race against Sakura Editor's Grep: the measured times, played in real time on one
// scale. Shiori's lane is done before Sakura's has started to move.
(() => {
  const race = document.querySelector(".race");
  if (!race) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DATA = { word: [2.25, 0.0063], regex: [1.69, 0.0066], or: [1.96, 0.006] };
  const sak = race.querySelector(".lane.sakura"), shi = race.querySelector(".lane.shiori"), x = race.querySelector(".x");
  const tabs = [...race.querySelectorAll(".race-tabs button")];
  const fmt = (s) => (s >= 1 ? s.toFixed(2) + " 秒" : (s * 1000).toFixed(1) + " ms");
  const set = (lane, f, t) => { lane.querySelector(".track i").style.setProperty("--f", f); lane.querySelector(".t").textContent = t == null ? "—" : fmt(t); };
  let key = "word", raf = 0, timer = 0;
  function run() {
    cancelAnimationFrame(raf); clearTimeout(timer);
    const [ts, tm] = DATA[key];
    race.classList.remove("finished"); shi.classList.remove("done");
    x.textContent = "約 " + Math.round(ts / tm / 10) * 10 + " 倍";
    set(sak, 0, 0); set(shi, 0, null);
    const shiOn = () => { set(shi, Math.max(0.004, tm / ts), tm); shi.classList.add("done"); };
    if (reduce) { set(sak, 1, ts); shiOn(); race.classList.add("finished"); return; }
    const t0 = performance.now();
    timer = setTimeout(shiOn, Math.max(16, tm * 1000));
    const step = (now) => {
      const e = (now - t0) / 1000, f = Math.min(1, e / ts);
      set(sak, f, Math.min(e, ts));
      if (f < 1) raf = requestAnimationFrame(step); else race.classList.add("finished");
    };
    raf = requestAnimationFrame(step);
  }
  tabs.forEach((b) => b.addEventListener("click", () => { key = b.dataset.k; tabs.forEach((t) => t.setAttribute("aria-selected", String(t === b))); run(); }));
  race.querySelector(".again").addEventListener("click", run);
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); run(); } }, { threshold: 0.6 }).observe(race);
  // the ten changes fill in when they come into view
  const ten = document.querySelector(".ten");
  if (ten) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); ten.classList.add("go"); } }, { threshold: 0.5 }).observe(ten);
})();
