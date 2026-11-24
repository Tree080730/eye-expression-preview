/* AirBoat's indexed RLE EAF and RGB565 composition, rendered on a browser canvas. */
"use strict";
window.AirboatEaf = class {
  constructor(asset) {
    if (asset.kind === "square") return new window.AirboatSquare(asset);
    if (asset.kind === "contour") return new window.AirboatContour(asset);
    if (asset.kind === "optimized") return new window.AirboatOptimized(asset);
    this.asset = asset;
    this.cache = new Map();
    this.entries = [];
    const raw = atob(asset.eaf);
    this.bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
    this.view = new DataView(this.bytes.buffer);
    const count = this.view.getUint32(4, true);
    const start = 16 + count * 8;
    let checksum = 0;
    for (let i = 16; i < this.bytes.length; i++) checksum = (checksum + this.bytes[i]) >>> 0;
    if (String.fromCharCode(...this.bytes.slice(1, 4)) !== "EAF" ||
        this.view.getUint32(12, true) !== this.bytes.length - 16 ||
        checksum !== this.view.getUint32(8, true) || count > 256 || start > this.bytes.length) {
      throw new Error("EAF 容器校验失败");
    }
    for (let i = 0; i < count; i++) {
      const size = this.view.getUint32(16 + i * 8, true);
      const offset = start + this.view.getUint32(20 + i * 8, true);
      const tag = String.fromCharCode(...this.bytes.slice(offset, offset + 4));
      if (offset + size > this.bytes.length || size < 4) throw new Error("EAF 帧边界错误");
      if (tag === "ZZ_S") this.entries.push({offset: offset + 2, size: size - 2});
      else if (tag !== "ZZ_C") throw new Error("EAF 帧标记错误");
    }
    if (this.entries.length !== asset.frames) throw new Error("EAF 帧数不一致");
  }
  frame(number) {
    number = Math.max(0, Math.min(this.entries.length - 1, number));
    if (this.cache.has(number)) return this.cache.get(number);
    const {offset: at, size} = this.entries[number], v = this.view, b = this.bytes;
    const w = v.getUint16(at + 10, true), h = v.getUint16(at + 12, true);
    const blocks = v.getUint16(at + 14, true), bh = v.getUint16(at + 16, true);
    if (w !== this.asset.width || h !== this.asset.height || b[at + 9] !== 8 ||
        blocks * bh < h || (blocks - 1) * bh >= h) throw new Error("EAF 图像格式错误");
    const palette = at + 18 + blocks * 4;
    const rgba = new Uint8ClampedArray(w * h * 4), colors = [];
    for (let i = 0; i < 256; i++) {
      const p = palette + i * 4;
      // Match device opacity and quantize RGB channels to its RGB565 framebuffer.
      colors.push([((b[p + 2] >> 3) * 255 / 31) | 0,
        ((b[p + 1] >> 2) * 255 / 63) | 0, ((b[p] >> 3) * 255 / 31) | 0,
        (b[p] | b[p + 1] | b[p + 2] | b[p + 3]) ? 255 : 0]);
    }
    let p = palette + 1024;
    for (let block = 0; block < blocks; block++) {
      const length = v.getUint32(at + 18 + block * 4, true);
      const valid = w * Math.min(bh, h - block * bh), capacity = w * bh;
      if (p + length > at + size || b[p] !== 0 || (length - 1) % 2) throw new Error("EAF RLE 块错误");
      let written = 0;
      for (let j = p + 1; j < p + length; j += 2) {
        const count = b[j], color = colors[b[j + 1]];
        if (!count || written + count > capacity) throw new Error("EAF RLE 长度错误");
        for (let k = 0; k < count && written + k < valid; k++) {
          rgba.set(color, (block * bh * w + written + k) * 4);
        }
        written += count;
      }
      if (written !== valid && written !== capacity) throw new Error("EAF RLE 像素数错误");
      p += length;
    }
    if (p !== at + size) throw new Error("EAF RLE 尾部错误");
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").putImageData(new ImageData(rgba, w, h), 0, 0);
    this.cache.set(number, canvas);
    // Every asset keeps only a few decoded frames; the raw EAF stays shared.
    if (this.cache.size > 5) this.cache.delete(this.cache.keys().next().value);
    return canvas;
  }
  static frameAt(profile, asset, elapsed) {
    if (profile.segments) return this.previewAt(profile,asset,elapsed,profile.previewMode || "complete").frame;
    const step = Math.floor(elapsed * profile.fps / 1000);
    if (!profile.loop) return Math.min(asset.frames - 1, step);
    if (profile.range && step >= profile.range[1])
      return profile.range[0] + (step - profile.range[0]) % (profile.range[1] - profile.range[0]);
    return step % asset.frames;
  }
  static previewAt(profile, asset, elapsed, mode = "complete") {
    const step = Math.max(0,Math.floor(elapsed * profile.fps / 1000));
    const period = 1000/profile.fps, segments = profile.segments;
    if (!segments) {
      const frame = this.frameAt(profile,asset,elapsed);
      return {frame,phase:!profile.loop && step >= asset.frames ? "held" : "performance",
        finished:!profile.loop && !profile.overlay && step >= asset.frames,
        duration:asset.frames*period,cycle:Math.floor(step/asset.frames)};
    }
    const end = mode === "entry" ? segments.entry[1] : asset.frames;
    let frame = Math.min(end-1,step), cycle = 0;
    if (mode === "loop" && step >= segments.performance[1]) {
      const [a,b] = segments.performance;
      frame = a+(step-a)%(b-a); cycle = Math.floor((step-a)/(b-a));
    }
    const finished = mode !== "loop" && step >= end;
    const phase = finished ? (mode === "entry" ? "entry-held" : "done") :
      frame < segments.entry[1] ? "entry" : frame < segments.performance[1] ? "performance" : "exit";
    return {frame,phase,finished,duration:end*period,cycle};
  }
  static draw(ctx, frame, profile, mirror = "device") {
    const side = ctx.canvas.width, scale = side / 360;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, side, side);
    ctx.imageSmoothingEnabled = false;
    const auto = !profile.fill && frame.width < 200 && frame.height > 60;
    const paired = auto && mirror !== "off";
    if (paired) {
      const y = (360 - frame.height) / 2 + 10;
      ctx.drawImage(frame, 10 * scale, y * scale, frame.width * scale, frame.height * scale);
      ctx.save(); ctx.translate(side, 0); ctx.scale(-1, 1);
      ctx.drawImage(frame, 10 * scale, y * scale, frame.width * scale, frame.height * scale); ctx.restore();
    } else {
      ctx.save();
      if (mirror === "on") { ctx.translate(side, 0); ctx.scale(-1, 1); }
      if (profile.fill) ctx.drawImage(frame, 0, 0, side, side);
      else ctx.drawImage(frame, (360 - frame.width) / 2 * scale, (360 - frame.height) / 2 * scale,
          frame.width * scale, frame.height * scale);
      ctx.restore();
    }
  }
};
