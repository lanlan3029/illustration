(function () {
  'use strict';

  var STORAGE_KEY = 'xhs_sticker_lab_v1';
  var DB_NAME = 'xhs_sticker_lab_db';
  var DB_STORE = 'stickers';
  var DB_VERSION = 1;
  var MIN_POINTS = 8;
  var CLOSE_DIST = 18;
  var MAX_STICKERS = 24;
  var SAVE_MAX_SIDE = 960;

  var state = {
    stickers: [],
    mode: 'lasso',
    style: 'sticker',
    borderColor: '#ffffff',
    brush: 'erase',
    brushSize: 28,
    painting: false,
    sourceImage: null,
    matteCanvas: null,
    display: { w: 0, h: 0, scale: 1 },
    points: [],
    drawing: false,
    pathClosed: false,
    ready: false,
    activeId: null,
    lastPaint: null,
    previewDataUrl: '',
    previewBusy: false,
  };

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function showToast(msg) {
    var t = els.toast;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      t.hidden = true;
    }, 2200);
  }

  function openStickerDb(onSuccess, onError) {
    if (!window.indexedDB) {
      if (onError) onError(new Error('no indexedDB'));
      return;
    }
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = function () {
      onSuccess(req.result);
    };
    req.onerror = function () {
      if (onError) onError(req.error);
    };
  }

  function readLocalStorageStickers() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocalStorageStickers(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadStickersFromDb(done) {
    openStickerDb(function (db) {
      var tx = db.transaction(DB_STORE, 'readonly');
      var store = tx.objectStore(DB_STORE);
      var req = store.getAll();
      req.onsuccess = function () {
        var rows = req.result || [];
        rows.sort(function (a, b) {
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        done(rows);
        db.close();
      };
      req.onerror = function () {
        done([]);
        db.close();
      };
    }, function () {
      done(readLocalStorageStickers());
    });
  }

  function saveStickersToDb(list, done) {
    openStickerDb(function (db) {
      var tx = db.transaction(DB_STORE, 'readwrite');
      var store = tx.objectStore(DB_STORE);
      var clearReq = store.clear();
      clearReq.onsuccess = function () {
        var i;
        for (i = 0; i < list.length; i += 1) {
          store.put(list[i]);
        }
      };
      tx.oncomplete = function () {
        db.close();
        if (done) done(true);
      };
      tx.onerror = function () {
        db.close();
        if (done) done(false);
      };
    }, function () {
      var ok = writeLocalStorageStickers(list);
      if (!ok) {
        // 逐个丢掉最旧的，直到写得下
        var trimmed = list.slice();
        while (trimmed.length && !writeLocalStorageStickers(trimmed)) {
          trimmed.pop();
        }
        ok = trimmed.length > 0 || list.length === 0;
        if (ok) state.stickers = trimmed;
      }
      if (done) done(ok);
    });
  }

  function loadStickers(done) {
    loadStickersFromDb(function (rows) {
      state.stickers = rows || [];
      // 兼容：若 IDB 空但 localStorage 有旧数据，迁过去
      if (!state.stickers.length) {
        var legacy = readLocalStorageStickers();
        if (legacy.length) {
          state.stickers = legacy.slice(0, MAX_STICKERS);
          saveStickersToDb(state.stickers, function () {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch (e) { /* ignore */ }
            if (done) done();
          });
          return;
        }
      }
      if (done) done();
    });
  }

  function saveStickers(done) {
    var list = state.stickers.slice(0, MAX_STICKERS);
    state.stickers = list;
    saveStickersToDb(list, function (ok) {
      if (!ok) {
        showToast('保存失败，请删除部分贴纸后重试');
      }
      if (done) done(ok);
    });
  }

  function compressPngDataUrl(dataUrl, maxSide, cb) {
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      var w = Math.max(1, Math.round(img.width * scale));
      var h = Math.max(1, Math.round(img.height * scale));
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      try {
        cb(c.toDataURL('image/png'));
      } catch (e) {
        cb(dataUrl);
      }
    };
    img.onerror = function () {
      cb(dataUrl);
    };
    img.src = dataUrl;
  }

  function showView(name) {
    els.home.hidden = name !== 'home';
    els.editor.hidden = name !== 'editor';
    els.detail.hidden = name !== 'detail';
  }

  function renderGrid() {
    var n = state.stickers.length;
    els.count.textContent = String(n);
    if (!n) {
      els.empty.hidden = false;
      els.grid.hidden = true;
      els.grid.innerHTML = '';
      return;
    }
    els.empty.hidden = true;
    els.grid.hidden = false;
    els.grid.innerHTML = '';
    state.stickers.forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sticker-card touchable';
      btn.setAttribute('data-id', item.id);
      btn.innerHTML =
        '<span class="sticker-card-inner"><img alt="贴纸" src="' +
        item.thumb +
        '" /></span>';
      btn.addEventListener('click', function () {
        openDetail(item.id);
      });
      els.grid.appendChild(btn);
    });
  }

  function openDetail(id) {
    var item = state.stickers.find(function (s) {
      return s.id === id;
    });
    if (!item) return;
    state.activeId = id;
    els.detailImg.src = item.dataUrl;
    showView('detail');
  }

  function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function pathLength(points) {
    var total = 0;
    for (var i = 1; i < points.length; i += 1) {
      total += distance(points[i - 1], points[i]);
    }
    return total;
  }

  function canClose(points) {
    if (!points || points.length < MIN_POINTS) return false;
    var minLen = Math.max(48, Math.min(state.display.w, state.display.h) * 0.12);
    return pathLength(points) >= minLen;
  }

  /** 轻度平滑：1 次 Chaikin，流畅但不至于太圆 */
  function chaikinOnce(points, closed) {
    if (!points || points.length < 3) return points ? points.slice() : [];
    var n = points.length;
    var out = [];
    var last = closed ? n : n - 1;
    var i;
    for (i = 0; i < last; i += 1) {
      var p0 = points[i];
      var p1 = points[(i + 1) % n];
      out.push({
        x: p0.x * 0.75 + p1.x * 0.25,
        y: p0.y * 0.75 + p1.y * 0.25,
      });
      out.push({
        x: p0.x * 0.25 + p1.x * 0.75,
        y: p0.y * 0.25 + p1.y * 0.75,
      });
    }
    if (!closed) {
      out.unshift({ x: points[0].x, y: points[0].y });
      out.push({ x: points[n - 1].x, y: points[n - 1].y });
    }
    return out;
  }

  /** 极轻邻点混合，压毛刺；strength 小 = 不太圆 */
  function softenOnce(points, closed, strength) {
    if (!points || points.length < 3) return points ? points.slice() : [];
    var s = strength == null ? 0.28 : strength;
    var keep = 1 - s;
    var side = s / 2;
    var n = points.length;
    var out = [];
    var i;
    for (i = 0; i < n; i += 1) {
      if (!closed && (i === 0 || i === n - 1)) {
        out.push({ x: points[i].x, y: points[i].y });
        continue;
      }
      var prev = points[(i - 1 + n) % n];
      var curr = points[i];
      var next = points[(i + 1) % n];
      out.push({
        x: curr.x * keep + prev.x * side + next.x * side,
        y: curr.y * keep + prev.y * side + next.y * side,
      });
    }
    return out;
  }

  function smoothLassoPoints(points, closed) {
    if (!points || points.length < 4) return points ? points.slice() : [];
    // 先轻柔邻点，再 1 次 Chaikin：流畅、保留大转折
    return chaikinOnce(softenOnce(points, closed, 0.26), closed);
  }

  /** 用二次曲线把折线画得更顺，但控制点仍跟路径走，不会鼓成大圆角 */
  function strokeSmoothPath(ctx, points, closed) {
    if (!points.length) return;
    if (points.length < 3) {
      ctx.moveTo(points[0].x, points[0].y);
      if (points[1]) ctx.lineTo(points[1].x, points[1].y);
      return;
    }
    ctx.moveTo(points[0].x, points[0].y);
    var i;
    var n = points.length;
    for (i = 1; i < n - 1; i += 1) {
      var midX = (points[i].x + points[i + 1].x) / 2;
      var midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    if (closed) {
      var midCloseX = (points[n - 1].x + points[0].x) / 2;
      var midCloseY = (points[n - 1].y + points[0].y) / 2;
      ctx.quadraticCurveTo(points[n - 1].x, points[n - 1].y, midCloseX, midCloseY);
      var midStartX = (points[0].x + points[1].x) / 2;
      var midStartY = (points[0].y + points[1].y) / 2;
      ctx.quadraticCurveTo(points[0].x, points[0].y, midStartX, midStartY);
    } else {
      ctx.lineTo(points[n - 1].x, points[n - 1].y);
    }
  }

  function getBorderWidth(w, h) {
    return Math.max(4, Math.min(12, Math.round(Math.min(w, h) * 0.03)));
  }

  function applyBorder(sourceCanvas, color, softShadow) {
    var hard = hardenAlphaForBorder(sourceCanvas, 100);
    var sw = hard.width;
    var sh = hard.height;
    var borderWidth = getBorderWidth(sw, sh);
    var bordered = document.createElement('canvas');
    bordered.width = sw + borderWidth * 2;
    bordered.height = sh + borderWidth * 2;
    var bctx = bordered.getContext('2d');
    var r = borderWidth;
    var dx;
    var dy;
    for (dx = -r; dx <= r; dx += 1) {
      for (dy = -r; dy <= r; dy += 1) {
        if (dx * dx + dy * dy <= r * r) {
          bctx.drawImage(hard, borderWidth + dx, borderWidth + dy);
        }
      }
    }
    bctx.globalCompositeOperation = 'source-in';
    bctx.fillStyle = color;
    bctx.fillRect(0, 0, bordered.width, bordered.height);
    bctx.globalCompositeOperation = 'source-over';
    bctx.drawImage(sourceCanvas, borderWidth, borderWidth);

    if (!softShadow) return bordered;

    var bleed = 10;
    var out = document.createElement('canvas');
    out.width = bordered.width + bleed * 2;
    out.height = bordered.height + bleed * 2;
    var ctx = out.getContext('2d');
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.drawImage(bordered, bleed, bleed);
    ctx.shadowColor = 'transparent';
    ctx.drawImage(bordered, bleed, bleed);
    return out;
  }

  function trimTransparent(sourceCanvas) {
    var ctx = sourceCanvas.getContext('2d');
    var w = sourceCanvas.width;
    var h = sourceCanvas.height;
    var data = ctx.getImageData(0, 0, w, h).data;
    var minX = w;
    var minY = h;
    var maxX = -1;
    var maxY = -1;
    var x;
    var y;
    var i;
    for (y = 0; y < h; y += 1) {
      for (x = 0; x < w; x += 1) {
        i = (y * w + x) * 4 + 3;
        if (data[i] > 8) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return sourceCanvas;
    var tw = maxX - minX + 1;
    var th = maxY - minY + 1;
    var out = document.createElement('canvas');
    out.width = tw;
    out.height = th;
    out.getContext('2d').drawImage(sourceCanvas, minX, minY, tw, th, 0, 0, tw, th);
    return out;
  }

  /**
   * 清掉半透明毛边 + 细碎孤岛像素，避免描边时冒出小色点。
   * 就地修改 canvas。
   */
  function cleanAlphaDebris(canvas) {
    if (!canvas) return canvas;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var imageData = ctx.getImageData(0, 0, w, h);
    var data = imageData.data;
    var n = w * h;
    var alphaThresh = 48;
    var mask = new Uint8Array(n);
    var i;
    for (i = 0; i < n; i += 1) {
      if (data[i * 4 + 3] < alphaThresh) {
        data[i * 4 + 3] = 0;
        mask[i] = 0;
      } else {
        mask[i] = 1;
      }
    }

    var labels = new Int32Array(n);
    var sizes = [0];
    var label = 0;
    var stack = [];
    for (i = 0; i < n; i += 1) {
      if (!mask[i] || labels[i]) continue;
      label += 1;
      var count = 0;
      stack.length = 0;
      stack.push(i);
      labels[i] = label;
      while (stack.length) {
        var cur = stack.pop();
        count += 1;
        var cx = cur % w;
        var cy = (cur - cx) / w;
        var nb;
        if (cx > 0) {
          nb = cur - 1;
          if (mask[nb] && !labels[nb]) {
            labels[nb] = label;
            stack.push(nb);
          }
        }
        if (cx < w - 1) {
          nb = cur + 1;
          if (mask[nb] && !labels[nb]) {
            labels[nb] = label;
            stack.push(nb);
          }
        }
        if (cy > 0) {
          nb = cur - w;
          if (mask[nb] && !labels[nb]) {
            labels[nb] = label;
            stack.push(nb);
          }
        }
        if (cy < h - 1) {
          nb = cur + w;
          if (mask[nb] && !labels[nb]) {
            labels[nb] = label;
            stack.push(nb);
          }
        }
      }
      sizes[label] = count;
    }

    var maxSize = 0;
    for (i = 1; i < sizes.length; i += 1) {
      if (sizes[i] > maxSize) maxSize = sizes[i];
    }
    // 绝对下限 + 相对主体比例：碎点通常远小于主体的 2%
    var minKeep = Math.max(96, Math.floor(n * 0.00035), Math.floor(maxSize * 0.018));

    for (i = 0; i < n; i += 1) {
      var lab = labels[i];
      if (!lab) continue;
      if (sizes[lab] < minKeep) data[i * 4 + 3] = 0;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /** 描边用：把半透明边缘收成硬边，减少碎点被描边放大 */
  function hardenAlphaForBorder(sourceCanvas, thresh) {
    var t = thresh == null ? 96 : thresh;
    var c = document.createElement('canvas');
    c.width = sourceCanvas.width;
    c.height = sourceCanvas.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0);
    var id = ctx.getImageData(0, 0, c.width, c.height);
    var d = id.data;
    var i;
    for (i = 3; i < d.length; i += 4) {
      d[i] = d[i] >= t ? 255 : 0;
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  /** Moore 邻域描外轮廓，用于虚线描边 */
  function traceOuterContour(canvas, thresh) {
    var w = canvas.width;
    var h = canvas.height;
    var data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    function solid(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return false;
      return data[(y * w + x) * 4 + 3] >= thresh;
    }
    var sx = -1;
    var sy = -1;
    var y;
    var x;
    outer:
    for (y = 0; y < h; y += 1) {
      for (x = 0; x < w; x += 1) {
        if (solid(x, y) && !solid(x, y - 1)) {
          sx = x;
          sy = y;
          break outer;
        }
      }
    }
    if (sx < 0) return [];

    var dx = [0, 1, 1, 1, 0, -1, -1, -1];
    var dy = [-1, -1, 0, 1, 1, 1, 0, -1];
    var points = [];
    x = sx;
    y = sy;
    var dir = 0;
    var guard = w * h * 2;
    do {
      points.push({ x: x + 0.5, y: y + 0.5 });
      var start = (dir + 6) % 8;
      var found = false;
      var i;
      for (i = 0; i < 8; i += 1) {
        var nd = (start + i) % 8;
        var nx = x + dx[nd];
        var ny = y + dy[nd];
        if (solid(nx, ny)) {
          x = nx;
          y = ny;
          dir = nd;
          found = true;
          break;
        }
      }
      if (!found) break;
      guard -= 1;
    } while ((x !== sx || y !== sy) && guard > 0);

    return points;
  }

  /** 轮廓点略微外扩，虚线贴在主体外侧，不压画面 */
  function inflateContour(points, amount) {
    if (!points || points.length < 3 || !amount) return points;
    var n = points.length;
    var cx = 0;
    var cy = 0;
    var i;
    for (i = 0; i < n; i += 1) {
      cx += points[i].x;
      cy += points[i].y;
    }
    cx /= n;
    cy /= n;
    var out = [];
    for (i = 0; i < n; i += 1) {
      var dx = points[i].x - cx;
      var dy = points[i].y - cy;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      out.push({
        x: points[i].x + (dx / len) * amount,
        y: points[i].y + (dy / len) * amount,
      });
    }
    return out;
  }

  /** 虚线描边：线宽 / 虚线段随图幅缩放，大图不会细成发丝 */
  function applyDashedBorder(sourceCanvas, color) {
    var hard = hardenAlphaForBorder(sourceCanvas, 100);
    var contour = traceOuterContour(hard, 100);
    if (contour.length < 12) {
      return applyBorder(sourceCanvas, color, false);
    }

    // 保留更密的点，避免折角发硬
    var step = Math.max(1, Math.floor(contour.length / 1200));
    var pts = [];
    var i;
    for (i = 0; i < contour.length; i += step) {
      pts.push(contour[i]);
    }
    pts = softenOnce(pts, true, 0.34);
    pts = softenOnce(pts, true, 0.22);

    var shortEdge = Math.min(sourceCanvas.width, sourceCanvas.height);
    // 约 0.7% / 1.8% 短边，并给合理上下限
    var lineW = Math.max(2.2, Math.min(16, shortEdge * 0.007));
    var dash = Math.max(8, Math.min(36, shortEdge * 0.02));
    var gap = Math.max(6, Math.min(28, dash * 0.78));
    var inflate = Math.max(1.6, Math.min(10, lineW * 0.85));
    pts = inflateContour(pts, inflate);
    var pad = Math.ceil(lineW * 3 + inflate + 8);

    var out = document.createElement('canvas');
    out.width = sourceCanvas.width + pad * 2;
    out.height = sourceCanvas.height + pad * 2;
    var ctx = out.getContext('2d');
    ctx.drawImage(sourceCanvas, pad, pad);

    // 先淡描一层极细实线托底，再叠虚线，观感更干净
    ctx.beginPath();
    ctx.moveTo(pts[0].x + pad, pts[0].y + pad);
    for (i = 1; i < pts.length; i += 1) {
      ctx.lineTo(pts[i].x + pad, pts[i].y + pad);
    }
    ctx.closePath();
    ctx.strokeStyle = color || '#111111';
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = Math.max(1.2, lineW * 0.55);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.lineWidth = lineW;
    ctx.lineCap = 'butt'; // 避免圆头把短虚线糊成实线感
    ctx.lineJoin = 'round';
    ctx.setLineDash([dash, gap]);
    ctx.stroke();
    ctx.setLineDash([]);
    return out;
  }

  function colorDist(r, g, b, tr, tg, tb) {
    var dr = r - tr;
    var dg = g - tg;
    var db = b - tb;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /** 取四边采样，得到纸底主色（适配奶油纸，不只认纯白） */
  function sampleEdgePaperColor(data, width, height) {
    var sumR = 0;
    var sumG = 0;
    var sumB = 0;
    var n = 0;
    var step = Math.max(1, Math.floor(Math.min(width, height) / 80));
    function take(x, y) {
      var p = (y * width + x) * 4;
      sumR += data[p];
      sumG += data[p + 1];
      sumB += data[p + 2];
      n += 1;
    }
    var x;
    var y;
    for (x = 0; x < width; x += step) {
      take(x, 0);
      take(x, height - 1);
    }
    for (y = 0; y < height; y += step) {
      take(0, y);
      take(width - 1, y);
    }
    if (!n) return { r: 255, g: 255, b: 255 };
    return {
      r: Math.round(sumR / n),
      g: Math.round(sumG / n),
      b: Math.round(sumB / n),
    };
  }

  function isPaperPixel(r, g, b, paper, maxDist) {
    // 浅色纸底：接近边缘主色，或本身接近白/奶油
    if (colorDist(r, g, b, paper.r, paper.g, paper.b) <= maxDist) return true;
    var avg = (r + g + b) / 3;
    var span = Math.max(r, g, b) - Math.min(r, g, b);
    return avg >= 228 && span <= 40;
  }

  function buildEdgeBackgroundMask(data, width, height, paper, maxDist) {
    var size = width * height;
    var bg = new Uint8Array(size);
    var queue = [];
    function tryPush(x, y) {
      var i = y * width + x;
      if (bg[i]) return;
      var p = i * 4;
      if (!isPaperPixel(data[p], data[p + 1], data[p + 2], paper, maxDist)) return;
      bg[i] = 1;
      queue.push(i);
    }
    var x;
    var y;
    for (x = 0; x < width; x += 1) {
      tryPush(x, 0);
      tryPush(x, height - 1);
    }
    for (y = 0; y < height; y += 1) {
      tryPush(0, y);
      tryPush(width - 1, y);
    }
    while (queue.length) {
      var i = queue.pop();
      x = i % width;
      y = (i - x) / width;
      if (x > 0) tryPush(x - 1, y);
      if (x < width - 1) tryPush(x + 1, y);
      if (y > 0) tryPush(x, y - 1);
      if (y < height - 1) tryPush(x, y + 1);
    }
    return bg;
  }

  function featherAlpha(data, width, height, radius) {
    if (!radius || radius < 1) return;
    var alpha = new Uint8ClampedArray(width * height);
    var i;
    var j;
    for (i = 0, j = 0; i < data.length; i += 4, j += 1) alpha[j] = data[i + 3];
    var out = new Uint8ClampedArray(alpha.length);
    var x;
    var y;
    var dx;
    var dy;
    for (y = 0; y < height; y += 1) {
      for (x = 0; x < width; x += 1) {
        var sum = 0;
        var count = 0;
        for (dy = -radius; dy <= radius; dy += 1) {
          for (dx = -radius; dx <= radius; dx += 1) {
            var nx = x + dx;
            var ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            sum += alpha[ny * width + nx];
            count += 1;
          }
        }
        out[y * width + x] = Math.round(sum / count);
      }
    }
    for (i = 0, j = 0; i < data.length; i += 4, j += 1) data[i + 3] = out[j];
  }

  /**
   * 纸底抠图：按四边纸色泛洪去底（编辑阶段保留原尺寸，方便擦除/恢复）。
   * 返回 { canvas, removedRatio }
   */
  function mattingPaperBackground(image) {
    var feather = 2;
    var canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var width = imageData.width;
    var height = imageData.height;
    var paper = sampleEdgePaperColor(data, width, height);
    var maxDist = 48;
    var bgMask = buildEdgeBackgroundMask(data, width, height, paper, maxDist);

    // 再剥一层贴边浅色毛边，减少锯齿白边
    var fringe = new Uint8Array(bgMask.length);
    var x;
    var y;
    var i;
    for (y = 1; y < height - 1; y += 1) {
      for (x = 1; x < width - 1; x += 1) {
        i = y * width + x;
        if (bgMask[i]) continue;
        var nearBg =
          bgMask[i - 1] || bgMask[i + 1] || bgMask[i - width] || bgMask[i + width];
        if (!nearBg) continue;
        var p = i * 4;
        if (isPaperPixel(data[p], data[p + 1], data[p + 2], paper, maxDist + 18)) {
          fringe[i] = 1;
        }
      }
    }
    for (i = 0; i < fringe.length; i += 1) {
      if (fringe[i]) bgMask[i] = 1;
    }

    var removed = 0;
    var total = width * height;
    for (i = 0; i < data.length; i += 4) {
      if (bgMask[i / 4] === 1) {
        data[i + 3] = 0;
        removed += 1;
      } else {
        data[i + 3] = 255;
      }
    }
    featherAlpha(data, width, height, feather);
    ctx.putImageData(imageData, 0, 0);
    return {
      canvas: canvas,
      removedRatio: total ? removed / total : 0,
    };
  }

  function cropByLasso(image, imagePoints, style, borderColor) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    imagePoints.forEach(function (p) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    var width = Math.max(1, Math.ceil(maxX - minX));
    var height = Math.max(1, Math.ceil(maxY - minY));
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    imagePoints.forEach(function (p, i) {
      var x = p.x - minX;
      var y = p.y - minY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, -minX, -minY);

    cleanAlphaDebris(canvas);
    if (style === 'raw') return canvas;
    if (style === 'outline') return applyDashedBorder(canvas, borderColor || '#111111');
    return applyBorder(canvas, borderColor || '#ffffff', true);
  }

  function finishWithStyle(rawCanvas, style, borderColor) {
    if (style === 'raw') return rawCanvas;
    if (style === 'outline') return applyDashedBorder(rawCanvas, borderColor || '#111111');
    return applyBorder(rawCanvas, borderColor || '#ffffff', true);
  }

  function makeThumb(dataUrl, maxSide, cb) {
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      var w = Math.max(1, Math.round(img.width * scale));
      var h = Math.max(1, Math.round(img.height * scale));
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/png'));
    };
    img.onerror = function () {
      cb(dataUrl);
    };
    img.src = dataUrl;
  }

  function drawChecker(ctx, w, h) {
    var size = 12;
    var x;
    var y;
    for (y = 0; y < h; y += size) {
      for (x = 0; x < w; x += size) {
        ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#eee' : '#fff';
        ctx.fillRect(x, y, size, size);
      }
    }
  }

  function cloneCanvas(src) {
    var c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    return c;
  }

  function scaleCanvasToMax(source, maxSide) {
    var scale = Math.min(1, maxSide / Math.max(source.width, source.height));
    if (scale >= 0.999) return source;
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(source.width * scale));
    c.height = Math.max(1, Math.round(source.height * scale));
    c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
    return c;
  }

  function buildStyledPreviewCanvas(forZoom) {
    if (!state.ready || !state.sourceImage) return null;
    var maxSide = forZoom ? 1280 : 720;
    if (state.mode === 'matte') {
      if (!state.matteCanvas) return null;
      var matte = cloneCanvas(state.matteCanvas);
      cleanAlphaDebris(matte);
      var trimmed = trimTransparent(matte);
      var styled = finishWithStyle(trimmed, state.style, state.borderColor);
      return scaleCanvasToMax(styled, maxSide);
    }
    if (state.mode === 'lasso' && state.pathClosed && state.points.length >= MIN_POINTS) {
      var smoothed = smoothLassoPoints(state.points, true);
      var imagePoints = displayToImagePoints(smoothed);
      var cropped = cropByLasso(state.sourceImage, imagePoints, state.style, state.borderColor);
      return scaleCanvasToMax(cropped, maxSide);
    }
    return null;
  }

  function openZoomPreview() {
    if (!state.ready) {
      showToast('请先完成抠图或套索');
      return;
    }
    var canvas = buildStyledPreviewCanvas(true);
    if (!canvas) {
      showToast('暂无可预览的贴纸');
      return;
    }
    els.zoomImg.src = canvas.toDataURL('image/png');
    els.zoomModal.hidden = false;
  }

  function closeZoomPreview() {
    if (els.zoomModal) els.zoomModal.hidden = true;
  }

  function redraw() {
    var canvas = els.canvas;
    var ctx = canvas.getContext('2d');
    var img = state.sourceImage;
    if (!img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 抠图模式：只显示去底结果 + 棋盘格，绝不画套索线
    if (state.mode === 'matte') {
      drawChecker(ctx, canvas.width, canvas.height);
      if (state.matteCanvas) {
        ctx.drawImage(state.matteCanvas, 0, 0, state.display.w, state.display.h);
      } else {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(img, 0, 0, state.display.w, state.display.h);
        ctx.globalAlpha = 1;
      }
      return;
    }

    // 套索模式：只显示原图 + 套索路径，不用抠图结果
    ctx.drawImage(img, 0, 0, state.display.w, state.display.h);
    if (!state.points.length) return;
    var drawPts = smoothLassoPoints(state.points, state.pathClosed);
    var dashLen = Math.max(10, Math.round(Math.min(state.display.w, state.display.h) * 0.028));
    var gapLen = Math.max(8, Math.round(dashLen * 0.75));
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt'; // 避免圆头把虚线空隙糊成实线
    ctx.setLineDash([dashLen, gapLen]);
    ctx.beginPath();
    strokeSmoothPath(ctx, drawPts, state.pathClosed);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#e84b4b';
    ctx.beginPath();
    ctx.arc(state.points[0].x, state.points[0].y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function canvasPointFromEvent(e) {
    var rect = els.canvas.getBoundingClientRect();
    var clientX = e.clientX;
    var clientY = e.clientY;
    if (clientX == null && e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    var x = ((clientX - rect.left) / rect.width) * state.display.w;
    var y = ((clientY - rect.top) / rect.height) * state.display.h;
    return { x: x, y: y };
  }

  function setHint(text) {
    els.hint.textContent = text;
  }

  function updateConfirm() {
    var disabled = !state.ready;
    els.confirm.disabled = disabled;
    if (els.previewBtn) els.previewBtn.disabled = disabled;
  }

  function applyModeUi() {
    var isMatte = state.mode === 'matte';
    els.editorTitle.textContent = isMatte ? '白底抠图' : '套索裁切';
    els.undoBtn.textContent = isMatte ? '重抠' : '重画';
    if (els.brushPanel) els.brushPanel.hidden = !isMatte;
    if (els.wrap) {
      if (isMatte) {
        els.wrap.classList.add('is-matte');
        els.wrap.classList.remove('is-lasso');
      } else {
        els.wrap.classList.remove('is-matte');
        els.wrap.classList.add('is-lasso');
      }
    }
    if (els.canvas) {
      els.canvas.style.touchAction = 'none';
      els.canvas.style.cursor = isMatte ? 'crosshair' : 'crosshair';
    }
    var cards = document.querySelectorAll('.mode-card');
    for (var i = 0; i < cards.length; i += 1) {
      var el = cards[i];
      var on = el.getAttribute('data-mode') === state.mode;
      if (on) el.classList.add('is-active');
      else el.classList.remove('is-active');
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (isMatte) {
      setHint('自动去底后，用「擦除」修掉残留背景');
    } else {
      setHint('按住拖动圈出主体，回到起点松开完成');
    }
  }

  function clearLassoState() {
    state.points = [];
    state.drawing = false;
    state.pathClosed = false;
  }

  function clearMatteState() {
    state.matteCanvas = null;
    state.painting = false;
    state.lastPaint = null;
  }

  function setBrush(brush) {
    state.brush = brush;
    var cards = document.querySelectorAll('.brush-card');
    for (var i = 0; i < cards.length; i += 1) {
      var el = cards[i];
      var on = el.getAttribute('data-brush') === brush;
      if (on) el.classList.add('is-active');
      else el.classList.remove('is-active');
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    setHint(brush === 'erase' ? '涂抹擦掉多余背景' : '涂抹恢复误删区域');
  }

  function setBrushSize(size) {
    state.brushSize = size;
    var chips = document.querySelectorAll('.size-chip');
    for (var i = 0; i < chips.length; i += 1) {
      var el = chips[i];
      var on = Number(el.getAttribute('data-size')) === size;
      if (on) el.classList.add('is-active');
      else el.classList.remove('is-active');
    }
  }

  function imagePointFromEvent(e) {
    var p = canvasPointFromEvent(e);
    var s = state.display.scale || 1;
    return { x: p.x / s, y: p.y / s };
  }

  function brushRadiusImage() {
    var s = state.display.scale || 1;
    return Math.max(4, state.brushSize / s);
  }

  function paintMatteAt(imgX, imgY) {
    if (!state.matteCanvas || !state.sourceImage) return;
    var ctx = state.matteCanvas.getContext('2d');
    var r = brushRadiusImage();
    ctx.save();
    if (state.brush === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      var g = ctx.createRadialGradient(imgX, imgY, r * 0.15, imgX, imgY, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(imgX, imgY, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(imgX, imgY, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(state.sourceImage, 0, 0);
    }
    ctx.restore();
  }

  function paintStroke(from, to) {
    if (!from) {
      paintMatteAt(to.x, to.y);
      return;
    }
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var step = Math.max(2, brushRadiusImage() * 0.35);
    var n = Math.max(1, Math.ceil(dist / step));
    var i;
    for (i = 0; i <= n; i += 1) {
      var t = i / n;
      paintMatteAt(from.x + dx * t, from.y + dy * t);
    }
  }

  function runMatte() {
    if (!state.sourceImage) return;
    clearLassoState();
    try {
      var result = mattingPaperBackground(state.sourceImage);
      state.matteCanvas = cleanAlphaDebris(result.canvas);
      state.ready = true;
      if (result.removedRatio < 0.08) {
        setHint('自动去底较弱，请用「擦除」修边，或改套索');
        showToast('可手动擦除残留背景');
      } else {
        setHint('可「擦除」修边，或「恢复」误删部分');
      }
    } catch (e) {
      clearMatteState();
      state.ready = false;
      showToast('抠图失败，请改用套索');
      setHint('抠图失败，请切换到「套索裁切」');
    }
    updateConfirm();
    layoutCanvas();
    
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    state.ready = false;
    applyModeUi();
    if (mode === 'matte') {
      clearLassoState();
      
      runMatte();
    } else {
      clearMatteState();
      clearLassoState();
      
      updateConfirm();
      layoutCanvas();
    }
  }

  function resetEditorAction() {
    
    if (state.mode === 'matte') {
      runMatte();
      return;
    }
    state.points = [];
    state.drawing = false;
    state.pathClosed = false;
    state.ready = false;
    updateConfirm();
    setHint('按住拖动圈出主体，回到起点松开完成');
    redraw();
  }

  function layoutCanvas() {
    var img = state.sourceImage;
    if (!img) return;
    var nw;
    var nh;
    if (state.mode === 'matte' && state.matteCanvas) {
      nw = state.matteCanvas.width;
      nh = state.matteCanvas.height;
    } else {
      nw = img.naturalWidth;
      nh = img.naturalHeight;
    }
    var wrap = els.wrap;
    var maxW = Math.max(120, wrap.clientWidth - 8);
    var maxH = Math.max(160, wrap.clientHeight - 8);
    var scale = Math.min(maxW / nw, maxH / nh, 1);
    var w = Math.max(1, Math.round(nw * scale));
    var h = Math.max(1, Math.round(nh * scale));
    // 套索坐标相对原图像素；抠图只用于预览，scale 仅显示
    state.display = {
      w: w,
      h: h,
      scale: state.mode === 'lasso' ? scale : (img.naturalWidth ? w / img.naturalWidth : scale),
    };
    els.canvas.width = w;
    els.canvas.height = h;
    els.canvas.style.width = w + 'px';
    els.canvas.style.height = h + 'px';
    redraw();
  }

  function isHeicLike(file) {
    if (!file) return false;
    var type = String(file.type || '').toLowerCase();
    var name = String(file.name || '').toLowerCase();
    return type === 'image/heic' || type === 'image/heif' ||
      /\.heic$/i.test(name) || /\.heif$/i.test(name);
  }

  function isImageFile(file) {
    if (!file) return false;
    var type = String(file.type || '').toLowerCase();
    if (/^image\//.test(type)) return true;
    // iPhone HEIC 常无 type，仅能靠扩展名判断
    var name = String(file.name || '').toLowerCase();
    if (/\.(jpe?g|png|gif|webp|bmp|heic|heif|tif|tiff)$/i.test(name)) return true;
    // 相册选取偶发无 type / 无扩展名，仍尝试加载
    return !type;
  }

  function canvasToImage(canvas) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      try {
        img.src = canvas.toDataURL('image/jpeg', 0.95);
      } catch (err) {
        reject(err);
      }
    });
  }

  function loadImageFromBlobUrl(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('blob-load-failed'));
      };
      img.src = url;
    });
  }

  function loadImageFromDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('dataurl-load-failed')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('read-failed')); };
      reader.readAsDataURL(file);
    });
  }

  function loadImageFromBitmap(file) {
    if (typeof createImageBitmap !== 'function') {
      return Promise.reject(new Error('no-bitmap'));
    }
    return createImageBitmap(file).then(function (bitmap) {
      var c = document.createElement('canvas');
      c.width = bitmap.width;
      c.height = bitmap.height;
      var ctx = c.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      if (bitmap.close) bitmap.close();
      return canvasToImage(c);
    });
  }

  /** 兼容 JPG/PNG/WebP；iOS 上尽量解码 HEIC（无 WASM，不能本地转码库） */
  function loadImageFromFile(file) {
    return loadImageFromBlobUrl(file).catch(function () {
      return loadImageFromBitmap(file);
    }).catch(function () {
      return loadImageFromDataUrl(file);
    });
  }

  function openEditor(file) {
    showToast('加载中…');
    loadImageFromFile(file).then(function (img) {
      state.sourceImage = img;
      clearLassoState();
      clearMatteState();
      state.ready = false;
      // 风景/复杂图默认套索，避免「白底抠图」看起来像没抠又像画了线
      state.mode = 'lasso';
      showView('editor');
      applyModeUi();
      requestAnimationFrame(function () {
        layoutCanvas();
        updateConfirm();
        setHint('按住拖动圈出主体，回到起点松开完成');
      });
    }).catch(function () {
      if (isHeicLike(file)) {
        showToast('HEIC 暂无法解码，请用「照片」导出 JPG 后上传');
      } else {
        showToast('图片加载失败，请换一张 JPG/PNG');
      }
    });
  }

  function onPointerDown(e) {
    if (!state.sourceImage) return;
    e.preventDefault();
    try {
      els.canvas.setPointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }

    if (state.mode === 'matte') {
      if (!state.matteCanvas) return;
      
      state.painting = true;
      var ip = imagePointFromEvent(e);
      state.lastPaint = ip;
      paintMatteAt(ip.x, ip.y);
      redraw();
      return;
    }

    if (state.mode !== 'lasso') return;
    
    state.drawing = true;
    state.pathClosed = false;
    state.ready = false;
    state.points = [canvasPointFromEvent(e)];
    updateConfirm();
    redraw();
  }

  function onPointerMove(e) {
    e.preventDefault();
    if (state.mode === 'matte' && state.painting) {
      var ip = imagePointFromEvent(e);
      paintStroke(state.lastPaint, ip);
      state.lastPaint = ip;
      redraw();
      return;
    }
    if (state.mode !== 'lasso' || !state.drawing) return;
    var p = canvasPointFromEvent(e);
    var last = state.points[state.points.length - 1];
    if (!last || distance(last, p) < 3) return;
    state.points.push(p);
    if (canClose(state.points) && distance(p, state.points[0]) <= CLOSE_DIST) {
      setHint('靠近起点了，松开即可闭合');
    }
    redraw();
  }

  function onPointerUp(e) {
    e.preventDefault();
    if (state.mode === 'matte') {
      state.painting = false;
      state.lastPaint = null;
      if (state.matteCanvas) {
        cleanAlphaDebris(state.matteCanvas);
        redraw();
        state.ready = true;
        updateConfirm();
        
      }
      return;
    }
    if (state.mode !== 'lasso' || !state.drawing) return;
    state.drawing = false;
    var p = canvasPointFromEvent(e);
    if (canClose(state.points) && distance(p, state.points[0]) <= CLOSE_DIST + 8) {
      state.pathClosed = true;
      state.ready = true;
      state.points = smoothLassoPoints(state.points, true);
      setHint('路径已闭合，可点「生成贴纸」');
    } else if (state.points.length >= MIN_POINTS) {
      state.pathClosed = true;
      state.ready = true;
      state.points = smoothLassoPoints(state.points, true);
      setHint('已自动闭合路径，可点「生成贴纸」');
    } else {
      state.pathClosed = false;
      state.ready = false;
      setHint('路径太短，请重画并圈完整一圈');
    }
    updateConfirm();
    redraw();
    
  }

  function displayToImagePoints(points) {
    var s = state.display.scale || 1;
    return points.map(function (p) {
      return { x: p.x / s, y: p.y / s };
    });
  }

  function pushSticker(dataUrl) {
    compressPngDataUrl(dataUrl, SAVE_MAX_SIDE, function (full) {
      makeThumb(full, 220, function (thumb) {
        var item = {
          id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          dataUrl: full,
          thumb: thumb,
          style: state.style,
          borderColor: state.borderColor,
          mode: state.mode,
          createdAt: Date.now(),
        };
        state.stickers.unshift(item);
        if (state.stickers.length > MAX_STICKERS) {
          state.stickers = state.stickers.slice(0, MAX_STICKERS);
        }
        saveStickers(function (ok) {
          renderGrid();
          showView('home');
          if (ok === false) {
            showToast('已生成，但本地保存失败');
          } else {
            showToast('贴纸已保存 ✓');
          }
          openDetail(item.id);
        });
      });
    });
  }

  function confirmSticker() {
    if (!state.ready || !state.sourceImage) return;
    var canvas;
    if (state.mode === 'matte') {
      if (!state.matteCanvas) return;
      cleanAlphaDebris(state.matteCanvas);
      canvas = finishWithStyle(trimTransparent(state.matteCanvas), state.style, state.borderColor);
    } else {
      var smoothed = smoothLassoPoints(state.points, true);
      var imagePoints = displayToImagePoints(smoothed);
      canvas = cropByLasso(state.sourceImage, imagePoints, state.style, state.borderColor);
    }
    pushSticker(canvas.toDataURL('image/png'));
  }

  function hasBridge() {
    return !!(window.xhs && window.xhs.miniTool);
  }

  function saveToAlbum(dataUrl) {
    if (!dataUrl) return;
    if (!hasBridge()) {
      showToast('请在小红书小工具容器中保存到相册');
      return;
    }
    var api = window.xhs.miniTool;
    var run = function (filePath) {
      return api.saveImageToPhotosAlbum({ filePath: filePath });
    };
    var p;
    if (typeof api.writeTempFile === 'function') {
      p = Promise.resolve(api.writeTempFile({ data: dataUrl })).then(function (res) {
        var path = (res && res.filePath) || dataUrl;
        return run(path);
      });
    } else {
      p = Promise.resolve(run(dataUrl));
    }
    p.then(function () {
      showToast('已保存到相册');
    }).catch(function () {
      showToast('保存失败，请检查相册权限');
    });
  }

  function deleteActive() {
    if (!state.activeId) return;
    state.stickers = state.stickers.filter(function (s) {
      return s.id !== state.activeId;
    });
    state.activeId = null;
    saveStickers(function () {
      renderGrid();
      showView('home');
      showToast('已删除');
    });
  }

  function setStyle(style) {
    state.style = style;
    var cards = document.querySelectorAll('.style-card');
    for (var i = 0; i < cards.length; i += 1) {
      var el = cards[i];
      var on = el.getAttribute('data-style') === style;
      if (on) el.classList.add('is-active');
      else el.classList.remove('is-active');
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (els.colorPanel) {
      if (style === 'raw') els.colorPanel.classList.add('is-disabled');
      else els.colorPanel.classList.remove('is-disabled');
    }
    
  }

  function setBorderColor(color) {
    state.borderColor = color;
    var chips = document.querySelectorAll('.color-chip');
    for (var i = 0; i < chips.length; i += 1) {
      var el = chips[i];
      var on = el.getAttribute('data-color') === color;
      if (on) el.classList.add('is-active');
      else el.classList.remove('is-active');
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    
  }

  function bind() {
    els.home = $('view-home');
    els.editor = $('view-editor');
    els.detail = $('view-detail');
    els.upload = $('btn-upload');
    els.file = $('file-input');
    els.grid = $('sticker-grid');
    els.empty = $('sticker-empty');
    els.count = $('sticker-count');
    els.canvas = $('work-canvas');
    els.wrap = $('canvas-wrap');
    els.hint = $('lasso-hint');
    els.confirm = $('btn-confirm');
    els.toast = $('toast');
    els.detailImg = $('detail-img');
    els.editorTitle = $('editor-title');
    els.undoBtn = $('btn-undo');
    els.brushPanel = $('brush-panel');
    els.colorPanel = $('color-panel');
    els.previewBtn = $('btn-preview');
    els.zoomModal = $('zoom-modal');
    els.zoomImg = $('zoom-img');

    els.upload.addEventListener('click', function () {
      els.file.click();
    });

    els.file.addEventListener('change', function () {
      var file = els.file.files && els.file.files[0];
      els.file.value = '';
      if (!file) return;
      if (!isImageFile(file)) {
        showToast('请选择图片');
        return;
      }
      openEditor(file);
    });

    $('btn-cancel-edit').addEventListener('click', function () {
      state.sourceImage = null;
      state.matteCanvas = null;
      showView('home');
    });
    els.undoBtn.addEventListener('click', resetEditorAction);
    els.confirm.addEventListener('click', confirmSticker);
    if (els.previewBtn) {
      els.previewBtn.addEventListener('click', openZoomPreview);
    }

    var modeCards = document.querySelectorAll('.mode-card');
    for (var m = 0; m < modeCards.length; m += 1) {
      modeCards[m].addEventListener('click', function (ev) {
        setMode(ev.currentTarget.getAttribute('data-mode'));
      });
    }

    var brushCards = document.querySelectorAll('.brush-card');
    for (var b = 0; b < brushCards.length; b += 1) {
      brushCards[b].addEventListener('click', function (ev) {
        setBrush(ev.currentTarget.getAttribute('data-brush'));
      });
    }
    var sizeChips = document.querySelectorAll('.size-chip');
    for (var s = 0; s < sizeChips.length; s += 1) {
      sizeChips[s].addEventListener('click', function (ev) {
        setBrushSize(Number(ev.currentTarget.getAttribute('data-size')));
      });
    }

    var cards = document.querySelectorAll('.style-card');
    for (var i = 0; i < cards.length; i += 1) {
      cards[i].addEventListener('click', function (ev) {
        setStyle(ev.currentTarget.getAttribute('data-style'));
      });
    }

    var colorChips = document.querySelectorAll('.color-chip');
    for (var c = 0; c < colorChips.length; c += 1) {
      colorChips[c].addEventListener('click', function (ev) {
        setBorderColor(ev.currentTarget.getAttribute('data-color'));
      });
    }

    $('zoom-close').addEventListener('click', closeZoomPreview);
    $('zoom-backdrop').addEventListener('click', closeZoomPreview);

    els.canvas.addEventListener('pointerdown', onPointerDown);
    els.canvas.addEventListener('pointermove', onPointerMove);
    els.canvas.addEventListener('pointerup', onPointerUp);
    els.canvas.addEventListener('pointercancel', onPointerUp);

    $('btn-close-detail').addEventListener('click', function () {
      showView('home');
    });
    $('btn-save-album').addEventListener('click', function () {
      var item = state.stickers.find(function (s) {
        return s.id === state.activeId;
      });
      if (item) saveToAlbum(item.dataUrl);
    });
    $('btn-delete-sticker').addEventListener('click', deleteActive);

    window.addEventListener('resize', function () {
      if (!els.editor.hidden && state.sourceImage) layoutCanvas();
    });
  }

  function init() {
    bind();
    loadStickers(function () {
      renderGrid();
      showView('home');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
