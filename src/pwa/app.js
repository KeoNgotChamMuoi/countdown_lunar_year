(function () {
  'use strict';

  var VN_OFFSET = 7 * 3600 * 1000; // giờ Việt Nam
  var DAY = 86400000;
  var TET_DAYS = 3; // mùng 1 → mùng 3 hiển thị lời chúc

  // ?mode=lock: ảnh tĩnh cho màn hình khóa (ẩn phần chạy theo giây và nút bấm)
  var MODE = new URLSearchParams(location.search).get('mode');
  if (MODE) document.documentElement.setAttribute('data-mode', MODE);
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var WISHES = [
    'An khang thịnh vượng',
    'Vạn sự như ý',
    'Sức khỏe dồi dào',
    'Tiền vô như nước',
    'Gia đình hạnh phúc, sum vầy',
    'Công thành danh toại',
    'Tấn tài tấn lộc',
    'Năm mới bình an',
    'Deadline ít, lương thưởng nhiều',
    'Ăn Tết không lo tăng cân'
  ];
  var LUCKY = ['10.000đ', '20.000đ', '50.000đ', '68.000đ', '88.000đ', '100.000đ', '168.000đ', '200.000đ', '500.000đ', '1 cái ôm'];
  var WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var buzz = function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* bỏ qua */ } };

  /* ---------- Đếm ngược ---------- */

  /** Thời điểm 00:00 mùng 1 Tết (giờ VN) của năm âm lịch `year`, dạng epoch ms. */
  function tetStart(year) {
    var t = Lunar.tetDate(year);
    return Date.UTC(t.y, t.m - 1, t.d) - VN_OFFSET;
  }

  /** Tết đang tới (hoặc đang diễn ra) và Tết liền trước. */
  function currentTet(now) {
    var y = new Date(now + VN_OFFSET).getUTCFullYear();
    var start = tetStart(y);
    if (now >= start + TET_DAYS * DAY) { y += 1; start = tetStart(y); }
    return { year: y, start: start, prevStart: tetStart(y - 1) };
  }

  function formatDate(ms) {
    var d = new Date(ms + VN_OFFSET);
    return WEEKDAYS[d.getUTCDay()] + ', ' + pad(d.getUTCDate()) + '/' +
      pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }

  function setNum(id, value) {
    var el = $(id);
    if (el.textContent === value) return;
    el.textContent = value;
    if (REDUCED) return;
    el.classList.remove('tick');
    void el.offsetWidth; // chạy lại animation
    el.classList.add('tick');
  }

  var lastYear = null;
  var isTet = false;

  function render() {
    var now = Date.now();
    var tet = currentTet(now);
    var diff = tet.start - now;

    if (tet.year !== lastYear) {
      lastYear = tet.year;
      $('badge').textContent = 'Tết ' + Lunar.canChi(tet.year) + ' · ' + tet.year;
      $('date').textContent = formatDate(tet.start) + ' · Mùng 1 Tết';
      document.title = 'Tết ' + Lunar.canChi(tet.year);
    }

    isTet = diff <= 0;
    $('countdown').hidden = isTet;
    $('festive').hidden = !isTet;

    if (isTet) {
      var day = Math.floor(-diff / DAY) + 1;
      $('festiveSub').textContent = 'Mùng ' + day + ' Tết · Năm con ' + Lunar.conGiap(tet.year);
    } else {
      $('days').textContent = Math.floor(diff / DAY);
      setNum('hours', pad(Math.floor(diff % DAY / 3600000)));
      setNum('minutes', pad(Math.floor(diff % 3600000 / 60000)));
      setNum('seconds', pad(Math.floor(diff % 60000 / 1000)));
    }

    var pct = Math.min(100, Math.max(0, (now - tet.prevStart) / (tet.start - tet.prevStart) * 100));
    $('bar').style.width = pct.toFixed(2) + '%';
    $('progressText').textContent = isTet
      ? 'Năm mới đã tới!'
      : 'Đã đi ' + pct.toFixed(1) + '% chặng đường từ Tết ' + Lunar.canChi(tet.year - 1);
  }

  /* ---------- Lời chúc ---------- */

  var wishIndex = Math.floor(Math.random() * WISHES.length);
  function nextWish() {
    var el = $('wish');
    el.classList.add('out');
    setTimeout(function () {
      el.textContent = '“' + WISHES[wishIndex] + '”';
      el.classList.remove('out');
      wishIndex = (wishIndex + 1) % WISHES.length;
    }, 400);
  }
  var wishTimer = setInterval(nextWish, 6000);
  function wishNow() {
    clearInterval(wishTimer);
    nextWish();
    wishTimer = setInterval(nextWish, 6000);
  }

  /* ---------- Hiệu ứng hạt (pháo hoa, hoa mai bung) ---------- */

  var canvas = $('fx');
  var ctx = canvas.getContext('2d');
  var parts = [];
  var running = false;
  var COLORS = ['#f6c453', '#ffe3a1', '#ff6b4a', '#fff2c4', '#ffd166'];

  function resize() {
    var r = window.devicePixelRatio || 1;
    canvas.width = innerWidth * r;
    canvas.height = innerHeight * r;
    ctx.setTransform(r, 0, 0, r, 0, 0);
  }
  addEventListener('resize', resize);
  resize();

  /** Bung `n` hạt tại (x, y). kind: 'spark' (pháo hoa) hoặc 'flower' (hoa mai). */
  function burst(x, y, n, kind, power) {
    if (REDUCED) n = Math.min(n, 8);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var v = (power || 4) * (0.4 + Math.random() * 0.8);
      parts.push({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'flower' ? 1.5 : 0),
        life: 1, decay: 0.012 + Math.random() * 0.015,
        size: kind === 'flower' ? 6 + Math.random() * 6 : 1.5 + Math.random() * 2,
        rot: Math.random() * 6, vr: (Math.random() - .5) * 0.2,
        color: pick(COLORS), kind: kind
      });
    }
    if (!running) { running = true; requestAnimationFrame(step); }
  }

  function drawFlower(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = '#f6c453';
    for (var k = 0; k < 5; k++) {
      ctx.rotate(Math.PI * 2 / 5);
      ctx.beginPath();
      ctx.ellipse(0, -p.size * 0.55, p.size * 0.32, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#d9480f';
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function step() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += p.kind === 'flower' ? 0.06 : 0.05; // trọng lực
      p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.vr;
      p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life * 1.5);
      if (p.kind === 'flower') {
        drawFlower(p);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(step);
    else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /** Pháo hoa: bắn từ dưới lên rồi nổ ở vài điểm ngẫu nhiên. */
  function fireworks(count) {
    for (var i = 0; i < count; i++) {
      (function (delay) {
        setTimeout(function () {
          var x = innerWidth * (0.15 + Math.random() * 0.7);
          var y = innerHeight * (0.12 + Math.random() * 0.35);
          burst(x, y, 60, 'spark', 5);
        }, delay);
      })(i * 280);
    }
  }

  /* ---------- Tương tác ---------- */

  // Chạm vào số ngày: số nảy lên + pháo hoa + đổi lời chúc
  $('daysBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    var el = e.currentTarget;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    var r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 70, 'spark', 6);
    fireworks(3);
    wishNow();
    buzz([20, 40, 20]);
  });

  // Chạm vào chỗ trống: hoa mai bung ra tại chỗ chạm
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button, .sheet')) return;
    burst(e.clientX, e.clientY, 9, 'flower', 3);
    burst(e.clientX, e.clientY, 14, 'spark', 3);
    buzz(10);
  });

  // Lì xì
  var sheet = $('sheet');
  $('lixiBtn').addEventListener('click', function (e) {
    var btn = e.currentTarget;
    btn.classList.remove('shake');
    void btn.offsetWidth;
    btn.classList.add('shake');
    buzz([30, 30, 60]);
    setTimeout(function () {
      $('sheetAmount').textContent = pick(LUCKY);
      $('sheetWish').textContent = pick(WISHES);
      sheet.hidden = false;
      fireworks(4);
      burst(innerWidth / 2, innerHeight / 2, 18, 'flower', 6);
    }, 450);
  });
  function closeSheet() { sheet.hidden = true; }
  $('sheetClose').addEventListener('click', closeSheet);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  // Lắc điện thoại: bắn pháo hoa (Android Chrome không cần xin quyền)
  var lastShake = 0;
  addEventListener('devicemotion', function (e) {
    var a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    var force = Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z);
    var now = Date.now();
    if (force > 38 && now - lastShake > 1500) {
      lastShake = now;
      fireworks(5);
      wishNow();
      buzz(80);
    }
  });

  /* ---------- Hoa mai rơi nền ---------- */

  var FLOWER = '<svg viewBox="0 0 40 40"><g fill="#f6c453">' +
    [0, 72, 144, 216, 288].map(function (r) {
      return '<ellipse cx="20" cy="10" rx="6" ry="9" transform="rotate(' + r + ' 20 20)"/>';
    }).join('') + '</g><circle cx="20" cy="20" r="4" fill="#d9480f"/></svg>';

  function makePetals() {
    var box = document.querySelector('.petals');
    var count = innerWidth < 500 ? 14 : 26;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'petal';
      p.innerHTML = FLOWER;
      p.style.left = (Math.random() * 100) + '%';
      p.style.setProperty('--s', (12 + Math.random() * 16) + 'px');
      p.style.setProperty('--d', (9 + Math.random() * 10) + 's');
      p.style.setProperty('--delay', (-Math.random() * 18) + 's');
      p.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
      box.appendChild(p);
    }
  }

  /* ---------- Khởi động ---------- */

  // Gợi ý thao tác: điện thoại thì nhắc thêm lắc máy, máy tính thì "bấm"
  var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  $('hint').textContent = touch
    ? 'Chạm vào số ngày để bắn pháo hoa · Lắc máy cũng được'
    : 'Bấm vào số ngày để bắn pháo hoa · Bấm chỗ trống để hoa nở';

  render();
  setInterval(render, 1000);
  nextWish();
  makePetals();

  // Trong 3 ngày Tết: tự bắn pháo hoa mỗi 8 giây
  if (MODE !== 'lock') {
    setInterval(function () { if (isTet && !document.hidden) fireworks(3); }, 8000);
  }

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
