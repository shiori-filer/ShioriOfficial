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
  document.querySelectorAll(".feature video").forEach((v) => io.observe(v));
})();
