"use strict";
(() => {
  const data = window.AIRBOAT_EXPRESSIONS, Eaf = window.AirboatEaf;
  const $ = id => document.getElementById(id);
  const names = {
    neutral:"默认眼神", idle:"待机预览", listening:"聆听合成", thinking:"思考",
    happy:"开心", surprised:"突然发现", shocked:"受惊", question:"好奇歪头",
    look_around:"张望", winking:"眨眼", beat_swing:"摇摆", confused:"晕乎乎",
    relaxed:"放松", sleepy:"困倦", laughing:"大笑", funny:"搞怪",
    loving:"喜欢", embarrassed:"害羞", confident:"得意", delicious:"好吃",
    sad:"难过", crying:"哭泣", silly:"俏皮", angry:"生气",
    insert:"插入动画", look_left:"看左边", look_right:"看右边", eat:"吃东西", tried:"疲惫",
  };
  const lanes = [
    ["quiet","首页 / 手控","默认与准备","待机、连接中或手动控制沿用默认眼神。离开首页时停止绘制。",["neutral"],"0 / 70 / 90"],
    ["listen","开始说话","开始聆听","设备把独立聆听条叠在默认眼神上。菜单的聆听也走这条播放链。",["listening"],"70"],
    ["think","等小智回答","等待出声","收到回复后，第一段声音实际播放之前继续显示思考。",["thinking"],"70"],
    ["reply","小智开始出声","对话情绪","使用小智给出的目录内情绪；空值或目录外的词回默认眼神。列表表示可接收的语义。",Object.keys(data.original),"70"],
    ["touch","触摸回应 / 语音唤醒","轻触回应","触摸反馈或伙伴进入唤醒回应时用开心。交谈中轻触也能取消交谈。",["happy"],"40"],
    ["presence","人从空场入镜","发现了","从空场重新检测到人物时，短暂显示突然发现（约 2.2 秒）。",["surprised"],"40"],
    ["comfort","明显晃动 / 安抚","晃动安抚","在泊位状态，晃动显示晕乎乎，安抚后转为放松。",["confused","relaxed"],"40"],
    ["posture","主机轻倾","姿态回应","触发姿态提示或好奇状态时显示疑问眼神。",["question"],"30"],
    ["idle","安静、空场","自己玩","条件满足后从三种闲玩语义中选择。",["look_around","winking","beat_swing"],"10"],
    ["safety","安全限制 / 受惊","安全回应","急停、姿态数据过期、限制状态或受惊可使用受惊语义。",["shocked"],"100"],
    ["preview","表情菜单","本机预览","选择后回首页预览，轻触按当前状态取消。菜单里的「惊喜」用受惊语义。",["idle","happy","shocked","listening","sleepy","thinking"],"50"],
    ["walk","伙伴进入 walking","散步回应","walking 状态用放松语义，该状态的身体候选独立编排。",["relaxed"],"20"],
  ];
  const typeLabel = {trigger:"触发场景",recipe:"回应编排",semantic:"表情语义",asset:"动画素材"};
  const columns = [["trigger","场景触发","◈",16,175],["recipe","回应编排","◇",245,168],
    ["semantic","表情语义","✦",474,178],["asset","素材文件","◫",714,207]];
  const menu = ["neutral","listening","thinking","happy","surprised","shocked","confused","relaxed","question",
    "look_around","winking","beat_swing","idle","sleepy",...Object.keys(data.original).filter(k =>
      !["neutral","thinking","happy","surprised","shocked","confused","relaxed","question","look_around","winking","beat_swing","idle","sleepy"].includes(k))];
  const assetKeys = Object.keys(data.assets);
  const storageKey = "airboat-expression-workbench-draft-v1";
  let storage = true, plan = [];
  try { plan = JSON.parse(localStorage.getItem(storageKey) || "[]"); if (!Array.isArray(plan)) plan = []; }
  catch { storage = false; }
  let version = "optimized", selected = "semantic:happy", nodes = new Map(), edges = [];
  let scale = 1, x = 0, y = 0, initialized = false, slideTimer;
  let active, elapsed = 0, lastTick = null, stamp = "", fault = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let playing = !reduced;
  const canvas = $("face"), ctx = canvas.getContext("2d"), viewport = $("viewport");
  const decoders = new Map();
  const visibleThumbs = new Set();
  let thumbTick = 0;
  const thumbnails = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) { visibleThumbs.delete(entry.target); continue; }
      if (!entry.target.querySelector("canvas")) {
        const mini = el("canvas","node-thumb");
        mini.width = 40; mini.height = 40; mini.setAttribute("aria-hidden","true");
        entry.target.querySelector(".node-icon").replaceWith(mini);
      }
      visibleThumbs.add(entry.target);
    }
  }, {root:viewport,threshold:.1});
  const format = value => Number(value).toLocaleString("en-US");
  const size = value => (value / 1024).toFixed(1) + " KiB";
  const el = (tag, cls, txt) => {
    const out = document.createElement(tag);
    if (cls) out.className = cls;
    if (txt !== undefined) out.textContent = txt;
    return out;
  };
  const id = (type, key) => type + ":" + key;
  const catalog = () => data[version];
  const safeSaved = row => row && data.candidates[row.candidate] &&
    Array.isArray(row.targets) && row.targets.every(k => menu.includes(k));
  plan = plan.filter(safeSaved);
  function profile(key) {
    if (catalog()[key]?.segments) return {...catalog()[key],previewMode:$("complete-mode").value};
    return key === "listening" ? {...catalog().neutral, overlay:"listen.eaf"} : catalog()[key];
  }
  function references(file, source = catalog()) {
    if (file === "listen.eaf") return ["listening"];
    return Object.entries(source).filter(([, row]) => row.file === file).map(([key]) => key);
  }
  function addEdge(a, b) {
    const from = nodes.get(a), to = nodes.get(b);
    const x0 = from.x + from.w, x1 = to.x, y0 = from.y + 26, y1 = to.y + 26, mid = (x0 + x1) / 2;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class","edge "+to.type+"-color");
    path.setAttribute("d",`M ${x0} ${y0} C ${mid} ${y0} ${mid} ${y1} ${x1} ${y1}`);
    $("edges").append(path); edges.push({a,b,path});
  }
  function buildGraph() {
    const displayMenu = menu;
    nodes = new Map(); edges = [];
    thumbnails.disconnect(); visibleThumbs.clear();
    $("nodes").replaceChildren(); $("edges").replaceChildren();
    const assets = [...new Set(displayMenu.flatMap(k => [profile(k).file, profile(k).overlay].filter(Boolean))),
      ...assetKeys.filter(file => data.assets[file].kind === "assets" && !displayMenu.some(k =>
        profile(k).file === file || profile(k).overlay === file))];
    const lists = [
      lanes.map(([k,label,,detail,,p]) => [k,label,p ? `优先级 ${p}` : "人物检测",detail]),
      lanes.map(([k,,label,detail,outputs]) => [k,label,`${outputs.length} 项输出`,detail]),
      displayMenu.map(k => [k,names[k],profile(k).overlay ? "neutral + listen" : k,""]),
      assets.map(file => {
        const a = data.assets[file], linked = references(file);
        return [file,file,`${a.width} × ${a.height} · ${a.frames} 帧`,linked.length ? "" : "此版本无直接绑定。"];
      }),
    ];
    columns.forEach(([type, title, icon, cx, w], col) => {
      const items = lists[col], tag = el("div","column-tag "+type+"-color");
      Object.assign(tag.style,{left:`${cx}px`,width:`${w}px`});
      tag.append(el("span",null,title),el("b",null,String(items.length).padStart(2,"0")));
      $("nodes").append(tag);
      items.forEach(([key,title,sub,detail],i) => {
        const keyId = id(type,key), top = 42 + 66 * i, button = el("button","node "+type+"-color");
        button.dataset.node = keyId;
        button.setAttribute("aria-label",`${typeLabel[type]}：${title} ${sub}`);
        Object.assign(button.style,{left:`${cx}px`,top:`${top}px`,width:`${w}px`});
        const copy = el("span");
        copy.append(el("strong",null,title),el("small",null,sub));
        button.append(el("span","node-icon",icon),copy);
        button.addEventListener("click",() => select(keyId));
        $("nodes").append(button);
        nodes.set(keyId,{type,key,title,sub,detail,x:cx,y:top,w,button});
      });
    });
    for (const [key,,,,outputs] of lanes) {
      addEdge(id("trigger",key),id("recipe",key));
      for (const semantic of outputs) addEdge(id("recipe",key),id("semantic",semantic));
    }
    for (const key of displayMenu) {
      addEdge(id("semantic",key),id("asset",profile(key).file));
      if (profile(key).overlay) addEdge(id("semantic",key),id("asset","listen.eaf"));
    }
    for (const node of nodes.values()) if (node.type === "asset") thumbnails.observe(node.button);
  }
  function highlight() {
    const seen = new Set([selected]), hot = new Set();
    // Follow each direction separately so that shared files do not pull in unrelated branches.
    for (const [from,to] of [["a","b"],["b","a"]]) {
      const visited = new Set([selected]), queue = [selected];
      while (queue.length) {
        const here = queue.pop();
        for (const edge of edges) if (edge[from] === here) {
          hot.add(edge); seen.add(edge[to]);
          if (!visited.has(edge[to])) { visited.add(edge[to]); queue.push(edge[to]); }
        }
      }
    }
    for (const [key,node] of nodes) {
      node.button.classList.toggle("selected",key === selected);
      node.button.classList.toggle("near",key !== selected && seen.has(key));
      node.button.classList.toggle("dim",!seen.has(key));
      node.button.setAttribute("aria-pressed",String(key === selected));
    }
    for (const edge of edges) {
      edge.path.classList.toggle("hot",hot.has(edge)); edge.path.classList.toggle("dim",!hot.has(edge));
    }
  }
  function jumpRow(keys) {
    const row = el("div","links");
    for (const key of [...new Set(keys)]) {
      const node = nodes.get(key);
      if (!node) continue;
      const button = el("button",node.type+"-color",node.title);
      button.addEventListener("click",() => { select(key); focusSelected(); });
      row.append(button);
    }
    return row;
  }
  function select(key) {
    if (!nodes.has(key)) return;
    selected = key;
    const node = nodes.get(selected), title = $("node-detail"), meta = $("metadata");
    title.replaceChildren(el("div","eyebrow "+node.type+"-color",typeLabel[node.type]+" / "+version.toUpperCase()),
      el("h1",null,node.title + (node.type === "semantic" && node.key !== "listening" ? " · " + node.key : "")));
    if (node.detail) title.append(el("p",null,node.detail));
    const incoming = edges.filter(e => e.b === key).map(e => e.a);
    const outgoing = edges.filter(e => e.a === key).map(e => e.b);
    meta.replaceChildren();
    $("replace").hidden = node.type !== "semantic";
    if (node.type === "semantic") {
      const p = profile(node.key);
      const refs = references(p.file).filter(k => k !== node.key);
      title.append(el("p",null,p.overlay ? "独立节拍叠在 neutral 上" :
        refs.length ? "与 "+refs.length+" 个语义共用底层素材" : "当前版本独立素材"));
      setPlayer(p);
      meta.append(facts(p),jumpRow(outgoing),el("p","micro","触发与编排"),jumpRow(incoming));
      const recipe = data.recipes[node.key];
      const cue = {tail_wag:"摇尾",look:"张望",sway:"摇摆",settle:"安定"};
      if (recipe) meta.append(el("p","micro",`小智回复时的身体候选：${cue[recipe.gesture]} · ${recipe.clip}。执行由运动控制单独判断。`));
      const entry = plan.find(row => row.targets.includes(node.key));
      $("candidate").value = entry?.candidate || "";
      $("scope").value = entry?.scope || "one";
      $("note").value = entry?.note || "";
      $("save-status").textContent = "";
      updateCandidate();
    } else if (node.type === "asset") {
      const refs = references(node.key);
      const p = node.key === "listen.eaf" ? {file:node.key,fps:15,loop:true} :
        (refs.length ? profile(refs[0]) : Object.values(data.original).find(p => p.file === node.key));
      setPlayer(p);
      meta.append(facts(p),el("p","micro",refs.length ? "使用该素材的语义" : "原版使用这个素材的语义"),
        jumpRow((refs.length ? refs : references(node.key,data.original)).map(k => id("semantic",k))));
    } else {
      const lane = lanes.find(row => row[0] === node.key);
      setPlayer(profile(lane[4][0]));
      meta.append(el("p","micro","当前预览："+names[lane[4][0]]),jumpRow(lane[4].map(k => id("semantic",k))));
      if (node.type === "trigger") meta.append(jumpRow(outgoing));
      else meta.append(jumpRow(incoming));
    }
    document.dispatchEvent(new CustomEvent("airboat:expression-select",{detail:{semantic:active.semantic || (node.type === "semantic" ? node.key : references(active.file)[0]) || "neutral"}}));
    highlight();
  }
  function facts(p) {
    const a = data.assets[p.file], box = el("div","facts");
    const layout = p.fill ? "整屏铺满" : a.width < 200 && a.height > 60 ? "设备双眼镜像" : "居中单图";
    const loop = p.loop ? p.range ? `循环 [${p.range.join(", ")})` : "整段循环" : "播一遍 · 保持最后帧";
    for (const label of [p.file,`${a.width}×${a.height}`,`${a.frames} 帧 · ${p.fps} fps`,size(a.bytes),layout,loop])
      box.append(el("span",null,label));
    if (a.kind === "optimized" || a.kind === "contour" || a.kind === "square") {
      box.append(el("span",null,"图层按需镜像 · 16 级边缘覆盖"),
        el("span",null,`本片段引用精灵 ${size(a.bytes)} · 可跨表情共享`),
        el("span",null,`整库含目录 ${size((a.kind === "square" ? AirboatSquare : a.kind === "contour" ? AirboatContour : AirboatOptimized).statistics.totalBytes)} · 预览候选`));
    }
    if (p.beats?.length) box.append(el("span",null,"动作节拍："+p.beats.map(([ms,label]) => `${label} ${(ms/1000).toFixed(2)}s`).join(" → ")));
    if (p.segments) for (const [part,range] of Object.entries(p.segments))
      box.append(el("span",null,`${{entry:"进入",performance:"表演",exit:"收尾"}[part]} ${(range[1]-range[0])/p.fps} s · [${range.join(", ")})`));
    if (p.overlay) {
      const overlay = data.assets[p.overlay];
      box.append(el("span",null,`${p.overlay} · ${overlay.width}×${overlay.height} · ${overlay.frames} 帧 · 15 fps · ${size(overlay.bytes)}`));
    }
    return box;
  }
  function decoder(file) {
    if (!decoders.has(file)) decoders.set(file,new Eaf(data.assets[file]));
    return decoders.get(file);
  }
  function renderFrame() {
    if (!active || fault) return;
    const base = data.assets[active.file];
    const state = Eaf.previewAt(active,base,elapsed,active.previewMode);
    const frame = state.frame;
    const phases = {entry:"进入",performance:"完整表演",exit:"收尾",done:"整段播完 · 回到绿色",held:"单次播完 · 保持末帧","entry-held":"进入段结束"};
    $("expression-phase-label").textContent = phases[state.phase] + (active.segments ? ` · 第 ${frame+1}/${base.frames} 帧` : "");
    document.querySelectorAll("[data-clip-stage]").forEach(b => b.classList.toggle("active",b.dataset.clipStage === state.phase));
    const overlayCount = active.overlay ? data.assets[active.overlay].frames : 0;
    const layer = overlayCount ? Math.floor(elapsed*15/1000)%overlayCount : -1;
    const mirror = $("mirror").value, next = `${frame}/${layer}/${mirror}`;
    if (stamp === next) return;
    stamp = next;
    Eaf.draw(ctx,decoder(active.file).frame(frame),active,mirror);
    if (layer >= 0) {
      const overlay = decoder(active.overlay).frame(layer), s = canvas.width/360;
      ctx.drawImage(overlay,130*s,25*s,overlay.width*s,overlay.height*s);
    }
    $("frames").value = overlayCount && !active.loop ? layer : frame;
    $("frame-number").value = `${Number($("frames").value)+1}/${Number($("frames").max)+1}`;
  }
  function syncPlay() {
    const button = $("play");
    button.setAttribute("aria-label",playing ? "暂停" : "播放");
    button.querySelector("path").setAttribute("d",playing ? "M9 5v14m6-14v14" : "m9 5 11 7-11 7z");
  }
  function setPlayer(p) {
    active = p; elapsed = 0; stamp = ""; fault = false;
    $("complete-controls").hidden = !p.segments;
    playing = !reduced;
    $("frames").max = (p.overlay && !p.loop ? data.assets[p.overlay] : data.assets[p.file]).frames-1;
    syncPlay(); renderFrame();
  }
  document.addEventListener("airboat:preview-compare",e => { if (e.detail.open) { playing = false; syncPlay(); } });
  function tick(time) {
    if (!document.hidden && time - thumbTick > 120) {
      thumbTick = time;
      for (const button of visibleThumbs) {
        const file = nodes.get(button.dataset.node).key, a = data.assets[file];
        const p = file === "listen.eaf" ? {file,fps:15,loop:true} :
          Object.values(catalog()).find(p => p.file === file) ||
          Object.values(data.original).find(p => p.file === file);
        const f = reduced ? 0 : Eaf.frameAt(p.segments ? {...p,previewMode:"loop"} : p,a,time);
        if (button.dataset.frame === String(f)) continue;
        button.dataset.frame = String(f);
        try { Eaf.draw(button.querySelector("canvas").getContext("2d"),decoder(file).frame(f),p); }
        catch (error) { visibleThumbs.delete(button); console.error(error); }
      }
    }
    if (playing && !document.hidden && active) {
      if (lastTick !== null) elapsed += Math.min(100,time-lastTick);
      try { renderFrame(); }
      catch (error) { fault = true; playing = false; syncPlay(); console.error(error); }
      if (Eaf.previewAt(active,data.assets[active.file],elapsed,active.previewMode).finished) {
        playing = false; syncPlay();
      }
    }
    lastTick = time; requestAnimationFrame(tick);
  }

  function apply(animated = false) {
    clearTimeout(slideTimer);
    $("world").classList.toggle("sliding",animated);
    $("world").style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    $("zoom-value").value = `${Math.round(scale*100)}%`;
    if (animated) slideTimer = setTimeout(() => $("world").classList.remove("sliding"),340);
  }
  function zoom(mult,px = viewport.clientWidth/2,py = viewport.clientHeight/2) {
    const next = Math.max(.14,Math.min(2.2,scale*mult));
    x = px - (px-x)*next/scale; y = py - (py-y)*next/scale; scale = next; apply();
  }
  function initialView() {
    const w = viewport.clientWidth;
    if(document.body.classList.contains("face-above-board")){scale=Math.max(.3,Math.min(1,(w-32)/938));x=16;y=18;apply();return;}
    scale = Math.min(1,Math.max(.67,(w-36)/938));
    x = w < 600 ? 14-245*scale : Math.max(16,(w-938*scale)/2);
    y = 22; apply();
  }
  function focusSelected() {
    const n = nodes.get(selected);
    scale = Math.max(scale,.72);
    x = viewport.clientWidth/2-(n.x+n.w/2)*scale;
    y = Math.min(36,viewport.clientHeight*.38-(n.y+26)*scale); apply(true);
  }
  function fit() {
    const h = Math.max(...[...nodes.values()].map(n => n.y+52));
    scale = Math.max(.14,Math.min(1,(viewport.clientWidth-32)/936,(viewport.clientHeight-24)/h));
    x = (viewport.clientWidth-936*scale)/2; y = 12; apply(true);
  }
  let drag = null;
  viewport.addEventListener("pointerdown",e => {
    if (e.button !== 0 || e.target.closest("button")) return;
    drag = {id:e.pointerId,x:e.clientX-x,y:e.clientY-y};
    viewport.setPointerCapture(e.pointerId); viewport.classList.add("drag");
  });
  viewport.addEventListener("pointermove",e => {
    if (drag?.id !== e.pointerId) return;
    x = e.clientX-drag.x; y = e.clientY-drag.y; apply();
  });
  for (const event of ["pointerup","pointercancel","lostpointercapture"]) viewport.addEventListener(event,e => {
    if (drag?.id === e.pointerId) { drag = null; viewport.classList.remove("drag"); }
  });
  viewport.addEventListener("wheel",e => {
    if (e.ctrlKey || e.metaKey || !e.deltaX && Math.abs(e.deltaY) >= 40) {
      const rect = viewport.getBoundingClientRect();
      zoom(Math.exp(-e.deltaY*(e.deltaMode === 1 ? .08 : .0018)),e.clientX-rect.left,e.clientY-rect.top);
    } else { x -= e.deltaX; y -= e.deltaY*(e.deltaMode === 1 ? 22 : 1); apply(); }
    e.preventDefault();
  },{passive:false});
  viewport.addEventListener("keydown",e => {
    if (e.target !== viewport) return;
    if (e.key === "+" || e.key === "=") zoom(1.2);
    else if (e.key === "-") zoom(1/1.2);
    else if (e.key.startsWith("Arrow")) {
      x += e.key === "ArrowLeft" ? 60 : e.key === "ArrowRight" ? -60 : 0;
      y += e.key === "ArrowUp" ? 60 : e.key === "ArrowDown" ? -60 : 0; apply();
    } else return;
    e.preventDefault();
  });
  $("zoom-in").onclick = () => zoom(1.2); $("zoom-out").onclick = () => zoom(1/1.2);
  $("fit").onclick = fit; $("focus-node").onclick = focusSelected;
  $("mirror").onchange = renderFrame;
  $("guides").onchange = e => { $("screen-guides").hidden = !e.target.checked; };
  $("play").onclick = () => {
    if (!playing && Eaf.previewAt(active,data.assets[active.file],elapsed,active.previewMode).finished)
      elapsed = 0;
    playing = !playing; syncPlay();
  };
  $("replay").onclick = () => { elapsed = 0; playing = true; syncPlay(); renderFrame(); };
  $("complete-mode").onchange = () => { setPlayer({...active,previewMode:$("complete-mode").value}); playing = true; syncPlay(); };
  document.querySelectorAll("[data-clip-stage]").forEach(b => b.onclick = () => {
    if (!active.segments) return;
    active = {...active,previewMode:"complete"}; $("complete-mode").value = "complete";
    elapsed = active.segments[b.dataset.clipStage][0]*1000/active.fps;
    playing = true; syncPlay(); stamp = ""; renderFrame();
  });
  $("frames").oninput = e => {
    if (active.segments) { active = {...active,previewMode:"complete"}; $("complete-mode").value = "complete"; }
    playing = false; syncPlay();
    elapsed = (Number(e.target.value)+.0001)*1000/(active.overlay && !active.loop ? 15 : active.fps);
    renderFrame();
  };
  $("versions").addEventListener("click",e => {
    const next = e.target.closest("button")?.dataset.version;
    if (!next || next === version) return;
    version = next;
    for (const b of $("versions").querySelectorAll("button")) b.setAttribute("aria-pressed",String(b.dataset.version === version));
    buildGraph(); select(nodes.has(selected) ? selected : "semantic:neutral");
    search();
  });

  function toggleSearch(show) {
    $("search-results").hidden = !show;
    $("search").setAttribute("aria-expanded",String(show));
  }
  function search() {
    const q = $("search").value.trim().toLowerCase(), list = $("search-results");
    list.replaceChildren();
    if (!q) { toggleSearch(false); return; }
    const found = [...nodes].filter(([,n]) => [n.key,n.title,n.sub].some(t => t.toLowerCase().includes(q)));
    if (!found.length) list.append(el("p","micro","没有匹配的节点"));
    for (const [key,node] of found) {
      const button = el("button"); button.append(el("span",null,node.title),el("small",null,typeLabel[node.type]));
      button.onclick = () => { select(key); focusSelected(); toggleSearch(false); };
      list.append(button);
    }
    toggleSearch(true);
  }
  $("search").oninput = search; $("search").onfocus = search;
  $("search").onkeydown = e => {
    if (e.key === "Escape") toggleSearch(false);
    const first = $("search-results").querySelector("button");
    if (first && !$("search-results").hidden && e.key === "Enter") first.click();
    if (first && !$("search-results").hidden && e.key === "ArrowDown") { e.preventDefault(); first.focus(); }
  };
  document.addEventListener("pointerdown",e => { if (!e.target.closest(".search-wrap")) toggleSearch(false); });

  function targetSemantics() {
    const key = nodes.get(selected).key;
    if ($("scope").value === "one" || key === "listening") return [key];
    return references(profile(key).file);
  }
  function budgetHint(row, targets) {
    if (!row) return "";
    if (targets.includes("listening")) return "聆听条需要单独转成叠层素材。尺寸、体积和布局待转换后核对。";
    const raws = Object.entries(data.current);
    const replaced = new Set(targets);
    const anyCurrent = new Set(raws.map(([,p]) => p.file));
    const remaining = new Set(raws.filter(([key]) => !replaced.has(key)).map(([,p]) => p.file));
    const release = [...anyCurrent].filter(file => !remaining.has(file)).reduce((n,file) => n+data.assets[file].bytes,0);
    const currentTrial = Object.values(data.current).find(p => p.fill &&
      p.file === `trial-${row.name}.eaf`);
    if (!currentTrial) return `480 px EAF 为 ${size(row.eaf_bytes)}；转成兼容版后再计入应用预算。按这组目标最多释放 ${size(release)}。`;
    const added = remaining.has(currentTrial.file) ? 0 : data.assets[currentTrial.file].bytes;
    const left = data.budget.main_app_remaining + release - added;
    return `仅按这次替换与现用兼容 EAF 估算：应用${left < 0 ? "超出" : "剩余"} ${size(Math.abs(left))}，以编译为准。`;
  }
  function updateCandidate() {
    const key = nodes.get(selected).key;
    const candidate = data.candidates[$("candidate").value];
    $("scope").disabled = key === "listening" || references(profile(key).file).length < 2;
    if ($("scope").disabled) $("scope").value = "one";
    const targets = targetSemantics();
    $("scope-info").textContent = targets.map(k => names[k]+" ("+k+")").join("、");
    $("save-plan").disabled = !candidate;
    $("comparison").hidden = !candidate;
    const gif = $("candidate-gif");
    if (!candidate) { gif.removeAttribute("src"); return; }
    if (gif.dataset.file !== candidate.gif || !gif.hasAttribute("src")) {
      gif.dataset.file = candidate.gif; gif.src = candidate.gif; gif.alt = candidate.label+"动效原稿";
    }
    $("candidate-meta").replaceChildren(el("strong",null,`${candidate.label} · ${candidate.width}×${candidate.height}`),
      el("p",null,`${candidate.frames} 帧 · ${candidate.fps} fps · 循环 [${candidate.loop_start}, ${candidate.loop_end})`),
      el("p",null,budgetHint(candidate,targets)));
  }
  const candidateSelect = $("candidate");
  candidateSelect.append(new Option("选择一个动效",""));
  for (const [key,row] of Object.entries(data.candidates)) candidateSelect.append(new Option(row.label+" · "+key,key));
  candidateSelect.onchange = updateCandidate; $("scope").onchange = updateCandidate;
  function persist() {
    if (storage) {
      try { localStorage.setItem(storageKey,JSON.stringify(plan)); } catch { storage = false; }
    }
    $("plan-count").textContent = String(plan.reduce((n,row) => n+row.targets.length,0));
    $("storage-state").textContent = storage ? "草案已保存到此浏览器" : "草案保留到关页前，请导出";
    $("export").disabled = !plan.length;
  }
  $("save-plan").onclick = () => {
    const candidate = candidateSelect.value, targets = targetSemantics();
    if (!data.candidates[candidate]) return;
    plan = plan.map(row => ({...row,targets:row.targets.filter(k => !targets.includes(k))})).filter(r => r.targets.length);
    plan.push({
      candidate, targets, scope:$("scope").value, map_version:version, note:$("note").value.trim(),
      preview_mirror:$("mirror").value,
      source_file:data.candidates[candidate].source_file, source_sha256:data.candidates[candidate].source_sha256,
      previous_current_files:Object.fromEntries(targets.map(k => [k,k === "listening" ? "listen.eaf" : data.current[k].file])),
    });
    persist(); $("save-status").textContent = `已记录 ${targets.length} 个语义`;
  };
  function showPlan() {
    const list = $("plan-list"); list.replaceChildren();
    if (!plan.length) list.append(el("p","micro","还没有指定替换。"));
    for (const [index,row] of plan.entries()) {
      const line = el("div","plan-row"), text = el("div"), remove = el("button",null,"移除");
      text.append(el("strong",null,`${row.targets.map(k => names[k]).join("、")} → ${data.candidates[row.candidate].label}`),
        el("p","micro",`${row.targets.join(" · ")}${row.note ? " / "+row.note : ""}`));
      remove.onclick = () => { plan.splice(index,1); persist(); showPlan(); };
      line.append(text,remove); list.append(line);
    }
  }
  $("export").onclick = () => {
    const payload = {schema:"airboat.expression-replacement.v1",status:"draft", firmware_baseline:data.version,
      source_pack:"mosaico-eaf-480", mappings:plan};
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+"\n"],{type:"application/json"}));
    const link = el("a"); link.href = url; link.download = "airboat-expression-replacements.json";
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),3000);
  };
  for (const name of ["rules","plan"]) {
    $(name+"-open").onclick = () => { if (name === "plan") showPlan(); $(name).showModal(); };
    document.querySelector(`[data-close="${name}"]`).onclick = () => $(name).close();
    $(name).addEventListener("click",e => { if (e.target === $(name)) {
      const r = $(name).getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $(name).close();
    } });
  }
  for (const [prefix,label,cls] of [["main_app","应用分区 · 表情在这里","semantic-color"],
    ["ui_apps","外置 UI 分区","recipe-color"]]) {
    const used = data.budget[prefix+"_bytes"], free = data.budget[prefix+"_remaining"], capacity = used+free;
    const box = el("div","budget "+cls), bar = el("div","meter"), fill = el("span");
    fill.style.width = `${100*used/capacity}%`; bar.append(fill);
    box.append(el("div",null,label),el("strong",null,size(free)+" 可用"),bar,
      el("div","micro",`${format(used)} / ${format(capacity)} B · ${data.version}`));
    $("budgets").append(box);
  }
  const p = data.priorities;
  $("priority-text").textContent = `数字越大越优先：离开首页 ${p.hidden}、安全限制 ${p.safety}、手控 ${p.user}、对话 ${p.dialogue}、预览 ${p.preview}、触摸/安抚 ${p.touch}、姿态 ${p.posture}、散步 ${p.walking}、闲玩 ${p.idle}、待机 ${p.quiet}。`;
  $("timing-text").textContent = `瞬时事件在 ${data.timing.event_max_age_ms} ms 内有效，按代次和序号去重。菜单预览最长 ${data.timing.preview_ms/1000} 秒。离页停止播放；单播结束保持最后一帧，直到下一个状态接管。聆听时始终用 neutral 打底。[字幕留位] 为制作参考线。`;
  const report = el("a",null,`构建预算记录 ${data.version}`); report.hidden = true;
  $("budgets").after(report);
  $("license").textContent = data.license;
  $("source-revision").textContent = "原版素材修订 "+data.revision+"。原版、早期小样与新表情使用同一语义节点；新表情展示完整交付素材，设备状态另行核对。";
  $("fw-version").textContent = data.version;
  const micro = new URLSearchParams(location.search).get("micro");
  const square = new URLSearchParams(location.search).get("square");
  if (micro !== null) {
    version = "contour";
    if (menu.includes(micro)) selected = id("semantic",micro);
    for (const b of $("versions").querySelectorAll("button")) b.setAttribute("aria-pressed",String(b.dataset.version === version));
  }
  if (square !== null && data.square) {
    version = "square";
    if (menu.includes(square)) selected = id("semantic",square);
    for (const b of $("versions").querySelectorAll("button")) b.setAttribute("aria-pressed",String(b.dataset.version === version));
  }
  document.addEventListener("union:layout",initialView);
  persist(); buildGraph(); select(selected); initialView(); requestAnimationFrame(tick);
  new ResizeObserver(() => { if (!initialized) { initialized = true; initialView(); } }).observe(viewport);
})();
