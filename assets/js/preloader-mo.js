/* MO Digital Preloader – standalone
   - Auto-loads GSAP if needed
   - Fullscreen background, centered brand
   - M & "Digital" start black, "o" drops in white, then everything turns red
*/
(() => {
  const LOADER_ID = "mo-loader";
  const RED = getCssVar("--mo-red") || "#ff3b3b";

  // Make sure body can't scroll while preloading
  document.documentElement.classList.add("js");
  document.body.classList.add("mo-preloading");

  // Utility: read CSS var
  function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name)?.trim();
  }

  // Load GSAP if not present
  function ensureGsap() {
    if (window.gsap) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
      s.onload = res; s.onerror = () => rej(new Error("GSAP failed to load"));
      document.head.appendChild(s);
    });
  }

  function init() {
    const VW=1200, VH=680, BASELINE=360, GAP_MO=18, GAP_OD=26;

    const M=document.getElementById('moM'),
          O=document.getElementById('moO'),
          D=document.getElementById('moDigital');
    const Ms=document.getElementById('moM_s'),
          Os=document.getElementById('moO_s'),
          Ds=document.getElementById('moDigital_s');

    const brandWrap=document.getElementById('moBrandWrap');
    const faces=document.getElementById('moFaces');
    const extrudeLayer=document.getElementById('moExtrude');

    const gO=document.getElementById('moGO'),
          gM=document.getElementById('moGM'),
          gD=document.getElementById('moGD');

    const preWhite = document.getElementById('moPreWhite');
    const pulseGlow = document.getElementById('moPulseGlow');
    const finalGlow = document.getElementById('moFinalGlow');

    function layoutInline(){
      [M,O,D,Ms,Os,Ds].forEach(el=>el.setAttribute('y', BASELINE));
      const mbox=M.getBBox();
      const oLeft=mbox.x+mbox.width+GAP_MO; [O,Os].forEach(el=>el.setAttribute('x',oLeft));
      const obox=O.getBBox();
      const dLeft=obox.x+obox.width+GAP_OD; [D,Ds].forEach(el=>el.setAttribute('x',dLeft));
    }

    function addExtrudeFor(faceText, depth=14, dx=1.2, dy=1.2){
      const baseX=+faceText.getAttribute('x'), baseY=+faceText.getAttribute('y');
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      for(let i=depth;i>=1;i--){
        const t=document.createElementNS('http://www.w3.org/2000/svg','text');
        t.textContent=faceText.textContent;
        t.setAttribute('x', baseX+dx*i);
        t.setAttribute('y', baseY+dy*i);
        t.setAttribute('font-size', faceText.getAttribute('font-size'));
        t.setAttribute('font-weight', faceText.getAttribute('font-weight'));
        t.setAttribute('font-family', faceText.getAttribute('font-family'));
        t.setAttribute('fill', `rgba(10,15,25,${(0.55-(i/depth)*0.45).toFixed(3)})`);
        g.appendChild(t);
      }
      extrudeLayer.appendChild(g);
    }
    function rebuildExtrude(){
      extrudeLayer.innerHTML='';
      addExtrudeFor(M); addExtrudeFor(O); addExtrudeFor(D);
    }

    // Center & scale for preserveAspectRatio="slice"
    function fitAndCenter(){
      const sView = Math.max(window.innerWidth / VW, window.innerHeight / VH);
      const visW = window.innerWidth  / sView;
      const visH = window.innerHeight / sView;
      const offX = (VW - visW) / 2;
      const offY = (VH - visH) / 2;
      const isPhone = Math.min(window.innerWidth, window.innerHeight) <= 600;

      // Keep desktop look, tame for phones only
      const maxW = visW * 0.92;
      const maxH = visH * (isPhone ? 0.78 : 0.74);

      const bb = faces.getBBox();
      const s  = Math.min(maxW / bb.width, maxH / bb.height);

      const cx = offX + visW/2;
      const cy = offY + visH/2;

      const yNudge = isPhone ? -visH * 0.10 : -visH * 0.20; // slightly above center

      const tx = cx - s * (bb.x + bb.width  / 2);
      const ty = cy - s * (bb.y + bb.height / 2) + yNudge;

      brandWrap.setAttribute('transform', `translate(${tx},${ty}) scale(${s})`);
    }

    function relayoutAll(){
      layoutInline();
      rebuildExtrude();
      fitAndCenter();
    }

    // Initial layout (fonts & resize safe)
    relayoutAll();
    window.addEventListener('resize', relayoutAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayoutAll);

    // ==== Animation (GSAP) ====
    function pulseRect(rect){
      return gsap.timeline()
        .set(rect,{ opacity:0, scaleY:0.85, transformOrigin:"50% 0%" })
        .to(rect,{ opacity:1, scaleY:1.03, duration:0.22, ease:"power2.out" })
        .to(rect,{ scaleY:0.98, duration:0.14, ease:"power1.inOut" })
        .to(rect,{ scaleY:1.05, duration:0.20, ease:"power2.out" })
        .to(rect,{ opacity:0.0, duration:0.55, ease:"power2.in" },"-=0.05");
    }

    // Start states: M & Digital black, O white and falling
    gsap.set(gO,{ transformPerspective:900, rotationX:-55, rotationY:18 });
    gsap.set(O,{ y:-420, fill:"#fff" });
    gsap.set([M,D],{ fill:"#000" });

    const tl = gsap.timeline({ defaults:{ ease:"power3.out" } });

    // pre flash
    tl.set(preWhite,{ opacity:1 }, 0.0);
    tl.to(preWhite,{ opacity:0, duration:0.7, ease:"power2.out" }, 0.0);

    // O drop + settle
    tl.to(O,  { y:0, duration:1.05, ease:"bounce.out" }, 0.0);
    tl.to(gO, { rotationX:0, rotationY:0, duration:0.9, ease:"power3.out" }, "<0.1");
    tl.to(gO, { scaleY:0.96, scaleX:1.03, duration:0.08, yoyo:true, repeat:1, transformOrigin:"50% 60%" }, "<0.85");

    // warm pulse behind
    tl.add(()=>pulseRect(pulseGlow), "-=0.05");

    // All letters → red
    tl.to([M,O,D], { fill:RED, duration:0.35, stagger:0.03, ease:"power2.out" }, "<+0.05");

    // subtle 3D lift/settle
    tl.to([gM,gO,gD], { rotationX:-6, duration:0.18, ease:"power2.out" }, "<");
    tl.to([gM,gO,gD], { rotationX:0,  duration:0.28, ease:"power2.inOut" }, "<+0.18");

    // Optional sweep overlay
    tl.to("#moAllSweep",{ opacity:1, duration:0.25, ease:"power2.out" }, "<");
    gsap.fromTo("#moSweepAll",
      { attr:{ x1:-600, x2:0 } },
      { attr:{ x1:1200, x2:1800 }, duration:2.4, ease:"sine.inOut", repeat:1, yoyo:true }
    );

    // final glow
    tl.add(()=>pulseRect(finalGlow), "<+0.35");

    // When finished, hide the preloader
    tl.eventCallback("onComplete", done);

    // Allow user to skip
    const closeBtn = document.getElementById("mo-close");
    if (closeBtn) closeBtn.addEventListener("click", done, { passive: true });

    function done(){
      const wrap = document.getElementById(LOADER_ID);
      if (!wrap) return;
      wrap.classList.add("is-done");
      document.body.classList.remove("mo-preloading");
      // Optional: remove from DOM after fade
      setTimeout(() => wrap.remove(), 600);
    }
  }

  ensureGsap().then(init).catch(err => {
    console.error(err);
    // If GSAP fails, just remove the preloader
    const wrap = document.getElementById(LOADER_ID);
    if (wrap) { wrap.classList.add("is-done"); setTimeout(() => wrap.remove(), 100); }
    document.body.classList.remove("mo-preloading");
  });
})();
