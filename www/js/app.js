/* دنتینو — نرم‌افزار نوبت‌دهی و مدیریت مطب دندانپزشکی */
(function () {
  'use strict';
  var S = Store;
  var fa = J.fa, en = J.en;

  // ================= ابزارها =================
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t2m(t) { if (!t) return 0; var p = en(t).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function m2t(m) { return J.pad(Math.floor(m / 60)) + ':' + J.pad(m % 60); }
  function num(v) { var n = parseInt(en(String(v || '')).replace(/[^\d-]/g, ''), 10); return isNaN(n) ? 0 : n; }
  function money(n) { n = Math.round(n || 0); return fa(Math.abs(n).toLocaleString('en-US')).replace(/,/g, '٬') + (n < 0 ? '-' : ''); }
  function moneyT(n) { return money(n) + ' <small class="muted">تومان</small>'; }
  function digitsOnly(s) { return en(s || '').replace(/\D/g, ''); }
  function normPhone(p) { var d = digitsOnly(p); if (d.indexOf('98') === 0 && d.length === 12) d = '0' + d.slice(2); if (d.length === 10 && d[0] === '9') d = '0' + d; return d; }
  function normText(s) { return en(String(s || '')).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ').toLowerCase().trim(); }
  function initials(n) { n = String(n || '').trim(); return n ? n[0] : '?'; }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function ageFrom(birthIso) {
    if (!birthIso) return '';
    var b = J.parseISO(birthIso), n = new Date();
    var a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a >= 0 ? a : '';
  }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  var IC = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
    money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
    left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    phone: '<path d="M5 3.5h3.2l1.6 4.2-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4.2 1.6V17a2.5 2.5 0 0 1-2.7 2.5C9.6 19 5 14.4 4.5 6.2A2.5 2.5 0 0 1 5 3.5z"/>',
    sms: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 13h5"/>',
    wa: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.8z"/><path d="M9.2 8.6c.3 2.6 2.4 5 5.2 5.6l1-1.2-1.6-.9-.8.7c-.9-.4-1.8-1.3-2.2-2.2l.7-.8-.9-1.6z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tooth: '<path d="M7 2.8C4.4 2.8 2.6 4.8 2.6 7.8c0 2.2.8 3.6 1.4 5.3.6 1.7.8 3.6 1.2 5.6.4 2.2 1 3.6 2.2 3.6 1.4 0 1.7-1.9 2.1-3.8.3-1.5.8-2.9 2.5-2.9s2.2 1.4 2.5 2.9c.4 1.9.7 3.8 2.1 3.8 1.2 0 1.8-1.4 2.2-3.6.4-2 .6-3.9 1.2-5.6.6-1.7 1.4-3.1 1.4-5.3 0-3-1.8-5-4.4-5-1.9 0-3 1-5 1s-3.1-1-5-1z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    hourglass: '<path d="M6 2.5h12M6 21.5h12M7 2.5c0 5 10 5 10 9.5S7 16.5 7 21.5M17 2.5c0 5-10 5-10 9.5s10 4.5 10 9.5"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5a4.3 4.3 0 0 1-.5 8.5z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M4 4h16"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    file: '<path d="M6 2.5h8l5 5V21a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 21z"/><path d="M14 2.5V8h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/>'
  };
  IC.calplus = '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 12.5v6M9 15.5h6"/>';
  IC.userplus = '<circle cx="10" cy="8" r="4"/><path d="M3 20c.7-3.8 3.4-6 7-6 1.6 0 3 .4 4.1 1.2M18 13v6M15 16h6"/>';
  function ic(n, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + (IC[n] || '') + '</svg>'; }

  var STATUS = {
    booked: 'رزرو شده', confirmed: 'تأیید شده', arrived: 'در مطب', done: 'انجام شد', cancelled: 'لغو شده', noshow: 'عدم مراجعه'
  };
  var STATUS_ORDER = ['booked', 'confirmed', 'arrived', 'done', 'noshow', 'cancelled'];
  var METHODS = { cash: 'نقدی', card: 'کارتخوان', transfer: 'کارت‌به‌کارت', cheque: 'چک', insurance: 'بیمه' };
  var COLORS = ['#1fae9e', '#5b7cf0', '#c2410c', '#9333ea', '#db2777', '#ca8a04', '#0891b2', '#4d7c0f'];
  function stBadge(s) { return '<span class="badge st-' + s + '">' + (STATUS[s] || s) + '</span>'; }
  var ACTIVE_ST = function (a) { return a.status !== 'cancelled'; };

  // ================= داده‌ها =================
  var DEFAULT_SETTINGS = {
    id: 'main', clinicName: 'مطب دندانپزشکی دکتر فرید شیرانی', phone: '', address: '',
    start: '09:00', end: '21:00', slot: 15, workDays: [6, 0, 1, 2, 3, 4], breakStart: '', breakEnd: '',
    smsTemplate: '{نام} عزیز، یادآوری نوبت دندانپزشکی شما: {روز} {تاریخ} ساعت {ساعت} نزد {پزشک}.\n{مطب}\nدر صورت عدم امکان حضور لطفاً اطلاع دهید.'
  };
  function settings() { return Object.assign({}, DEFAULT_SETTINGS, S.get('settings', 'main') || {}); }
  function doctors(all) { return S.all('doctors').filter(function (d) { return all || d.active !== false; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.createdAt).localeCompare(String(b.createdAt)); }); }
  function services() { return S.all('services').sort(function (a, b) { return a.name.localeCompare(b.name, 'fa'); }); }
  function patients() { return S.all('patients'); }
  function appts() { return S.all('appointments'); }
  function apptsOn(date) { return appts().filter(function (a) { return a.date === date; }).sort(function (a, b) { return t2m(a.time) - t2m(b.time); }); }
  function pName(id) { var p = S.get('patients', id); return p ? p.name : 'بیمار حذف‌شده'; }
  function dName(id) { var d = S.get('doctors', id); return d ? d.name : '—'; }
  function dColor(id) { var d = S.get('doctors', id); return d ? d.color : '#888'; }
  function svcName(id) { var s = S.get('services', id); return s ? s.name : ''; }
  function treatmentsOf(pid) { return S.all('treatments').filter(function (t) { return t.patientId === pid; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); }
  function paymentsOf(pid) { return S.all('payments').filter(function (t) { return t.patientId === pid; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); }
  function balanceOf(pid) {
    var c = 0, p = 0;
    S.all('treatments').forEach(function (t) { if (t.patientId === pid && t.status === 'done') c += t.price || 0; });
    S.all('payments').forEach(function (t) { if (t.patientId === pid) p += t.amount || 0; });
    return { charges: c, paid: p, due: c - p };
  }
  function allBalances() {
    var m = {};
    S.all('treatments').forEach(function (t) { if (t.status === 'done') { m[t.patientId] = (m[t.patientId] || 0) + (t.price || 0); } });
    S.all('payments').forEach(function (t) { m[t.patientId] = (m[t.patientId] || 0) - (t.amount || 0); });
    return m;
  }
  function nextFileNo() { var mx = 1000; patients().forEach(function (p) { if (+p.fileNo > mx) mx = +p.fileNo; }); return mx + 1; }
  function role() {
    if (S.mode !== 'cloud' || !S.user) return 'admin';
    var st = S.get('staff', S.user.username);
    return st ? st.role : 'secretary';
  }
  function isAdmin() { return role() === 'admin'; }

  function seedIfEmpty() {
    if (!S.get('settings', 'main')) S.save('settings', Object.assign({}, DEFAULT_SETTINGS));
    if (!S.all('doctors').length) S.save('doctors', { name: 'دکتر فرید شیرانی', specialty: 'دندانپزشک', color: COLORS[0], active: true, order: 1 });
    if (!S.all('services').length) {
      [['معاینه و مشاوره', 15], ['جرم‌گیری و بروساژ', 30], ['ترمیم کامپوزیت', 45], ['ترمیم آمالگام', 30], ['عصب‌کشی (درمان ریشه)', 60],
       ['کشیدن دندان', 30], ['جراحی دندان عقل', 60], ['روکش', 45], ['ایمپلنت', 60], ['بلیچینگ (سفید کردن)', 60],
       ['ارتودنسی - ویزیت', 20], ['دندانپزشکی کودکان', 30], ['رادیوگرافی', 15]].forEach(function (s) {
        S.save('services', { name: s[0], duration: s[1], price: 0 });
      });
    }
  }

  // ================= وضعیت رابط =================
  var ui = {
    view: 'home', date: J.today(), doc: 'all', calMode: 'grid', pid: null, ptab: 'info', pq: '', psort: 'recent',
    finRange: 'month', finOffset: 0, tooth: null, setTab: 'clinic'
  };
  var modals = [];

  // ================= پل اندروید =================
  function saveFile(name, mime, text) {
    if (window.Android && Android.saveFile) {
      var b64 = btoa(unescape(encodeURIComponent(text)));
      var ok = Android.saveFile(name, mime, b64);
      toast(ok ? 'فایل در پوشه Downloads ذخیره شد' : 'ذخیره فایل ناموفق بود');
      return;
    }
    var blob = new Blob([text], { type: mime });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function doPrint(html) {
    $('#printArea').innerHTML = html;
    if (window.Android && Android.print) Android.print(settings().clinicName);
    else window.print();
  }
  function openUrl(u) {
    if (window.Android && Android.openExternal) Android.openExternal(u);
    else window.location.href = u;
  }

  // ================= پیامک =================
  function smsText(a) {
    var st = settings(), p = S.get('patients', a.patientId) || {};
    return st.smsTemplate
      .replace(/{نام}/g, p.name || '')
      .replace(/{روز}/g, J.WEEKDAYS[J.weekday(a.date)])
      .replace(/{تاریخ}/g, J.jMid(a.date))
      .replace(/{ساعت}/g, fa(a.time))
      .replace(/{پزشک}/g, dName(a.doctorId))
      .replace(/{خدمت}/g, svcName(a.serviceId))
      .replace(/{مطب}/g, st.clinicName + (st.phone ? ' - ' + fa(st.phone) : ''));
  }
  function smsLink(phone, body) { return 'sms:' + normPhone(phone) + '?body=' + encodeURIComponent(body); }
  function waLink(phone, body) { var p = normPhone(phone); if (p[0] === '0') p = '98' + p.slice(1); return 'https://wa.me/' + p + (body ? '?text=' + encodeURIComponent(body) : ''); }

  // ================= چیدمان =================
  var NAV = [
    ['home', 'خانه', 'home'], ['calendar', 'نوبت‌ها', 'cal'], ['patients', 'بیماران', 'users'], ['services', 'خدمات', 'tooth'],
    ['finance', 'مالی', 'money'], ['waitlist', 'لیست انتظار', 'hourglass'], ['more', 'پروفایل و تنظیمات', 'settings']
  ];
  var TITLES = { home: 'خانه', calendar: 'نوبت‌ها', patients: 'بیماران', patient: 'پرونده بیمار', finance: 'گزارش مالی', waitlist: 'لیست انتظار', settings: 'تنظیمات', more: 'پروفایل', services: 'خدمات و تعرفه‌ها' };
  var SET_TITLES = { clinic: 'اطلاعات مطب', hours: 'ساعات کاری', doctors: 'پزشکان', services: 'خدمات', sms: 'پیامک یادآوری', sync: 'همگام‌سازی و کاربران', backup: 'پشتیبان و خروجی' };
  var BACK = { patient: 'patients', settings: 'more', waitlist: 'more', services: 'more' };
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  function syncIndicator() {
    if (S.mode !== 'cloud') return '<span class="sync-pill" title="داده‌ها فقط روی همین دستگاه"><span class="sync-dot local"></span>محلی</span>';
    var cls = !S.online ? 'off' : (S.syncing || S.queue.length) ? 'busy' : '';
    var txt = !S.online ? 'آفلاین' + (S.queue.length ? ' (' + fa(S.queue.length) + ')' : '') : S.queue.length ? 'در حال ارسال' : 'همگام';
    return '<span class="sync-pill"><span class="sync-dot ' + cls + '"></span>' + txt + '</span>';
  }

  function render() {
    if (ui.gate) return;
    var root = $('#root');
    var st = settings();
    var v = ui.view;
    var sec = v === 'patient' ? 'patients' : v === 'settings' ? 'more' : v;
    var side = '<aside class="sidebar"><div class="brand"><div class="brand-logo"><img src="logo.png" alt=""></div><div><div class="brand-name">دنتینو</div><div class="brand-sub ellipsis" style="max-width:150px">' + esc(st.clinicName) + '</div></div></div>' +
      NAV.map(function (n) { return '<button class="nav-item' + (sec === n[0] ? ' active' : '') + '" data-act="nav" data-v="' + n[0] + '">' + ic(n[2]) + n[1] + '</button>'; }).join('') +
      '<div class="spacer"></div>' +
      '<div style="padding:0 10px 8px">' + syncIndicator() + '</div>' +
      '<button class="nav-item" data-act="theme">' + ic(isDark() ? 'sun' : 'moon') + (isDark() ? 'حالت روشن' : 'حالت تیره') + '</button></aside>';

    var bn = [['home', 'خانه', 'home'], ['calendar', 'نوبت‌ها', 'cal'], ['patients', 'بیماران', 'users'], ['finance', 'مالی', 'money'], ['more', 'پروفایل', 'user']];
    var bsec = (v === 'settings' || v === 'waitlist' || v === 'services') ? 'more' : sec;
    var bottom = '<nav class="bottomnav">' + bn.map(function (n) {
      return '<button class="' + (bsec === n[0] ? 'active' : '') + '" data-act="nav" data-v="' + n[0] + '"><span class="ib">' + ic(n[2]) + '</span>' + n[1] + '</button>';
    }).join('') + '</nav>';

    var body = VIEWS[v] ? VIEWS[v]() : '';
    var title = v === 'settings' ? (SET_TITLES[ui.setTab] || 'تنظیمات') : TITLES[v];
    var top = '';
    if (v === 'home') top = '';
    else if (BACK[v]) top = '<div class="topbar sub"><button class="icon-pill" data-act="back" title="بازگشت">' + ic('right') + '</button><h1>' + title + '</h1><div class="acts">' + (TOPACT[v] ? TOPACT[v]() : '') + '</div></div>';
    else top = '<div class="topbar"><h1>' + title + '</h1><div class="grow"></div>' + syncIndicator() + (TOPACT[v] ? TOPACT[v]() : '') + '</div>';
    var fab = (v === 'home' || v === 'calendar') ? '<button class="fab" data-act="newAppt" title="نوبت جدید">' + ic('plus') + '</button>'
      : v === 'patients' ? '<button class="fab" data-act="editPatient" title="بیمار جدید">' + ic('plus') + '</button>'
      : v === 'waitlist' ? '<button class="fab" data-act="editWait" title="افزودن">' + ic('plus') + '</button>'
      : v === 'services' ? '<button class="fab" data-act="editService" title="خدمت جدید">' + ic('plus') + '</button>' : '';

    var scrollY = window.scrollY, schedScroll = $('.sched') ? $('.sched').scrollTop : null;
    var focusId = document.activeElement && document.activeElement.id, selStart = document.activeElement && document.activeElement.selectionStart;
    root.innerHTML = '<div id="app">' + side + '<main>' + top + '<div class="content">' + body + '</div></main>' + bottom + fab + '</div>';
    window.scrollTo(0, scrollY);
    onScroll();
    if (focusId && document.getElementById(focusId) && !$('.overlay')) { var f = document.getElementById(focusId); f.focus(); try { f.setSelectionRange(selStart, selStart); } catch (e) {} }
    if (AFTER[v]) AFTER[v](schedScroll);
  }
  function onScroll() { var t = $('.topbar'); if (t) t.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });

  var TOPACT = {
    calendar: function () {
      return '<button class="btn sm" data-act="today">امروز</button><button class="icon-pill" data-act="printDay" title="چاپ برنامه روز">' + ic('print') + '</button>';
    },
    patient: function () {
      return '<button class="icon-pill" data-act="editPatient" data-id="' + ui.pid + '" title="ویرایش">' + ic('edit') + '</button>';
    }
  };

  // ================= تصاویر (SVG) =================
  var ART_N = 0;
  var TOOTH_D = 'M30 18C18 18 12 28 13 40c1 12 7 18 9 30 2 12 4 22 11 22s7-12 10-20c2-6 4-9 7-9s5 3 7 9c3 8 3 20 10 20s9-10 11-22c2-12 8-18 9-30 1-12-5-22-17-22-8 0-12 5-20 5s-12-5-20-5z';
  function star4(cx, cy, r, fill, op) {
    return '<path d="M' + cx + ' ' + (cy - r) + 'Q' + cx + ' ' + cy + ' ' + (cx + r) + ' ' + cy + 'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy + r) + 'Q' + cx + ' ' + cy + ' ' + (cx - r) + ' ' + cy + 'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy - r) + 'z" fill="' + fill + '" opacity="' + (op || 1) + '"/>';
  }
  // opts: ring, shield, sparkle, cal, check, kind (clean|white|implant|ortho|surgery|kids|general)
  function toothSVG(o) {
    o = o || {};
    var id = 'ta' + (++ART_N);
    var s = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f2fbf9"/><stop offset="1" stop-color="#c9e8e3"/></linearGradient>' +
      '<radialGradient id="' + id + 'b" cx=".3" cy=".22" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + 'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fe6d3"/><stop offset="1" stop-color="#139585"/></linearGradient>' +
      '<linearGradient id="' + id + 'm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d7e1e4"/><stop offset=".5" stop-color="#f5f8f9"/><stop offset="1" stop-color="#aab9be"/></linearGradient>' +
      '<clipPath id="' + id + 'k"><rect x="0" y="0" width="100" height="58"/></clipPath>' +
      '<filter id="' + id + 'd" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#1a7e73" flood-opacity=".22"/></filter></defs>';
    var ringT = 'rotate(-14 50 60)';
    if (o.ring) s += '<g transform="' + ringT + '"><path d="M3 60A47 13 0 0 1 97 60" fill="none" stroke="url(#' + id + 'c)" stroke-width="3.5" opacity=".45"/></g>';
    var implant = o.kind === 'implant';
    s += '<g filter="url(#' + id + 'd)"' + (implant ? ' clip-path="url(#' + id + 'k)"' : '') + '><path d="' + TOOTH_D + '" fill="url(#' + id + 'a)" stroke="#d3ebe7" stroke-width="1.2"/>' +
      '<path d="' + TOOTH_D + '" fill="url(#' + id + 'b)"/><path d="M23 33c2-7 8-10 14-8" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".95"/></g>';
    if (implant) {
      s += '<rect x="40" y="58" width="20" height="5" rx="2" fill="#c3d0d4"/><path d="M42 63h16l-2 26q-6 5-12 0z" fill="url(#' + id + 'm)" stroke="#9fb0b5" stroke-width=".8"/>';
      for (var t = 0; t < 5; t++) s += '<path d="M42 ' + (67 + t * 4.5) + 'l16 -2" stroke="#8fa1a7" stroke-width="1.4" stroke-linecap="round"/>';
    }
    if (o.ring) s += '<g transform="' + ringT + '"><path d="M97 60A47 13 0 0 1 3 60" fill="none" stroke="url(#' + id + 'c)" stroke-width="4.5" stroke-linecap="round"/></g>';
    if (o.kind === 'ortho') s += '<path d="M8 47Q50 42 92 47" stroke="#8ea2a8" stroke-width="2" fill="none"/><rect x="41" y="39" width="18" height="13" rx="3" fill="#b9c8cc" stroke="#8ea2a8"/><rect x="46" y="43" width="8" height="5" rx="1" fill="#e9f0f2"/>';
    if (o.kind === 'clean') s += star4(80, 22, 7, '#38c4b1') + star4(18, 70, 5, '#38c4b1', .8) + '<circle cx="84" cy="44" r="3.5" fill="#9fe6dc"/><circle cx="76" cy="62" r="2.5" fill="#9fe6dc"/>';
    if (o.kind === 'white' || o.sparkle) s += star4(82, 20, 8, '#ffffff') + star4(82, 20, 5, '#5fdcc9') + star4(17, 26, 5, '#5fdcc9', .9) + star4(88, 74, 4, '#5fdcc9', .7);
    if (o.kind === 'surgery') s += '<circle cx="74" cy="72" r="13" fill="#ec5f7a"/><path d="M74 65v14M67 72h14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
    if (o.kind === 'kids') s += '<path d="M74 84c-9-6-14-11-14-16a6 6 0 0 1 14-3 6 6 0 0 1 14 3c0 5-5 10-14 16z" fill="#ff8aa3"/>';
    if (o.kind === 'general' || o.shield) {
      var sx = o.shield ? 66 : 70, sy = o.shield ? 50 : 56, k = o.shield ? 1 : .8;
      s += '<g transform="translate(' + sx + ' ' + sy + ') scale(' + k + ')"><path d="M0-17l15 5.5v10.5c0 10-6.5 16-15 19.5-8.5-3.5-15-9.5-15-19.5v-10.5z" fill="url(#' + id + 'c)" stroke="#fff" stroke-width="2.4"/>' +
        '<path d="M0-8v14M-7 -1h14" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>';
    }
    if (o.cal) s += '<g transform="translate(58 52)"><rect x="0" y="4" width="36" height="32" rx="7" fill="#fff" stroke="#1fae9e" stroke-width="2.5"/><path d="M0 11a7 7 0 0 1 7-7h22a7 7 0 0 1 7 7v5H0z" fill="#1fae9e"/>' +
      '<path d="M10 0v8M26 0v8" stroke="#1fae9e" stroke-width="3" stroke-linecap="round"/><g fill="#7fdccf"><rect x="6" y="20" width="6" height="5" rx="1.5"/><rect x="15" y="20" width="6" height="5" rx="1.5"/><rect x="24" y="20" width="6" height="5" rx="1.5"/><rect x="6" y="28" width="6" height="5" rx="1.5"/></g>' +
      '<circle cx="31" cy="33" r="9" fill="#22c4a4" stroke="#fff" stroke-width="2.5"/><path d="M27 33l3 3 5-6" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>';
    if (o.check) s += '<g transform="translate(74 70)"><circle r="14" fill="#fff"/><circle r="11" fill="#22c4a4"/><path d="M-5 0l3.5 3.5 6.5-7" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<g transform="translate(22 76)"><rect x="-12" y="-9" width="24" height="18" rx="4" fill="#fff" stroke="#9fd9cf" stroke-width="2"/><path d="M-7-3h14M-7 2h9" stroke="#1fae9e" stroke-width="2.4" stroke-linecap="round"/></g>';
    return s + '</svg>';
  }
  function ringHTML(pct) {
    var r = 35, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100), id = 'rg' + (++ART_N);
    return '<div class="ring"><svg viewBox="0 0 84 84"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--primary-2)"/><stop offset="1" style="stop-color:var(--primary)"/></linearGradient></defs>' +
      '<circle cx="42" cy="42" r="' + r + '" fill="none" style="stroke:var(--primary-soft)" stroke-width="9"/>' +
      '<circle cx="42" cy="42" r="' + r + '" fill="none" stroke="url(#' + id + ')" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' +
      '<div class="pc num">٪' + fa(Math.round(pct)) + '</div></div>';
  }

  // ================= صفحه خانه =================
  var VIEWS = {};
  function greetWord() { var h = new Date().getHours(); return h >= 5 && h < 12 ? 'صبح بخیر' : h < 16 && h >= 12 ? 'ظهر بخیر' : h >= 16 && h < 20 ? 'عصر بخیر' : 'شب بخیر'; }
  function myName() {
    if (S.user) { var s = S.get('staff', S.user.username); return (s && s.name) || S.user.username; }
    var st = settings(); return st.greetName || (doctors()[0] || {}).name || st.clinicName;
  }
  function tomorrowList() { return apptsOn(J.addDays(J.today(), 1)).filter(function (a) { return a.status === 'booked' || a.status === 'confirmed'; }); }
  function remindersHTML() {
    var tom = J.addDays(J.today(), 1), tomList = tomorrowList();
    if (!tomList.length) return '<div class="muted small">برای فردا (' + J.jMid(tom) + ') نوبتی ثبت نشده.</div>';
    return '<div class="list">' + tomList.map(function (a) {
      var p = S.get('patients', a.patientId) || {};
      return '<div class="li" style="cursor:default"><div class="time-col num">' + fa(a.time) + '</div><div class="grow"><div class="t ellipsis">' + esc(p.name) + '</div><div class="s">' + esc(dName(a.doctorId)) + '</div></div>' +
        (a.reminded ? '<span class="badge good">' + ic('check', ' style="width:13px;height:13px"') + 'ارسال شد</span>' : '') +
        (p.phone ? '<button class="btn sm" data-act="sendSms" data-id="' + a.id + '">' + ic('sms') + 'پیامک</button>' : '<span class="tiny muted">بدون شماره</span>') + '</div>';
    }).join('') + '</div>';
  }
  function nextAppt() {
    var today = J.today(), nm = nowMin();
    var n = apptsOn(today).filter(function (a) { return (a.status === 'booked' || a.status === 'confirmed' || a.status === 'arrived') && t2m(a.time) + (+a.duration || 30) >= nm; })[0];
    if (n) return n;
    return appts().filter(function (a) { return a.date > today && (a.status === 'booked' || a.status === 'confirmed'); })
      .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); })[0];
  }
  VIEWS.home = function () {
    var today = J.today(), list = apptsOn(today), act = list.filter(function (a) { return ACTIVE_ST(a) && a.status !== 'noshow'; });
    var tPay = 0; S.all('payments').forEach(function (p) { if (p.date === today) tPay += p.amount || 0; });
    var bal = allBalances(), debt = 0, debtors = 0; Object.keys(bal).forEach(function (k) { if (bal[k] > 0 && S.get('patients', k)) { debt += bal[k]; debtors++; } });
    var done = list.filter(function (a) { return a.status === 'done'; }).length;
    var waiting = list.filter(function (a) { return a.status === 'arrived'; }).length;
    var notRem = tomorrowList().filter(function (a) { return !a.reminded; }).length;
    var me = myName();

    var L = '<div class="hello"><div class="avatar" style="width:48px;height:48px;font-size:19px">' + esc(initials(me)) + '</div><div class="grow"><div class="hi">' + greetWord() + ' · ' + J.jMid(today) + '</div>' +
      '<div class="nm ellipsis">' + esc(me) + ' 👋</div></div>' + (S.mode === 'cloud' ? syncIndicator() : '') +
      '<button class="icon-pill" data-act="reminders" title="یادآوری‌ها">' + ic('bell') + (notRem ? '<span class="bdg num">' + fa(notRem) + '</span>' : '') + '</button></div>';
    L += '<button class="searchbar" data-act="goSearch">' + ic('search') + '<span>جستجوی بیمار، موبایل یا شماره پرونده…</span><span class="end">' + ic('users', ' style="width:17px;height:17px"') + '</span></button>';

    var n = nextAppt();
    if (n) {
      var p = S.get('patients', n.patientId) || {}, isT = n.date === today;
      L += '<div class="hero"><div class="art">' + toothSVG({ ring: true, sparkle: true }) + '</div><div class="txt"><div class="lbl">نوبت بعدی' + (isT ? ' · امروز' : '') + '</div>' +
        '<div class="who ellipsis">' + (p.alerts ? '⚠ ' : '') + esc(p.name || '—') + '</div><div class="what ellipsis">' + esc([svcName(n.serviceId), dName(n.doctorId)].filter(Boolean).join(' · ')) + '</div>' +
        '<div class="when"><span>' + ic('cal') + (isT ? 'امروز' : J.WEEKDAYS[J.weekday(n.date)] + ' ' + J.jMid(n.date)) + '</span><span class="num">' + ic('clock') + fa(n.time) + '</span></div></div>' +
        '<div class="acts">' + (isT ? (n.status === 'arrived' ? '<button class="hb solid" data-act="setStatus" data-id="' + n.id + '" data-s="done">انجام شد</button>' : '<button class="hb solid" data-act="setStatus" data-id="' + n.id + '" data-s="arrived">پذیرش</button>') : '') +
        '<button class="hb" data-act="editAppt" data-id="' + n.id + '">تغییر زمان</button><div class="grow"></div><button class="hc" data-act="openAppt" data-id="' + n.id + '" title="جزئیات">' + ic('left') + '</button></div></div>';
    } else {
      L += '<div class="hero"><div class="art">' + toothSVG({ ring: true, sparkle: true }) + '</div><div class="txt"><div class="lbl">نوبت بعدی</div><div class="who">نوبت فعالی ندارید</div>' +
        '<div class="what">برای امروز و روزهای آینده نوبتی ثبت نشده است.</div></div><div class="acts"><button class="hb solid" data-act="newAppt">ثبت نوبت جدید</button></div></div>';
    }

    L += '<div class="sec-h"><b>دسترسی سریع</b><button class="link" data-act="nav" data-v="more">همه</button></div><div class="qa">' +
      '<button data-act="newAppt"><span class="ic c1">' + ic('calplus') + '</span>نوبت جدید</button>' +
      '<button data-act="editPatient"><span class="ic c2">' + ic('userplus') + '</span>بیمار جدید</button>' +
      '<button data-act="reminders"><span class="ic c3">' + ic('bell') + '</span>یادآوری‌ها' + (notRem ? '<span class="bdg num">' + fa(notRem) + '</span>' : '') + '</button>' +
      '<button data-act="nav" data-v="services"><span class="ic c4">' + ic('tooth') + '</span>خدمات</button></div>';

    var pct = act.length ? done / act.length * 100 : 0;
    var big = !act.length ? 'امروز نوبتی ندارید' : pct >= 80 ? 'عالی! 👏' : pct >= 40 ? 'خوب پیش می‌رود 👍' : done ? 'شروع خوبی بوده ☀️' : 'روز تازه شروع شده ☀️';
    L += '<div class="sec-h"><b>وضعیت امروز</b><button class="link" data-act="nav" data-v="finance">گزارش</button></div><div class="card"><div class="score">' + ringHTML(pct) +
      '<div class="grow"><div class="big">' + big + '</div><div class="small muted">' + fa(done) + ' از ' + fa(act.length) + ' نوبت امروز انجام شده' + (waiting ? ' · ' + fa(waiting) + ' نفر در مطب' : '') + '</div></div></div>' +
      '<div class="mini-stats"><div class="mini"><div class="l">دریافتی امروز</div><div class="v num">' + money(tPay) + ' <small>تومان</small></div></div>' +
      '<div class="mini" data-act="nav" data-v="finance" style="cursor:pointer"><div class="l">طلب از بیماران' + (debtors ? ' (' + fa(debtors) + ' نفر)' : '') + '</div><div class="v num" style="color:' + (debt ? 'var(--danger)' : 'inherit') + '">' + money(debt) + ' <small>تومان</small></div></div></div></div>';

    var R = '<div class="sec-h"><b>نوبت‌های امروز</b><button class="link" data-act="nav" data-v="calendar">تقویم</button></div><div class="card" style="padding:8px 12px">';
    R += list.length ? '<div class="list">' + list.map(apptRow).join('') + '</div>' : '<div class="empty">' + ic('cal') + 'امروز نوبتی ثبت نشده</div>';
    R += '</div>';
    R += '<div class="sec-h"><b>یادآوری نوبت‌های فردا</b>' + (tomorrowList().length ? '<span class="badge ' + (notRem ? 'bad' : 'good') + '">' + (notRem ? fa(notRem) + ' ارسال‌نشده' : 'همه ارسال شد') + '</span>' : '') + '</div><div class="card" style="padding:10px 12px">' + remindersHTML() + '</div>';
    var wl = S.all('waitlist');
    if (wl.length) R += '<div class="sec-h"><b>لیست انتظار</b><button class="link" data-act="nav" data-v="waitlist">' + fa(wl.length) + ' نفر</button></div><div class="card small muted">' + wl.slice(0, 4).map(function (w) { return esc(w.name); }).join('، ') + (wl.length > 4 ? ' و ...' : '') + '</div>';
    var bd = birthdaysToday();
    if (bd.length) R += '<div class="sec-h"><b>🎂 تولد بیماران امروز</b></div><div class="card" style="padding:8px 12px"><div class="list">' + bd.map(function (p) {
      return '<div class="li" data-act="openPatient" data-id="' + p.id + '"><div class="avatar">' + esc(initials(p.name)) + '</div><div class="grow t">' + esc(p.name) + '</div>' +
        (p.phone ? '<button class="btn sm" data-act="smsBirthday" data-id="' + p.id + '">' + ic('sms') + 'تبریک</button>' : '') + '</div>';
    }).join('') + '</div></div>';
    return '<div class="home-grid"><div>' + L + '</div><div>' + R + '</div></div>';
  };
  function stat(l, v, sub) { return '<div class="card stat"><div class="lbl">' + l + '</div><div class="val num">' + v + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>'; }
  function birthdaysToday() {
    var j = J.toJ(J.today());
    return patients().filter(function (p) { if (!p.birth) return false; var b = J.toJ(p.birth); return b[1] === j[1] && b[2] === j[2]; });
  }
  function apptRow(a) {
    var p = S.get('patients', a.patientId) || {};
    var quick = '';
    if (a.status === 'booked' || a.status === 'confirmed') quick = '<button class="btn sm" data-act="setStatus" data-id="' + a.id + '" data-s="arrived">پذیرش</button>';
    else if (a.status === 'arrived') quick = '<button class="btn sm primary" data-act="setStatus" data-id="' + a.id + '" data-s="done">انجام شد</button>';
    return '<div class="li" data-act="openAppt" data-id="' + a.id + '"><div class="time-col num">' + fa(a.time) + '<small>' + fa(a.duration || 30) + ' دقیقه</small></div>' +
      '<span class="dot" style="background:' + dColor(a.doctorId) + '"></span><div class="grow"><div class="t ellipsis">' + esc(p.name || '—') + (p.alerts ? ' <span style="color:var(--danger)" title="هشدار پزشکی">⚠</span>' : '') + '</div>' +
      '<div class="s ellipsis">' + esc([svcName(a.serviceId), dName(a.doctorId)].filter(Boolean).join(' · ')) + '</div></div>' + stBadge(a.status) + quick + '</div>';
  }

  // ================= تقویم نوبت‌ها =================
  var ROW_H = 30;
  VIEWS.calendar = function () {
    var st = settings(), d = ui.date, docs = doctors();
    var col = J.faCol(d), weekStart = J.addDays(d, -col);
    var counts = {}; appts().forEach(function (a) { if (ACTIVE_ST(a)) counts[a.date] = (counts[a.date] || 0) + 1; });
    var h = '<div class="card" style="padding:10px 12px"><div class="datebar"><button class="btn icon ghost" data-act="shiftDay" data-n="-1">' + ic('right') + '</button>' +
      '<div class="title" data-act="pickDate">' + J.jLong(d) + '</div><button class="btn icon ghost" data-act="shiftDay" data-n="1">' + ic('left') + '</button></div>';
    h += '<div class="weekstrip">';
    for (var i = 0; i < 7; i++) {
      var dd = J.addDays(weekStart, i), j = J.toJ(dd), off = st.workDays.indexOf(J.weekday(dd)) < 0;
      h += '<div class="wd' + (dd === d ? ' sel' : '') + (dd === J.today() ? ' today' : '') + (off ? ' off' : '') + '" data-act="setDate" data-d="' + dd + '">' +
        (counts[dd] ? '<span class="c">' + fa(counts[dd]) + '</span>' : '') + '<div class="w">' + J.WD_NAMES[J.weekday(dd)] + '</div><div class="n">' + fa(j[2]) + '</div></div>';
    }
    h += '</div></div>';

    h += '<div class="row" style="margin:12px 0 10px"><div class="chips grow">';
    if (docs.length > 1) h += '<button class="chip' + (ui.doc === 'all' ? ' active' : '') + '" data-act="setDoc" data-id="all">همه پزشکان</button>';
    docs.forEach(function (x) { h += '<button class="chip' + (ui.doc === x.id || docs.length === 1 ? ' active' : '') + '" data-act="setDoc" data-id="' + x.id + '"><span class="dot" style="background:' + x.color + '"></span>' + esc(x.name) + '</button>'; });
    h += '</div><button class="btn sm icon' + (ui.calMode === 'grid' ? ' primary' : '') + '" data-act="calMode" data-m="grid" title="جدول زمانی">' + ic('grid') + '</button>' +
      '<button class="btn sm icon' + (ui.calMode === 'list' ? ' primary' : '') + '" data-act="calMode" data-m="list" title="فهرست">' + ic('list') + '</button></div>';

    if (st.workDays.indexOf(J.weekday(d)) < 0) h += '<div class="note-box" style="margin-bottom:10px">این روز در تنظیمات به عنوان روز تعطیل مطب مشخص شده است.</div>';

    var list = apptsOn(d).filter(function (a) { return ui.doc === 'all' || a.doctorId === ui.doc; });
    if (ui.calMode === 'list') {
      var act = list.filter(ACTIVE_ST);
      h += '<div class="card">' + (list.length ? '<div class="small muted" style="margin-bottom:4px">' + fa(act.length) + ' نوبت فعال</div><div class="list">' + list.map(apptRow).join('') + '</div>' : '<div class="empty">' + ic('cal') + 'نوبتی برای این روز ثبت نشده</div>') + '</div>';
      return h;
    }
    return h + scheduleGrid(d, list);
  };

  function scheduleGrid(d, list) {
    var st = settings();
    var docs = doctors().filter(function (x) { return ui.doc === 'all' || x.id === ui.doc; });
    if (!docs.length) docs = doctors();
    var start = t2m(st.start), end = t2m(st.end), slot = +st.slot || 15;
    // اگر نوبتی خارج از ساعت کاری باشد، بازه را باز کن
    list.forEach(function (a) { var s = t2m(a.time); if (s < start) start = Math.floor(s / 60) * 60; var e = s + (+a.duration || 30); if (e > end) end = Math.ceil(e / 60) * 60; });
    var bs = st.breakStart ? t2m(st.breakStart) : -1, be = st.breakEnd ? t2m(st.breakEnd) : -1;
    var isToday = d === J.today(), past = d < J.today(), nm = nowMin();
    var colW = docs.length > 1 ? 'minmax(150px,1fr)' : '1fr';
    var tpl = '52px repeat(' + docs.length + ',' + colW + ')';
    var h = '<div class="sched" id="sched" style="max-height:calc(100vh - 260px)"><div class="sched-head" style="grid-template-columns:' + tpl + '"><div></div>' +
      docs.map(function (x) { return '<div><span class="dot" style="background:' + x.color + '"></span><span class="ellipsis">' + esc(x.name) + '</span></div>'; }).join('') + '</div>';
    h += '<div class="sched-body" style="grid-template-columns:' + tpl + '">';
    // ستون ساعت
    h += '<div>';
    for (var m = start; m < end; m += slot) h += '<div class="slot-time num' + (m % 60 === 0 ? ' hour' : '') + '" style="height:' + ROW_H + 'px">' + (m % 60 === 0 || slot >= 30 ? fa(m2t(m)) : '') + '</div>';
    h += '</div>';
    docs.forEach(function (doc) {
      h += '<div style="position:relative">';
      for (var m = start; m < end; m += slot) {
        var cls = 'slot' + (m % 60 === 0 ? ' hour' : '') + ((past || (isToday && m + slot <= nm)) ? ' past' : '') + (bs >= 0 && m >= bs && m < be ? ' brk' : '');
        h += '<div class="' + cls + '" style="height:' + ROW_H + 'px" data-act="slotClick" data-doc="' + doc.id + '" data-t="' + m2t(m) + '"></div>';
      }
      var mine = list.filter(function (a) { return a.doctorId === doc.id; });
      lanes(mine).forEach(function (L) {
        var a = L.a, top = (t2m(a.time) - start) / slot * ROW_H, ht = Math.max((+a.duration || 30) / slot * ROW_H - 2, 26);
        var p = S.get('patients', a.patientId) || {};
        var w = 100 / L.n;
        h += '<div class="appt ' + a.status + '" data-act="openAppt" data-id="' + a.id + '" style="--c:' + doc.color + ';top:' + (top + 1) + 'px;height:' + ht + 'px;right:calc(' + (L.i * w) + '% + 3px);width:calc(' + w + '% - 6px)">' +
          '<div class="nm">' + (p.alerts ? '⚠ ' : '') + esc(p.name || '—') + '</div><div class="mt num">' + fa(a.time) + ' · ' + esc(svcName(a.serviceId) || STATUS[a.status]) + '</div>' +
          (ht > 50 ? '<div class="mt">' + STATUS[a.status] + '</div>' : '') + '</div>';
      });
      h += '</div>';
    });
    if (isToday && nm >= start && nm < end) h += '<div class="now-line" style="top:' + ((nm - start) / slot * ROW_H) + 'px;right:52px;left:0"></div>';
    h += '</div></div>';
    ui._gridStart = start; ui._gridSlot = slot;
    return h;
  }
  // چیدن نوبت‌های هم‌پوشان کنار هم
  function lanes(list) {
    var items = list.slice().sort(function (a, b) { return t2m(a.time) - t2m(b.time); });
    var out = [], group = [], groupEnd = -1;
    function flush() {
      var laneEnds = [];
      group.forEach(function (it) {
        var s = t2m(it.time), e = s + (+it.duration || 30), k = 0;
        while (laneEnds[k] > s) k++;
        laneEnds[k] = e; it._lane = k;
      });
      group.forEach(function (it) { out.push({ a: it, i: it._lane, n: laneEnds.length }); });
      group = [];
    }
    items.forEach(function (a) {
      var s = t2m(a.time), e = s + (+a.duration || 30);
      if (a.status === 'cancelled') { out.push({ a: a, i: 0, n: 1 }); return; }
      if (s >= groupEnd && group.length) flush();
      group.push(a); groupEnd = Math.max(groupEnd, e);
    });
    if (group.length) flush();
    return out;
  }
  var AFTER = {};
  AFTER.calendar = function (prev) {
    var el = $('#sched'); if (!el) return;
    if (prev != null && ui._keepScroll) { el.scrollTop = prev; return; }
    ui._keepScroll = true;
    var st = settings(), target = ui.date === J.today() ? nowMin() - 60 : t2m(st.start);
    var first = apptsOn(ui.date)[0];
    if (ui.date !== J.today() && first) target = t2m(first.time) - 30;
    el.scrollTop = Math.max(0, (target - (ui._gridStart || 0)) / (ui._gridSlot || 15) * ROW_H);
  };

  // ================= بیماران =================
  VIEWS.patients = function () {
    var q = normText(ui.pq), bal = allBalances();
    var list = patients();
    if (q) list = list.filter(function (p) {
      return normText(p.name).indexOf(q) > -1 || digitsOnly(p.phone).indexOf(digitsOnly(q) || '§') > -1 || String(p.fileNo) === en(q) || digitsOnly(p.nationalId) === digitsOnly(q);
    });
    var last = {}; appts().forEach(function (a) { if (!last[a.patientId] || a.date > last[a.patientId]) last[a.patientId] = a.date; });
    if (ui.psort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name, 'fa'); });
    else if (ui.psort === 'debt') list = list.filter(function (p) { return (bal[p.id] || 0) > 0; }).sort(function (a, b) { return (bal[b.id] || 0) - (bal[a.id] || 0); });
    else list.sort(function (a, b) { return String(last[b.id] || b.createdAt).localeCompare(String(last[a.id] || a.createdAt)); });

    var h = '<div class="row" style="margin-bottom:10px"><div class="search grow">' + ic('search') + '<input class="input" id="pq" placeholder="جستجو: نام، موبایل، شماره پرونده، کد ملی" value="' + esc(ui.pq) + '" data-in="pq"></div></div>';
    h += '<div class="chips" style="margin-bottom:10px">' + [['recent', 'آخرین مراجعه'], ['name', 'الفبایی'], ['debt', 'بدهکاران']].map(function (s) {
      return '<button class="chip' + (ui.psort === s[0] ? ' active' : '') + '" data-act="psort" data-s="' + s[0] + '">' + s[1] + '</button>';
    }).join('') + '<span class="tiny muted" style="align-self:center;margin-inline-start:auto">' + fa(list.length) + ' بیمار</span></div>';
    h += '<div class="card" style="padding:4px 12px">';
    if (!list.length) h += '<div class="empty">' + ic('users') + (q ? 'بیماری با این مشخصات پیدا نشد' : 'هنوز بیماری ثبت نشده') + '</div>';
    else h += '<div class="list">' + list.slice(0, 300).map(function (p) {
      var b = bal[p.id] || 0;
      return '<div class="li" data-act="openPatient" data-id="' + p.id + '"><div class="avatar">' + esc(initials(p.name)) + '</div><div class="grow"><div class="t ellipsis">' + esc(p.name) +
        (p.alerts ? ' <span style="color:var(--danger)" title="' + esc(p.alerts) + '">⚠</span>' : '') + '</div><div class="s num">پرونده ' + fa(p.fileNo || '-') + (p.phone ? ' · ' + fa(p.phone) : '') +
        (last[p.id] ? ' · آخرین نوبت ' + J.jStr(last[p.id]) : '') + '</div></div>' + (b > 0 ? '<span class="badge bad num">' + money(b) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
    if (list.length > 300) h += '<div class="tiny muted" style="padding:8px">۳۰۰ مورد اول نمایش داده شد؛ برای یافتن بقیه جستجو کنید.</div>';
    h += '</div>';
    return h;
  };

  VIEWS.patient = function () {
    var p = S.get('patients', ui.pid);
    if (!p) { ui.view = 'patients'; return VIEWS.patients(); }
    var b = balanceOf(p.id), age = ageFrom(p.birth);
    var h = '<div class="card"><div class="prof"><div class="avatar lg">' + esc(initials(p.name)) + '</div><div class="grow">' +
      '<div class="nm">' + esc(p.name) + '</div><div class="small muted num">پرونده ' + fa(p.fileNo || '-') + (age !== '' ? ' · ' + fa(age) + ' ساله' : '') + (p.gender ? ' · ' + (p.gender === 'm' ? 'آقا' : 'خانم') : '') + '</div>' +
      (p.phone ? '<div class="small muted num">' + fa(p.phone) + '</div>' : '') + '</div>' +
      (p.phone ? '<button class="icon-pill" data-act="call" data-p="' + esc(p.phone) + '" title="تماس">' + ic('phone') + '</button><button class="icon-pill" data-act="smsTo" data-p="' + esc(p.phone) + '" title="پیامک">' + ic('sms') + '</button>' : '') + '</div>';
    if (p.alerts) h += '<div class="alert-box" style="margin-top:12px">' + ic('alert') + '<div>هشدار پزشکی: ' + esc(p.alerts) + '</div></div>';
    h += '<div class="row wrap" style="margin-top:14px"><button class="btn primary" data-act="newAppt" data-pid="' + p.id + '">' + ic('plus') + 'نوبت جدید</button>' +
      '<button class="btn" data-act="addPayment" data-pid="' + p.id + '">' + ic('money') + 'ثبت پرداخت</button>' +
      '<div class="grow"></div><div class="small">مانده: <b class="num" style="color:' + (b.due > 0 ? 'var(--danger)' : 'var(--ok)') + '">' + money(b.due) + '</b> <span class="muted">تومان</span></div></div></div>';

    var tabs = [['info', 'اطلاعات'], ['teeth', 'دندان‌ها'], ['appts', 'نوبت‌ها'], ['money', 'مالی']];
    h += '<div class="seg" style="margin:16px 0 14px">' + tabs.map(function (t) { return '<button class="' + (ui.ptab === t[0] ? 'active' : '') + '" data-act="ptab" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    h += ui.ptab === 'teeth' ? PTABS.teeth(p, b) : '<div class="card">' + PTABS[ui.ptab](p, b) + '</div>';
    return h;
  };
  var PTABS = {};
  PTABS.info = function (p) {
    function f(l, v) { return '<div><div class="tiny muted">' + l + '</div><div>' + (v ? esc(v) : '<span class="muted">—</span>') + '</div></div>'; }
    return '<div class="grid g2 keep" style="gap:14px">' + f('موبایل', fa(p.phone)) + f('تلفن دوم', fa(p.phone2)) + f('کد ملی', fa(p.nationalId)) + f('تاریخ تولد', p.birth ? J.jStr(p.birth) : '') +
      f('بیمه', p.insurance) + f('معرف', p.referrer) + '</div><div class="stack" style="margin-top:14px">' + f('آدرس', p.address) + f('یادداشت', p.notes) +
      f('تاریخ تشکیل پرونده', p.createdAt ? J.jStr(J.iso(new Date(p.createdAt))) : '') + '</div>' +
      (isAdmin() ? '<div style="margin-top:16px"><button class="btn danger sm" data-act="delPatient" data-id="' + p.id + '">' + ic('trash') + 'حذف پرونده</button></div>' : '');
  };
  PTABS.appts = function (p) {
    var list = appts().filter(function (a) { return a.patientId === p.id; }).sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });
    if (!list.length) return '<div class="empty">' + ic('cal') + 'نوبتی ثبت نشده</div>';
    var stats = {}; list.forEach(function (a) { stats[a.status] = (stats[a.status] || 0) + 1; });
    return '<div class="row wrap small" style="margin-bottom:8px">' + Object.keys(stats).map(function (k) { return '<span class="badge st-' + k + '">' + STATUS[k] + ': ' + fa(stats[k]) + '</span>'; }).join('') + '</div>' +
      '<div class="list">' + list.map(function (a) {
        return '<div class="li" data-act="openAppt" data-id="' + a.id + '"><div class="grow"><div class="t num">' + J.jStr(a.date) + ' · ' + fa(a.time) + '</div><div class="s">' + esc([svcName(a.serviceId), dName(a.doctorId)].filter(Boolean).join(' · ')) + '</div></div>' + stBadge(a.status) + '</div>';
      }).join('') + '</div>';
  };
  var UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  var LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  // [عرض، عمق] هر دندان بر اساس رقم دوم شماره FDI
  var TW = { 8: [23, 25], 7: [24, 26], 6: [25, 27], 5: [18, 22], 4: [18, 22], 3: [16, 21], 2: [13, 18], 1: [16, 19] };
  function jawSVG(status, sel) {
    var cx = 180, rx = 150, ry = 132, T0 = 0.36, out = '';
    var defs = '<defs>' +
      '<linearGradient id="jn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--tooth-a)"/><stop offset="1" style="stop-color:var(--tooth-b)"/></linearGradient>' +
      '<linearGradient id="jp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6df"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>' +
      '<linearGradient id="jd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecfdf9"/><stop offset="1" stop-color="#8fe0d2"/></linearGradient>' +
      '<filter id="js" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#0d5e56" flood-opacity=".18"/></filter></defs>';
    function arch(list, cy, up) {
      var N = 240, pts = [], len = [0], i;
      for (i = 0; i <= N; i++) {
        var th = (Math.PI - T0) - (Math.PI - 2 * T0) * i / N;
        var x = cx + rx * Math.cos(th), y = cy + (up ? -1 : 1) * ry * Math.sin(th);
        pts.push([x, y]);
        if (i) len.push(len[i - 1] + Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]));
      }
      var gap = 2.2, widths = list.map(function (n) { return TW[n % 10][0]; });
      var sum = widths.reduce(function (s, w) { return s + w; }, 0) + gap * (list.length - 1);
      var cur = (len[N] - sum) / 2;
      var gum = 'M' + pts.filter(function (p, k) { return k % 6 === 0 || k === N; }).map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L');
      var g = '<path d="' + gum + '" fill="none" style="stroke:var(--gum-2)" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="' + gum + '" fill="none" style="stroke:var(--gum)" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>';
      list.forEach(function (n, k) {
        var w = widths[k], d = TW[n % 10][1], mid = cur + w / 2; cur += w + gap;
        var j = 1; while (j < N && len[j] < mid) j++;
        var f = (mid - len[j - 1]) / ((len[j] - len[j - 1]) || 1);
        var x = pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, y = pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f;
        var ang = Math.atan2(pts[j][1] - pts[j - 1][1], pts[j][0] - pts[j - 1][0]) * 180 / Math.PI;
        var st = status[n], fill = st === 'done' ? 'url(#jd)' : st === 'plan' ? 'url(#jp)' : 'url(#jn)';
        var stroke = st === 'done' ? 'var(--primary)' : st === 'plan' ? '#e2a43a' : 'var(--tooth-line)';
        var r = n % 10 >= 4 ? 8 : 6;
        var vx = cx - x, vy = cy - y, vd = Math.hypot(vx, vy) || 1, lo = d / 2 + 11;
        g += '<g class="tg' + (sel === String(n) ? ' sel' : '') + '" data-act="toothClick" data-n="' + n + '"><title>دندان ' + n + '</title>' +
          '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')" filter="url(#js)">' +
          '<rect class="tb" x="' + (-w / 2) + '" y="' + (-d / 2) + '" width="' + w + '" height="' + d + '" rx="' + r + '" fill="' + fill + '" style="stroke:' + stroke + '" stroke-width="1.4"/>' +
          '<ellipse cx="' + (-w * .14).toFixed(1) + '" cy="' + (-d * .17).toFixed(1) + '" rx="' + (w * .22).toFixed(1) + '" ry="' + (d * .14).toFixed(1) + '" fill="#fff" opacity=".75"/></g>' +
          '<text class="tl" x="' + (x + vx / vd * lo).toFixed(1) + '" y="' + (y + vy / vd * lo).toFixed(1) + '" text-anchor="middle" dominant-baseline="central">' + fa(n) + '</text></g>';
      });
      return g;
    }
    out += arch(UPPER, 150, true) + arch(LOWER, 170, false);
    out += '<text x="180" y="132" class="tl" text-anchor="middle" dominant-baseline="central">فک بالا</text><text x="180" y="188" class="tl" text-anchor="middle" dominant-baseline="central">فک پایین</text>' +
      '<text x="16" y="160" class="tl" text-anchor="middle" dominant-baseline="central">راست</text><text x="344" y="160" class="tl" text-anchor="middle" dominant-baseline="central">چپ</text>';
    return '<svg class="jaw" viewBox="0 0 360 322" xmlns="http://www.w3.org/2000/svg">' + defs + out + '</svg>';
  }
  PTABS.teeth = function (p, b) {
    var tr = treatmentsOf(p.id), byTooth = {}, status = {};
    tr.forEach(function (t) { if (t.tooth) String(t.tooth).split(',').forEach(function (n) { n = n.trim(); if (n) (byTooth[n] = byTooth[n] || []).push(t); }); });
    Object.keys(byTooth).forEach(function (n) { status[n] = byTooth[n].every(function (t) { return t.status === 'done'; }) ? 'done' : 'plan'; });
    var h = '<div class="card"><div class="jaw-wrap"><div class="jaw-plate">' + jawSVG(status, ui.tooth) + '</div></div>' +
      '<div class="legend"><span><i style="background:var(--tooth-b);border:1px solid var(--tooth-line)"></i>بدون درمان</span><span><i style="background:#ffd27a"></i>طرح درمان</span><span><i style="background:#8fe0d2"></i>درمان‌شده</span></div>' +
      '<div class="tiny muted" style="text-align:center;margin-top:6px">روی هر دندان بزنید تا درمان‌هایش نمایش داده شود</div></div>';
    var doneN = tr.filter(function (t) { return t.status === 'done'; }).length, planN = tr.length - doneN;
    var pct = tr.length ? Math.round(doneN / tr.length * 100) : 0;
    var label = !tr.length ? 'بدون طرح درمان' : pct === 100 ? 'درمان کامل شده' : pct >= 50 ? 'رو به اتمام' : 'در حال درمان';
    h += '<div class="card" style="margin-top:14px"><div class="small muted">وضعیت کلی درمان</div><div class="row"><b class="grow" style="font-size:17px">' + label + '</b><b class="num" style="color:var(--primary)">٪' + fa(pct) + '</b></div><div class="progress"><div style="width:' + pct + '%"></div></div></div>';
    h += '<div class="tiles3"><div class="tile"><div class="l">انجام‌شده</div><div class="v num">' + fa(doneN) + '</div></div><div class="tile"><div class="l">در انتظار</div><div class="v num">' + fa(planN) + '</div></div>' +
      '<div class="tile"><div class="l">مانده حساب</div><div class="v num" style="font-size:15px;line-height:1.9;color:' + (b.due > 0 ? 'var(--danger)' : 'var(--ok)') + '">' + money(b.due) + '</div></div></div>';
    var shown = ui.tooth ? (byTooth[ui.tooth] || []) : tr;
    h += '<div class="sec-h"><b>' + (ui.tooth ? 'درمان‌های دندان ' + fa(ui.tooth) : 'همه درمان‌ها') + '</b>' + (ui.tooth ? '<button class="link" data-act="toothClick" data-n="' + ui.tooth + '" style="margin-inline-end:10px">نمایش همه</button>' : '') +
      '<button class="btn sm primary" data-act="editTreatment" data-pid="' + p.id + '"' + (ui.tooth ? ' data-tooth="' + ui.tooth + '"' : '') + '>' + ic('plus') + 'درمان</button></div><div class="card" style="padding:8px 12px">';
    if (!shown.length) h += '<div class="empty" style="padding:16px">' + ic('tooth') + 'درمانی ثبت نشده</div>';
    else h += '<div class="list">' + shown.map(function (t) {
      return '<div class="li" data-act="editTreatment" data-id="' + t.id + '"><div class="grow"><div class="t">' + esc(t.title) + (t.tooth ? ' <span class="muted small num">(دندان ' + fa(t.tooth) + ')</span>' : '') + '</div>' +
        '<div class="s num">' + J.jStr(t.date) + (t.doctorId ? ' · ' + esc(dName(t.doctorId)) : '') + (t.note ? ' · ' + esc(t.note) : '') + '</div></div><div style="text-align:left"><div class="num small">' + money(t.price) + '</div>' +
        '<span class="badge ' + (t.status === 'done' ? 'st-done' : 'st-arrived') + '">' + (t.status === 'done' ? 'انجام‌شده' : 'طرح درمان') + '</span></div></div>';
    }).join('') + '</div>';
    h += '</div>';
    var planned = tr.filter(function (t) { return t.status !== 'done'; }), pt = 0; planned.forEach(function (t) { pt += t.price || 0; });
    if (planned.length) h += '<div class="note-box" style="margin-top:12px">طرح درمان باقی‌مانده: ' + fa(planned.length) + ' مورد، برآورد ' + money(pt) + ' تومان</div>';
    h += '<button class="btn cta" style="margin-top:16px" data-act="printStatement" data-pid="' + p.id + '">مشاهده گزارش کامل<span class="arr">' + ic('left') + '</span></button>';
    return h;
  };
  PTABS.money = function (p, b) {
    var items = [];
    treatmentsOf(p.id).forEach(function (t) { if (t.status === 'done') items.push({ d: t.date, k: 'c', t: t }); });
    paymentsOf(p.id).forEach(function (x) { items.push({ d: x.date, k: 'p', t: x }); });
    items.sort(function (a, b) { return String(b.d).localeCompare(String(a.d)); });
    var h = '<div class="grid g3" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">' +
      '<div><div class="tiny muted">هزینه درمان‌ها</div><div class="num" style="font-weight:700">' + money(b.charges) + '</div></div>' +
      '<div><div class="tiny muted">پرداختی</div><div class="num" style="font-weight:700;color:var(--ok)">' + money(b.paid) + '</div></div>' +
      '<div><div class="tiny muted">مانده</div><div class="num" style="font-weight:800;color:' + (b.due > 0 ? 'var(--danger)' : 'var(--ok)') + '">' + money(b.due) + '</div></div></div>';
    h += '<div class="row" style="margin-bottom:6px"><b class="grow">گردش حساب</b><button class="btn sm" data-act="printStatement" data-pid="' + p.id + '">' + ic('print') + 'چاپ صورتحساب</button></div>';
    if (!items.length) return h + '<div class="empty" style="padding:16px">' + ic('money') + 'تراکنشی ثبت نشده</div>';
    h += '<div class="tbl-wrap"><table class="tbl"><tr><th>تاریخ</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th><th></th></tr>' + items.map(function (it) {
      var t = it.t;
      return it.k === 'c'
        ? '<tr><td class="num">' + J.jStr(t.date) + '</td><td>' + esc(t.title) + (t.tooth ? ' (' + fa(t.tooth) + ')' : '') + '</td><td class="num">' + money(t.price) + '</td><td></td><td><button class="btn sm ghost icon" data-act="editTreatment" data-id="' + t.id + '">' + ic('edit') + '</button></td></tr>'
        : '<tr><td class="num">' + J.jStr(t.date) + '</td><td>پرداخت ' + (METHODS[t.method] || '') + (t.note ? ' - ' + esc(t.note) : '') + '</td><td></td><td class="num" style="color:var(--ok)">' + money(t.amount) + '</td><td><button class="btn sm ghost icon" data-act="addPayment" data-id="' + t.id + '">' + ic('edit') + '</button></td></tr>';
    }).join('') + '</table></div>';
    return h;
  };

  // ================= مالی =================
  function finRange() {
    var t = J.today(), j = J.toJ(t), o = ui.finOffset;
    if (ui.finRange === 'day') { var d = J.addDays(t, o); return [d, d, J.jLong(d)]; }
    if (ui.finRange === 'week') { var ws = J.addDays(J.addDays(t, -J.faCol(t)), o * 7); return [ws, J.addDays(ws, 6), 'هفته ' + J.jMid(ws) + ' تا ' + J.jMid(J.addDays(ws, 6))]; }
    if (ui.finRange === 'year') { var y = j[0] + o; return [J.fromJ(y, 1, 1), J.fromJ(y, 12, J.monthLen(y, 12)), 'سال ' + fa(y)]; }
    var m = j[1] - 1 + o, yy = j[0] + Math.floor(m / 12); m = ((m % 12) + 12) % 12 + 1;
    return [J.fromJ(yy, m, 1), J.fromJ(yy, m, J.monthLen(yy, m)), J.MONTHS[m - 1] + ' ' + fa(yy)];
  }
  VIEWS.finance = function () {
    var r = finRange(), a = r[0], b = r[1];
    function inR(d) { return d >= a && d <= b; }
    var pays = S.all('payments').filter(function (p) { return inR(p.date); });
    var trs = S.all('treatments').filter(function (t) { return t.status === 'done' && inR(t.date); });
    var aps = appts().filter(function (x) { return inR(x.date); });
    var income = 0, work = 0, byM = {}, byD = {}, bySvc = {};
    pays.forEach(function (p) { income += p.amount || 0; byM[p.method || 'cash'] = (byM[p.method || 'cash'] || 0) + (p.amount || 0); });
    trs.forEach(function (t) { work += t.price || 0; var dn = t.doctorId ? dName(t.doctorId) : 'نامشخص'; byD[dn] = (byD[dn] || 0) + (t.price || 0); });
    aps.forEach(function (x) { if (x.status === 'done') { var s = svcName(x.serviceId) || 'سایر'; bySvc[s] = (bySvc[s] || 0) + 1; } });
    var cnt = function (s) { return aps.filter(function (x) { return x.status === s; }).length; };
    var newP = patients().filter(function (p) { return p.createdAt && inR(J.iso(new Date(p.createdAt))); }).length;

    var h = '<div class="chips" style="margin-bottom:10px">' + [['day', 'روزانه'], ['week', 'هفتگی'], ['month', 'ماهانه'], ['year', 'سالانه']].map(function (x) {
      return '<button class="chip' + (ui.finRange === x[0] ? ' active' : '') + '" data-act="finRange" data-r="' + x[0] + '">' + x[1] + '</button>';
    }).join('') + '</div>';
    h += '<div class="card" style="padding:8px 10px;margin-bottom:12px"><div class="datebar"><button class="btn icon ghost" data-act="finShift" data-n="-1">' + ic('right') + '</button><div class="title" style="cursor:default">' + r[2] + '</div>' +
      '<button class="btn icon ghost" data-act="finShift" data-n="1"' + (ui.finOffset >= 0 ? ' disabled' : '') + '>' + ic('left') + '</button></div></div>';
    h += '<div class="grid g4">' + stat('دریافتی', money(income), 'تومان') + stat('کارکرد (درمان‌های انجام‌شده)', money(work), 'تومان') +
      stat('نوبت انجام‌شده', fa(cnt('done')), 'از ' + fa(aps.filter(ACTIVE_ST).length)) + stat('لغو / عدم مراجعه', fa(cnt('cancelled')) + ' / ' + fa(cnt('noshow')), fa(newP) + ' بیمار جدید') + '</div>';

    function bars(title, obj, fmt) {
      var keys = Object.keys(obj).sort(function (x, y) { return obj[y] - obj[x]; }), mx = Math.max.apply(null, keys.map(function (k) { return obj[k]; }).concat([1]));
      return '<div class="card"><div class="card-title">' + title + '</div>' + (keys.length ? keys.slice(0, 8).map(function (k) {
        return '<div class="bar-row"><div class="lb ellipsis">' + esc(k) + '</div><div class="tr"><div class="fl" style="width:' + (obj[k] / mx * 100) + '%"></div></div><div class="vl num">' + fmt(obj[k]) + '</div></div>';
      }).join('') : '<div class="muted small">داده‌ای در این بازه نیست</div>') + '</div>';
    }
    var byMethod = {}; Object.keys(byM).forEach(function (k) { byMethod[METHODS[k] || k] = byM[k]; });
    h += '<div class="grid g3" style="margin-top:12px">' + bars('دریافتی به تفکیک روش', byMethod, money) + bars('کارکرد به تفکیک پزشک', byD, money) + bars('خدمات انجام‌شده', bySvc, fa) + '</div>';

    var bal = allBalances(), debtors = Object.keys(bal).filter(function (k) { return bal[k] > 0 && S.get('patients', k); }).sort(function (x, y) { return bal[y] - bal[x]; });
    h += '<div class="grid g2" style="margin-top:12px"><div class="card"><div class="card-title">پرداخت‌های این بازه<button class="btn sm act" data-act="exportPays">' + ic('download') + 'خروجی اکسل</button></div>';
    h += pays.length ? '<div class="tbl-wrap" style="max-height:380px;overflow:auto"><table class="tbl"><tr><th>تاریخ</th><th>بیمار</th><th>روش</th><th>مبلغ</th></tr>' + pays.sort(function (x, y) { return String(y.date).localeCompare(String(x.date)); }).map(function (p) {
      return '<tr data-act="openPatient" data-id="' + p.patientId + '" style="cursor:pointer"><td class="num">' + J.jStr(p.date) + '</td><td>' + esc(pName(p.patientId)) + '</td><td>' + (METHODS[p.method] || '') + '</td><td class="num">' + money(p.amount) + '</td></tr>';
    }).join('') + '</table></div>' : '<div class="muted small">پرداختی ثبت نشده</div>';
    h += '</div><div class="card"><div class="card-title">بدهکاران (کل)<span class="badge bad act">' + fa(debtors.length) + ' نفر</span></div>';
    h += debtors.length ? '<div class="list" style="max-height:380px;overflow:auto">' + debtors.slice(0, 100).map(function (k) {
      var p = S.get('patients', k);
      return '<div class="li" data-act="openPatient" data-id="' + k + '"><div class="grow"><div class="t">' + esc(p.name) + '</div><div class="s num">' + fa(p.phone || '') + '</div></div><b class="num" style="color:var(--danger)">' + money(bal[k]) + '</b></div>';
    }).join('') + '</div>' : '<div class="muted small">بدهکاری وجود ندارد 👌</div>';
    h += '</div></div>';
    return h;
  };

  // ================= لیست انتظار =================
  VIEWS.waitlist = function () {
    var wl = S.all('waitlist').sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); });
    var h = '<div class="small muted" style="margin-bottom:10px">بیمارانی که منتظر خالی‌شدن نوبت هستند. وقتی نوبتی لغو شد، از اینجا با آن‌ها تماس بگیرید.</div><div class="card" style="padding:4px 12px">';
    if (!wl.length) return h + '<div class="empty">' + ic('hourglass') + 'لیست انتظار خالی است</div></div>';
    h += '<div class="list">' + wl.map(function (w, i) {
      return '<div class="li" style="cursor:default"><div class="avatar">' + fa(i + 1) + '</div><div class="grow"><div class="t">' + esc(w.name) + '</div><div class="s">' +
        esc([fa(w.phone), w.service ? svcName(w.service) : '', w.pref, w.note].filter(Boolean).join(' · ')) + '</div><div class="tiny muted">ثبت: ' + (w.createdAt ? J.jStr(J.iso(new Date(w.createdAt))) : '') + '</div></div>' +
        '<div class="row">' + (w.phone ? '<button class="btn sm icon" data-act="call" data-p="' + esc(w.phone) + '">' + ic('phone') + '</button>' : '') +
        '<button class="btn sm" data-act="waitToAppt" data-id="' + w.id + '">نوبت</button><button class="btn sm icon ghost" data-act="editWait" data-id="' + w.id + '">' + ic('edit') + '</button></div></div>';
    }).join('') + '</div></div>';
    return h;
  };

  // ================= پروفایل / تنظیمات =================
  function mi(act, attrs, icon, cls, label, hint) {
    return '<button class="mi" data-act="' + act + '"' + (attrs || '') + '><span class="ic ' + (cls || '') + '">' + ic(icon) + '</span><span class="lb">' + label + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</span>' + ic('left', ' class="chev"') + '</button>';
  }
  VIEWS.more = function () {
    var st = settings(), me = myName();
    var h = '<div class="card"><div class="prof"><div class="avatar lg">' + esc(initials(me)) + '</div><div class="grow"><div class="nm">' + esc(me) + '</div><div class="small muted">' + esc(st.clinicName) + '</div>' +
      '<div class="tiny muted">' + (S.user ? roleName(role()) + ' · ' + esc(S.user.username) : 'حالت محلی · فقط همین دستگاه') + '</div></div><button class="icon-pill" data-act="setTab" data-t="clinic" title="ویرایش">' + ic('edit') + '</button></div></div>';
    h += '<div class="sec-h"><b>مطب</b></div><div class="card menu">' +
      mi('setTab', ' data-t="clinic"', 'home', '', 'اطلاعات مطب', esc(st.phone ? fa(st.phone) : 'نام، تلفن و آدرس')) +
      mi('setTab', ' data-t="hours"', 'clock', 'c5', 'ساعات کاری', fa(st.start) + ' تا ' + fa(st.end)) +
      mi('setTab', ' data-t="doctors"', 'user', 'c3', 'پزشکان', fa(doctors().length) + ' پزشک فعال') +
      mi('nav', ' data-v="services"', 'tooth', 'c4', 'خدمات و تعرفه‌ها', fa(services().length) + ' خدمت') +
      mi('nav', ' data-v="waitlist"', 'hourglass', '', 'لیست انتظار', fa(S.all('waitlist').length) + ' نفر') + '</div>';
    h += '<div class="sec-h"><b>ارتباط و داده‌ها</b></div><div class="card menu">' +
      mi('setTab', ' data-t="sms"', 'sms', '', 'متن پیامک یادآوری', '') +
      mi('setTab', ' data-t="sync"', 'cloud', 'c3', 'همگام‌سازی و کاربران', S.mode === 'cloud' ? 'آنلاین (Supabase)' : 'حالت محلی') +
      mi('setTab', ' data-t="backup"', 'download', 'c5', 'پشتیبان‌گیری و خروجی اکسل', '') +
      mi('printDay', '', 'print', 'c4', 'چاپ برنامه امروز', '') + '</div>';
    h += '<div class="sec-h"><b>نمایش</b></div><div class="card menu"><label class="mi"><span class="ic c3">' + ic('moon') + '</span><span class="lb">حالت تیره</span>' +
      '<span class="switch"><input type="checkbox" data-chg="theme"' + (isDark() ? ' checked' : '') + '><span></span></span></label>' +
      (S.mode === 'cloud' ? mi('logout', '', 'logout', 'c6', 'خروج از حساب', '') : '') + '</div>';
    h += '<div class="tiny muted" style="text-align:center;margin-top:18px">دنتینو · نرم‌افزار نوبت‌دهی مطب</div>';
    return h;
  };

  VIEWS.settings = function () {
    return '<div class="card">' + SET[ui.setTab]() + '</div>';
  };

  // ================= خدمات =================
  var SVC_CATS = [['all', 'همه'], ['general', 'عمومی'], ['cosmetic', 'زیبایی'], ['ortho', 'ارتودنسی'], ['surgery', 'جراحی و ایمپلنت'], ['kids', 'کودکان']];
  var SVC_DESC = {
    'معاینه و مشاوره': 'معاینه کامل دهان و دندان و ارائه طرح درمان', 'جرم‌گیری و بروساژ': 'پاکسازی جرم و پلاک و براق کردن سطح دندان‌ها',
    'ترمیم کامپوزیت': 'پر کردن دندان با مواد هم‌رنگ دندان', 'ترمیم آمالگام': 'پر کردن دندان‌های عقب با آمالگام', 'عصب‌کشی (درمان ریشه)': 'درمان ریشه و حفظ دندان آسیب‌دیده',
    'کشیدن دندان': 'خارج کردن دندان غیرقابل نگهداری', 'جراحی دندان عقل': 'جراحی و خارج کردن دندان عقل نهفته', 'روکش': 'پوشش و محافظت از دندان ضعیف یا درمان‌شده',
    'ایمپلنت': 'جایگزینی دائمی دندان ازدست‌رفته', 'بلیچینگ (سفید کردن)': 'روشن‌تر کردن رنگ دندان‌ها به‌صورت ایمن', 'ارتودنسی - ویزیت': 'کنترل و تنظیم براکت یا الاینر',
    'دندانپزشکی کودکان': 'درمان و مراقبت از دندان‌های شیری', 'رادیوگرافی': 'عکس دندان برای تشخیص دقیق‌تر'
  };
  function svcCat(s) {
    if (s.category) return s.category;
    var n = s.name || '';
    if (/ارتودنسی|براکت|الاینر/.test(n)) return 'ortho';
    if (/ایمپلنت|جراحی|کشیدن|عقل/.test(n)) return 'surgery';
    if (/بلیچ|سفید|لمینت|ونیر|جرم|بروساژ/.test(n)) return 'cosmetic';
    if (/کودک/.test(n)) return 'kids';
    return 'general';
  }
  function svcKind(s) {
    var n = s.name || '', c = svcCat(s);
    if (/ایمپلنت/.test(n)) return 'implant';
    if (c === 'cosmetic') return /جرم|بروساژ/.test(n) ? 'clean' : 'white';
    return { ortho: 'ortho', surgery: 'surgery', kids: 'kids' }[c] || 'general';
  }
  VIEWS.services = function () {
    var q = normText(ui.sq || ''), cat = ui.scat || 'all';
    var list = services().filter(function (s) { return (cat === 'all' || svcCat(s) === cat) && (!q || normText(s.name).indexOf(q) > -1); });
    var h = '<div class="search">' + ic('search') + '<input class="input" id="sq" data-in="sq" placeholder="جستجوی خدمت…" value="' + esc(ui.sq || '') + '"></div>';
    h += '<div class="chips" style="margin:14px 0 14px">' + SVC_CATS.map(function (c) { return '<button class="chip' + (cat === c[0] ? ' active' : '') + '" data-act="svcCat" data-c="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>';
    if (!list.length) return h + '<div class="card"><div class="empty">' + ic('tooth') + 'خدمتی پیدا نشد</div></div>';
    h += '<div class="grid g2 svc-grid">' + list.map(function (s) {
      return '<div class="card svc" data-act="editService" data-id="' + s.id + '"><div class="art">' + toothSVG({ kind: svcKind(s) }) + '</div><div class="grow"><div class="nm">' + esc(s.name) + '</div>' +
        '<div class="ds">' + esc(s.desc || SVC_DESC[s.name] || '') + '</div><div class="pr num">' + (s.price ? money(s.price) + ' <small>تومان</small>' : '<small>تعرفه ثبت نشده</small>') + ' <small>· ' + fa(s.duration || 30) + ' دقیقه</small></div></div>' +
        '<button class="circle-btn" data-act="svcBook" data-id="' + s.id + '" title="رزرو نوبت">' + ic('left') + '</button></div>';
    }).join('') + '</div>';
    return h;
  };

  var SET = {};
  SET.clinic = function () {
    var s = settings();
    return '<div class="stack"><label class="f"><span>نام مطب</span><input class="input" id="s_name" value="' + esc(s.clinicName) + '"></label>' +
      '<label class="f"><span>نام شما (برای خوش‌آمدگویی صفحه خانه)</span><input class="input" id="s_greet" placeholder="مثلاً: خانم احمدی" value="' + esc(s.greetName || '') + '"></label>' +
      '<label class="f"><span>تلفن مطب</span><input class="input ltr" id="s_phone" inputmode="tel" value="' + esc(s.phone) + '"></label>' +
      '<label class="f"><span>آدرس</span><textarea class="input" id="s_addr">' + esc(s.address) + '</textarea></label>' +
      '<button class="btn primary" data-act="saveClinic">ذخیره</button></div>';
  };
  SET.hours = function () {
    var s = settings(), days = [[6, 'شنبه'], [0, 'یکشنبه'], [1, 'دوشنبه'], [2, 'سه‌شنبه'], [3, 'چهارشنبه'], [4, 'پنجشنبه'], [5, 'جمعه']];
    return '<div class="stack"><div class="grid g2 keep"><label class="f"><span>شروع کار</span><input class="input ltr" type="time" id="s_start" value="' + s.start + '"></label>' +
      '<label class="f"><span>پایان کار</span><input class="input ltr" type="time" id="s_end" value="' + s.end + '"></label>' +
      '<label class="f"><span>شروع استراحت (اختیاری)</span><input class="input ltr" type="time" id="s_bs" value="' + (s.breakStart || '') + '"></label>' +
      '<label class="f"><span>پایان استراحت</span><input class="input ltr" type="time" id="s_be" value="' + (s.breakEnd || '') + '"></label></div>' +
      '<label class="f"><span>فاصله زمانی نوبت‌ها</span><select class="input" id="s_slot">' + [10, 15, 20, 30].map(function (n) { return '<option value="' + n + '"' + (+s.slot === n ? ' selected' : '') + '>' + fa(n) + ' دقیقه</option>'; }).join('') + '</select></label>' +
      '<div><div class="small muted" style="margin-bottom:4px">روزهای کاری</div><div class="daychips">' + days.map(function (d) {
        return '<label><input type="checkbox" class="s_day" value="' + d[0] + '"' + (s.workDays.indexOf(d[0]) > -1 ? ' checked' : '') + '>' + d[1] + '</label>';
      }).join('') + '</div></div><button class="btn primary" data-act="saveHours">ذخیره</button></div>';
  };
  SET.doctors = function () {
    var docs = doctors(true);
    return '<div class="row" style="margin-bottom:8px"><div class="grow small muted">هر پزشک یک ستون در تقویم دارد.</div><button class="btn sm primary" data-act="editDoctor">' + ic('plus') + 'پزشک جدید</button></div><div class="list">' +
      docs.map(function (d) {
        return '<div class="li" data-act="editDoctor" data-id="' + d.id + '"><span class="dot" style="background:' + d.color + ';width:14px;height:14px"></span><div class="grow"><div class="t">' + esc(d.name) + '</div><div class="s">' + esc(d.specialty || '') + '</div></div>' +
          (d.active === false ? '<span class="badge st-cancelled">غیرفعال</span>' : '') + '</div>';
      }).join('') + '</div>';
  };
  SET.services = function () {
    return '<div class="row" style="margin-bottom:8px"><div class="grow small muted">مدت و تعرفه پیش‌فرض هر خدمت هنگام ثبت نوبت و درمان خودکار پر می‌شود.</div><button class="btn sm primary" data-act="editService">' + ic('plus') + 'خدمت جدید</button></div><div class="list">' +
      services().map(function (s) {
        return '<div class="li" data-act="editService" data-id="' + s.id + '"><div class="grow"><div class="t">' + esc(s.name) + '</div><div class="s num">' + fa(s.duration || 30) + ' دقیقه</div></div><div class="num small">' + (s.price ? money(s.price) + ' تومان' : '<span class="muted">بدون تعرفه</span>') + '</div></div>';
      }).join('') + '</div>';
  };
  SET.sms = function () {
    var s = settings();
    return '<div class="stack"><label class="f"><span>متن پیامک یادآوری</span><textarea class="input" id="s_sms" style="min-height:120px">' + esc(s.smsTemplate) + '</textarea></label>' +
      '<div class="tiny muted">متغیرها: {نام} {روز} {تاریخ} {ساعت} {پزشک} {خدمت} {مطب}</div>' +
      '<div class="tiny muted">پیامک از طریق برنامه پیامک خود گوشی و سیم‌کارت مطب ارسال می‌شود (هزینه طبق تعرفه اپراتور).</div><button class="btn primary" data-act="saveSms">ذخیره</button></div>';
  };
  SET.sync = function () {
    var c = S.cfg() || {};
    var h = '';
    if (S.mode === 'cloud') {
      h += '<div class="row" style="margin-bottom:12px">' + syncIndicator() + '<div class="grow"></div><button class="btn sm" data-act="syncNow">همگام‌سازی الان</button><button class="btn sm danger" data-act="logout">' + ic('logout') + 'خروج</button></div>';
      h += '<div class="small">کاربر فعلی: <b>' + esc(S.user ? S.user.username : '') + '</b> (' + roleName(role()) + ')</div>';
      h += '<div class="row wrap" style="margin-top:8px"><button class="btn sm" data-act="changePw">تغییر رمز من</button></div>';
      if (isAdmin()) {
        var staff = S.all('staff');
        h += '<hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><div class="row" style="margin-bottom:6px"><b class="grow">کاربران</b><button class="btn sm primary" data-act="newUser">' + ic('plus') + 'کاربر جدید</button></div>';
        h += '<div class="list">' + staff.map(function (u) {
          return '<div class="li" data-act="editStaff" data-id="' + u.id + '"><div class="avatar">' + esc(initials(u.name || u.id)) + '</div><div class="grow"><div class="t">' + esc(u.name || u.id) + '</div><div class="s ltr" style="direction:ltr;text-align:right">' + esc(u.id) + '</div></div><span class="badge st-confirmed">' + roleName(u.role) + '</span></div>';
        }).join('') + '</div>';
      }
    } else {
      h += '<div class="note-box" style="margin-bottom:12px">برنامه الان در «حالت محلی» است: داده‌ها فقط روی همین دستگاه ذخیره می‌شوند. برای استفاده هم‌زمان منشی و پزشک روی چند گوشی/کامپیوتر، به Supabase وصل شوید (راهنما در فایل README).</div>';
    }
    h += '<details' + (S.mode === 'cloud' ? '' : ' open') + ' style="margin-top:14px"><summary class="small" style="cursor:pointer;font-weight:600">تنظیمات اتصال Supabase</summary><div class="stack" style="margin-top:10px">' +
      '<label class="f"><span>Project URL</span><input class="input ltr" id="c_url" placeholder="https://xxxx.supabase.co" value="' + esc(c.url || '') + '"></label>' +
      '<label class="f"><span>anon public key</span><input class="input ltr" id="c_key" value="' + esc(c.key || '') + '"></label>' +
      '<div class="row wrap"><button class="btn primary" data-act="saveCloud">ذخیره و اتصال</button>' + (S.mode === 'cloud' ? '<button class="btn danger" data-act="disconnectCloud">قطع اتصال</button>' : '') + '</div>' +
      (S.mode !== 'cloud' ? '<div class="tiny muted">نکته: داده‌هایی که الان در حالت محلی دارید، بعد از اتصال و ورود به حساب ابری منتقل می‌شوند.</div>' : '') + '</div></details>';
    return h;
  };
  function roleName(r) { return { admin: 'مدیر', secretary: 'منشی', doctor: 'پزشک' }[r] || 'منشی'; }
  SET.backup = function () {
    return '<div class="stack"><div class="small muted">از همه اطلاعات (بیماران، نوبت‌ها، درمان‌ها، پرداخت‌ها و تنظیمات) یک فایل پشتیبان بگیرید و جای امن نگه دارید.</div>' +
      '<div class="row wrap"><button class="btn primary" data-act="backup">' + ic('download') + 'دریافت فایل پشتیبان</button><button class="btn" data-act="restore">' + ic('upload') + 'بازیابی از فایل</button></div>' +
      '<hr style="border:0;border-top:1px solid var(--line);margin:8px 0"><div class="small muted">خروجی اکسل (CSV)</div><div class="row wrap">' +
      '<button class="btn" data-act="exportPatients">' + ic('file') + 'لیست بیماران</button><button class="btn" data-act="exportAppts">' + ic('file') + 'همه نوبت‌ها</button><button class="btn" data-act="exportPays">' + ic('file') + 'پرداخت‌ها</button></div>' +
      '<input type="file" id="restoreFile" accept=".json,application/json" class="hidden"></div>';
  };

  // ================= مودال =================
  function openModal(o) {
    var ov = document.createElement('div'); ov.className = 'overlay';
    var head = o.full
      ? '<div class="modal-h"><button class="icon-pill" data-act="closeModal" title="بازگشت">' + ic('right') + '</button><h3>' + o.title + '</h3><span></span></div>'
      : '<div class="modal-h"><h3>' + o.title + '</h3><button class="btn icon ghost" data-act="closeModal">' + ic('x') + '</button></div>';
    ov.innerHTML = '<div class="modal' + (o.wide ? ' wide' : '') + (o.full ? ' full' : '') + '">' + head +
      '<div class="modal-b">' + o.body + '</div>' + (o.foot ? '<div class="modal-f">' + o.foot + '</div>' : '') + '</div>';
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeModal(); });
    document.body.appendChild(ov);
    var m = { el: ov, o: o }; modals.push(m);
    if (o.onMount) o.onMount(ov);
    if (window.Android && Android.setBackHandler) Android.setBackHandler(true);
    return m;
  }
  function closeModal() { var m = modals.pop(); if (m) { m.el.remove(); if (m.o.onClose) m.o.onClose(); } }
  function closeAll() { while (modals.length) closeModal(); }
  function confirmBox(msg, okLabel, cb, danger) {
    openModal({ title: 'تأیید', body: '<div>' + msg + '</div>', foot: '<button class="btn ' + (danger ? 'danger' : 'primary') + '" id="cfOk">' + (okLabel || 'تأیید') + '</button><button class="btn ghost" data-act="closeModal">انصراف</button>',
      onMount: function (el) { $('#cfOk', el).onclick = function () { closeModal(); cb(); }; } });
  }
  // انتخاب تاریخ شمسی
  function datePicker(cur, cb) {
    var j = J.toJ(cur || J.today()), vy = j[0], vm = j[1];
    var counts = {}; appts().forEach(function (a) { if (ACTIVE_ST(a)) counts[a.date] = (counts[a.date] || 0) + 1; });
    var m = openModal({ title: 'انتخاب تاریخ', body: '<div id="dpBody"></div>', foot: '<button class="btn" id="dpToday">امروز</button><button class="btn ghost" data-act="closeModal">بستن</button>' });
    function draw() {
      var first = J.fromJ(vy, vm, 1), col = J.faCol(first), len = J.monthLen(vy, vm);
      var h = '<div class="datebar" style="margin-bottom:8px"><button class="btn icon ghost" id="dpPrev">' + ic('right') + '</button><div class="title" style="cursor:default">' + J.MONTHS[vm - 1] + ' ' + fa(vy) + '</div><button class="btn icon ghost" id="dpNext">' + ic('left') + '</button></div>';
      h += '<div class="month">' + ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(function (x) { return '<div class="h">' + x + '</div>'; }).join('');
      for (var i = 0; i < col; i++) h += '<div></div>';
      for (var d = 1; d <= len; d++) {
        var iso = J.fromJ(vy, vm, d);
        h += '<div class="d' + (iso === cur ? ' sel' : '') + (iso === J.today() ? ' today' : '') + (J.weekday(iso) === 5 ? ' fri' : '') + '" data-dp="' + iso + '"><span class="n">' + fa(d) + '</span><span class="c">' + (counts[iso] ? fa(counts[iso]) : '') + '</span></div>';
      }
      h += '</div><div class="tiny muted" style="margin-top:6px">عدد کوچک = تعداد نوبت‌های آن روز</div>';
      $('#dpBody', m.el).innerHTML = h;
      $('#dpPrev', m.el).onclick = function () { vm--; if (vm < 1) { vm = 12; vy--; } draw(); };
      $('#dpNext', m.el).onclick = function () { vm++; if (vm > 12) { vm = 1; vy++; } draw(); };
      $$('[data-dp]', m.el).forEach(function (el) { el.onclick = function () { closeModal(); cb(el.getAttribute('data-dp')); }; });
    }
    $('#dpToday', m.el).onclick = function () { closeModal(); cb(J.today()); };
    draw();
  }

  // ---------- فرم نوبت ----------
  function apptForm(a, preset) {
    preset = preset || {};
    var isNew = !a;
    var st = settings(), docs = doctors(), svcs = services();
    a = a ? Object.assign({}, a) : {
      patientId: preset.pid || null, doctorId: preset.doc || (ui.doc !== 'all' ? ui.doc : (docs[0] && docs[0].id)), date: preset.date || ui.date,
      time: preset.time || '', duration: 30, serviceId: preset.svc || '', status: 'booked', notes: preset.notes || ''
    };
    if (isNew && a.serviceId) { var ps = S.get('services', a.serviceId); if (ps && ps.duration) a.duration = +ps.duration; }
    var newP = preset.newName ? { name: preset.newName, phone: preset.newPhone || '' } : null;
    var durs = [10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180];
    if (durs.indexOf(+a.duration) < 0) durs.push(+a.duration);
    durs.sort(function (x, y) { return x - y; });
    var body =
      '<div id="afPatient" class="bk-sec"></div>' +
      '<div class="bk-sec"><div class="f-l">خدمت</div><div class="chips" id="afSvcs"></div><input type="hidden" id="afSvc"></div>' +
      '<div class="bk-sec"><div class="f-l">تاریخ</div><div class="card cal-card" id="afCal"></div></div>' +
      '<div class="bk-sec"><div class="row" style="margin-bottom:10px"><div class="f-l grow" style="margin:0">ساعت‌های خالی</div>' +
      '<select class="input" id="afDur" style="width:auto;min-height:36px;padding:4px 12px;border-radius:999px;font-size:13px">' + durs.map(function (n) { return '<option value="' + n + '"' + (+a.duration === n ? ' selected' : '') + '>' + fa(n) + ' دقیقه</option>'; }).join('') + '</select></div>' +
      '<div class="timepick" id="afSlots"></div><div class="row tiny muted" style="margin-top:10px">ساعت دلخواه:<input class="input ltr num" id="afTime" type="time" style="width:130px;min-height:36px;padding:4px 10px" value="' + (a.time || '') + '"></div></div>' +
      '<div id="afWarn" class="bk-sec"></div>' +
      '<div class="bk-sec"><div class="f-l">پزشک</div><div id="afDocs"></div><input type="hidden" id="afDoc"></div>' +
      (isNew ? '' : '<div class="bk-sec"><label class="f"><span>وضعیت</span><select class="input" id="afSt">' + STATUS_ORDER.map(function (s) { return '<option value="' + s + '"' + (s === a.status ? ' selected' : '') + '>' + STATUS[s] + '</option>'; }).join('') + '</select></label></div>') +
      '<div class="bk-sec"><label class="f"><span>یادداشت</span><textarea class="input" id="afNotes" placeholder="مثلاً: درد دندان ۳۶، نیاز به عکس">' + esc(a.notes || '') + '</textarea></label></div>';
    var m = openModal({
      full: true, title: isNew ? 'رزرو نوبت' : 'ویرایش نوبت', body: body,
      foot: '<button class="btn cta" id="afSave">' + (isNew ? 'تأیید نوبت' : 'ذخیره تغییرات') + '<span class="arr">' + ic('check') + '</span></button>'
    });
    var el = m.el;
    $('#afDoc', el).value = a.doctorId || '';
    $('#afSvc', el).value = a.serviceId || '';
    var cj = J.toJ(a.date), vy = cj[0], vm = cj[1];

    function drawPatient() {
      var box = $('#afPatient', el);
      if (a.patientId) {
        var p = S.get('patients', a.patientId) || {};
        box.innerHTML = '<div class="f-l">بیمار</div><div class="sel-patient"><div class="avatar">' + esc(initials(p.name)) + '</div><div class="grow"><b>' + esc(p.name) + '</b><div class="tiny muted num">' + fa(p.phone || '') + ' · پرونده ' + fa(p.fileNo || '') + '</div></div><button class="btn sm ghost" id="afChange">تغییر</button></div>' +
          (p.alerts ? '<div class="alert-box" style="margin-top:8px">' + ic('alert') + '<div>' + esc(p.alerts) + '</div></div>' : '');
        $('#afChange', el).onclick = function () { a.patientId = null; drawPatient(); };
      } else if (newP) {
        box.innerHTML = '<div class="row" style="margin-bottom:6px"><div class="f-l grow" style="margin:0">بیمار جدید</div><button class="btn sm ghost" id="afBack">جستجوی بیمار موجود</button></div><div class="grid g2 keep">' +
          '<input class="input" id="afNName" placeholder="نام و نام خانوادگی" value="' + esc(newP.name) + '"><input class="input ltr" id="afNPhone" inputmode="tel" placeholder="موبایل" value="' + esc(newP.phone) + '"></div>';
        $('#afBack', el).onclick = function () { newP = null; drawPatient(); };
        $('#afNName', el).oninput = function () { newP.name = this.value; };
        $('#afNPhone', el).oninput = function () { newP.phone = this.value; };
        setTimeout(function () { $('#afNName', el).focus(); }, 50);
      } else {
        box.innerHTML = '<div class="f-l">بیمار</div><div class="search">' + ic('search') + '<input class="input" id="afQ" placeholder="نام، موبایل یا شماره پرونده…" autocomplete="off"></div><div id="afRes"></div>';
        var q = $('#afQ', el);
        q.oninput = function () {
          var t = normText(q.value), d = digitsOnly(q.value), res = $('#afRes', el);
          if (!t) { res.innerHTML = ''; return; }
          var list = patients().filter(function (p) { return normText(p.name).indexOf(t) > -1 || (d && digitsOnly(p.phone).indexOf(d) > -1) || String(p.fileNo) === d; }).slice(0, 8);
          res.innerHTML = '<div class="ac-list">' + list.map(function (p) { return '<div class="ac-item" data-pid="' + p.id + '"><b>' + esc(p.name) + '</b> <span class="tiny muted num">' + fa(p.phone || '') + ' · پرونده ' + fa(p.fileNo || '') + '</span></div>'; }).join('') +
            '<div class="ac-item" data-new="1" style="color:var(--primary);font-weight:800">+ ثبت «' + esc(q.value) + '» به عنوان بیمار جدید</div></div>';
          $$('.ac-item', res).forEach(function (it) {
            it.onclick = function () {
              if (it.getAttribute('data-new')) { var isNum = /^\d+$/.test(d) && d.length >= 4 && !t.replace(/[\d\s]/g, ''); newP = { name: isNum ? '' : q.value, phone: isNum ? q.value : '' }; }
              else a.patientId = it.getAttribute('data-pid');
              drawPatient(); checkConflict();
            };
          });
        };
        if (isNew && !preset.time) setTimeout(function () { q.focus(); }, 80);
      }
    }
    function drawSvcs() {
      $('#afSvcs', el).innerHTML = '<button type="button" class="chip' + (!a.serviceId ? ' active' : '') + '" data-s="">بدون خدمت</button>' +
        svcs.map(function (s) { return '<button type="button" class="chip' + (s.id === a.serviceId ? ' active' : '') + '" data-s="' + s.id + '">' + esc(s.name) + '</button>'; }).join('');
      $$('#afSvcs .chip', el).forEach(function (b) {
        b.onclick = function () {
          a.serviceId = b.getAttribute('data-s'); $('#afSvc', el).value = a.serviceId;
          var s = S.get('services', a.serviceId);
          if (s && s.duration) {
            var sel = $('#afDur', el);
            if (!$$('option', sel).some(function (o) { return +o.value === +s.duration; })) sel.insertAdjacentHTML('beforeend', '<option value="' + s.duration + '">' + fa(s.duration) + ' دقیقه</option>');
            sel.value = s.duration;
          }
          drawSvcs(); drawSlots();
        };
      });
      var on = $('#afSvcs .chip.active', el); if (on && on.scrollIntoView && a.serviceId) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
    function drawCal() {
      var first = J.fromJ(vy, vm, 1), col = J.faCol(first), len = J.monthLen(vy, vm), today = J.today(), doc = $('#afDoc', el).value;
      var counts = {}; appts().forEach(function (x) { if (ACTIVE_ST(x) && x.doctorId === doc) counts[x.date] = (counts[x.date] || 0) + 1; });
      var h = '<div class="datebar" style="margin-bottom:6px"><button type="button" class="btn icon ghost" id="acPrev">' + ic('right') + '</button><div class="title" style="cursor:default">' + J.MONTHS[vm - 1] + ' ' + fa(vy) + '</div><button type="button" class="btn icon ghost" id="acNext">' + ic('left') + '</button></div>';
      h += '<div class="month">' + ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(function (x) { return '<div class="h">' + x + '</div>'; }).join('');
      for (var i = 0; i < col; i++) h += '<div></div>';
      for (var d = 1; d <= len; d++) {
        var iso = J.fromJ(vy, vm, d);
        h += '<button type="button" class="d' + (iso === a.date ? ' sel' : '') + (iso === today ? ' today' : '') + (J.weekday(iso) === 5 ? ' fri' : '') + (iso < today ? ' past' : '') + (counts[iso] ? ' has' : '') + '" data-dp="' + iso + '" title="' + (counts[iso] ? fa(counts[iso]) + ' نوبت' : '') + '"><span class="n">' + fa(d) + '</span><span class="c"></span></button>';
      }
      h += '</div>';
      $('#afCal', el).innerHTML = h;
      $('#acPrev', el).onclick = function () { vm--; if (vm < 1) { vm = 12; vy--; } drawCal(); };
      $('#acNext', el).onclick = function () { vm++; if (vm > 12) { vm = 1; vy++; } drawCal(); };
      $$('#afCal [data-dp]', el).forEach(function (b) { b.onclick = function () { a.date = b.getAttribute('data-dp'); drawCal(); drawDocs(); drawSlots(); }; });
    }
    function drawDocs() {
      var doc = $('#afDoc', el).value;
      $('#afDocs', el).innerHTML = docs.map(function (d) {
        var n = apptsOn(a.date).filter(function (x) { return x.doctorId === d.id && ACTIVE_ST(x) && x.id !== a.id; }).length;
        return '<div class="doc-card' + (d.id === doc ? ' on' : '') + '" data-doc="' + d.id + '"><div class="avatar" style="background:' + d.color + '">' + esc(initials(d.name.replace(/^دکتر\s*/, ''))) + '</div>' +
          '<div class="grow"><b>' + esc(d.name) + '</b><div class="tiny muted">' + esc(d.specialty || '') + (d.specialty ? ' · ' : '') + (n ? fa(n) + ' نوبت در این روز' : 'روز خالی') + '</div></div><span class="chk">' + ic('check') + '</span></div>';
      }).join('');
      $$('#afDocs .doc-card', el).forEach(function (c) { c.onclick = function () { $('#afDoc', el).value = a.doctorId = c.getAttribute('data-doc'); drawDocs(); drawCal(); drawSlots(); }; });
    }
    function drawSlots() {
      var start = t2m(st.start), end = t2m(st.end), slot = +st.slot || 15, dur = +$('#afDur', el).value;
      var bs = st.breakStart ? t2m(st.breakStart) : -1, be = st.breakEnd ? t2m(st.breakEnd) : -1;
      var busy = apptsOn(a.date).filter(function (x) { return x.id !== a.id && x.doctorId === $('#afDoc', el).value && ACTIVE_ST(x) && x.status !== 'noshow'; });
      var h = '', isToday = a.date === J.today(), nm = nowMin(), free = 0;
      for (var m = start; m < end; m += slot) {
        if (bs >= 0 && m >= bs && m < be && m2t(m) !== a.time) continue;
        var e = m + dur, clash = busy.some(function (x) { var s = t2m(x.time), xe = s + (+x.duration || 30); return m < xe && e > s; });
        if (isToday && m < nm - slot && m2t(m) !== a.time) continue;
        if (!clash) free++;
        h += '<button type="button" class="num' + (clash ? ' busy' : '') + (m2t(m) === a.time ? ' on' : '') + '" data-t="' + m2t(m) + '">' + fa(m2t(m)) + '</button>';
      }
      $('#afSlots', el).innerHTML = h || '<div class="tiny muted" style="grid-column:1/-1">ساعتی باقی نمانده؛ ساعت را دستی وارد کنید.</div>';
      $$('#afSlots button', el).forEach(function (b) { b.onclick = function () { a.time = b.getAttribute('data-t'); $('#afTime', el).value = a.time; drawSlots(); }; });
      checkConflict();
    }
    function checkConflict() {
      var w = $('#afWarn', el), doc = $('#afDoc', el).value, dur = +$('#afDur', el).value;
      var msgs = [];
      if (settings().workDays.indexOf(J.weekday(a.date)) < 0) msgs.push('این روز تعطیل مطب است');
      if (a.time) {
        var s = t2m(a.time), e = s + dur;
        var c = apptsOn(a.date).filter(function (x) { return x.id !== a.id && x.doctorId === doc && ACTIVE_ST(x) && x.status !== 'noshow'; }).filter(function (x) { var xs = t2m(x.time), xe = xs + (+x.duration || 30); return s < xe && e > xs; });
        if (c.length) msgs.push('تداخل با نوبت ' + c.map(function (x) { return esc(pName(x.patientId)) + ' (' + fa(x.time) + ')'; }).join('، '));
      }
      if (a.patientId) {
        var other = apptsOn(a.date).filter(function (x) { return x.id !== a.id && x.patientId === a.patientId && ACTIVE_ST(x); });
        if (other.length) msgs.push('این بیمار در همین روز نوبت دیگری هم دارد (' + other.map(function (x) { return fa(x.time); }).join('، ') + ')');
      }
      w.innerHTML = msgs.length ? '<div class="note-box">' + msgs.join('<br>') + '</div>' : '';
      w.style.display = msgs.length ? '' : 'none';
    }
    drawPatient(); drawSvcs(); drawCal(); drawDocs(); drawSlots();
    $('#afDur', el).onchange = drawSlots;
    $('#afTime', el).onchange = function () { a.time = this.value; drawSlots(); };
    if (a.time) setTimeout(function () { var on = $('#afSlots button.on', el); if (on) on.scrollIntoView({ block: 'nearest' }); }, 60);
    $('#afSave', el).onclick = function () {
      if (!a.patientId) {
        if (!newP || !newP.name.trim()) { toast('بیمار را انتخاب یا ثبت کنید'); $('#afPatient', el).scrollIntoView({ behavior: 'smooth' }); return; }
        var dup = newP.phone && patients().find(function (p) { return normPhone(p.phone) === normPhone(newP.phone); });
        if (dup) { a.patientId = dup.id; toast('بیمار با این شماره قبلاً ثبت شده بود: ' + dup.name); }
        else a.patientId = S.save('patients', { name: newP.name.trim(), phone: normPhone(newP.phone), fileNo: nextFileNo() }).id;
      }
      a.time = $('#afTime', el).value || a.time;
      if (!a.time) { toast('ساعت نوبت را انتخاب کنید'); $('#afSlots', el).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (!$('#afDoc', el).value) { toast('پزشک را انتخاب کنید'); return; }
      a.doctorId = $('#afDoc', el).value; a.serviceId = $('#afSvc', el).value; a.duration = +$('#afDur', el).value; a.notes = $('#afNotes', el).value.trim();
      if (!isNew) a.status = $('#afSt', el).value;
      if (preset.waitId) S.remove('waitlist', preset.waitId);
      var saved = S.save('appointments', a);
      closeModal();
      ui.date = a.date;
      toast(isNew ? 'نوبت ثبت شد' : 'تغییرات ذخیره شد');
      if (isNew && preset.offerSms !== false) {
        var p = S.get('patients', saved.patientId);
        if (p && p.phone) setTimeout(function () { offerConfirmSms(saved); }, 150);
      }
    };
  }
  function offerConfirmSms(a) {
    var txt = smsText(a).replace('یادآوری نوبت', 'نوبت');
    openModal({ title: 'نوبت ثبت شد ✓', body: '<div class="small" style="white-space:pre-line;background:var(--surface-2);padding:10px;border-radius:10px">' + esc(txt) + '</div>',
      foot: '<button class="btn primary" id="ocS">' + ic('sms') + 'ارسال پیامک</button><button class="btn" id="ocW">' + ic('wa') + 'واتساپ</button><button class="btn ghost" data-act="closeModal">بعداً</button>',
      onMount: function (el) {
        var p = S.get('patients', a.patientId);
        $('#ocS', el).onclick = function () { closeModal(); openUrl(smsLink(p.phone, txt)); };
        $('#ocW', el).onclick = function () { closeModal(); openUrl(waLink(p.phone, txt)); };
      } });
  }

  // ---------- جزئیات نوبت ----------
  function apptDetail(id) {
    var a = S.get('appointments', id); if (!a) return;
    var p = S.get('patients', a.patientId) || {};
    var b = balanceOf(a.patientId);
    var body = '<div class="row gap-lg" style="margin-bottom:10px"><div class="avatar">' + esc(initials(p.name)) + '</div><div class="grow"><div style="font-weight:800;font-size:17px">' + esc(p.name || '—') + '</div>' +
      '<div class="small muted num">' + fa(p.phone || 'بدون شماره') + ' · پرونده ' + fa(p.fileNo || '-') + '</div></div>' + stBadge(a.status) + '</div>';
    if (p.alerts) body += '<div class="alert-box" style="margin-bottom:10px">' + ic('alert') + '<div>' + esc(p.alerts) + '</div></div>';
    body += '<div class="grid g2 keep" style="gap:10px"><div><div class="tiny muted">تاریخ و ساعت</div><b class="num">' + J.jLong(a.date) + '</b><div class="num">ساعت ' + fa(a.time) + ' (' + fa(a.duration || 30) + ' دقیقه)</div></div>' +
      '<div><div class="tiny muted">پزشک / خدمت</div><b>' + esc(dName(a.doctorId)) + '</b><div>' + esc(svcName(a.serviceId) || '—') + '</div></div></div>';
    if (a.notes) body += '<div class="note-box" style="margin-top:10px;white-space:pre-line">' + esc(a.notes) + '</div>';
    if (b.due > 0) body += '<div class="small" style="margin-top:10px">بدهی بیمار: <b class="num" style="color:var(--danger)">' + money(b.due) + ' تومان</b></div>';
    body += '<div class="small muted" style="margin:14px 0 6px">تغییر وضعیت</div><div class="row wrap">' + STATUS_ORDER.filter(function (s) { return s !== a.status; }).map(function (s) {
      return '<button class="btn sm" data-act="setStatus" data-id="' + a.id + '" data-s="' + s + '"><span class="dot" style="background:var(--' + ({ booked: 'info', confirmed: 'teal', arrived: 'warn', done: 'ok', cancelled: 'muted', noshow: 'danger' })[s] + ')"></span>' + STATUS[s] + '</button>';
    }).join('') + '</div>';
    body += '<div class="small muted" style="margin:14px 0 6px">ارتباط با بیمار</div><div class="row wrap">' + (p.phone ?
      '<button class="btn sm" data-act="call" data-p="' + esc(p.phone) + '">' + ic('phone') + 'تماس</button><button class="btn sm" data-act="sendSms" data-id="' + a.id + '">' + ic('sms') + 'پیامک یادآوری' + (a.reminded ? ' ✓' : '') + '</button>' +
      '<button class="btn sm" data-act="sendWa" data-id="' + a.id + '">' + ic('wa') + 'واتساپ</button>' : '<span class="small muted">شماره‌ای ثبت نشده</span>') + '</div>';
    if (a.updatedBy) body += '<div class="tiny muted" style="margin-top:12px">آخرین تغییر: ' + esc(a.updatedBy) + '</div>';
    openModal({ title: 'جزئیات نوبت', body: body,
      foot: '<button class="btn primary" data-act="openPatient" data-id="' + a.patientId + '">' + ic('file') + 'پرونده</button><button class="btn" data-act="editAppt" data-id="' + a.id + '">' + ic('edit') + 'ویرایش</button>' +
        '<button class="btn" data-act="nextAppt" data-id="' + a.id + '">' + ic('plus') + 'نوبت بعدی</button><div class="grow"></div><button class="btn danger icon" data-act="delAppt" data-id="' + a.id + '" title="حذف">' + ic('trash') + '</button>' });
  }

  function setStatus(id, s) {
    var a = S.get('appointments', id); if (!a) return;
    S.save('appointments', Object.assign({}, a, { status: s }));
    closeAll();
    toast('وضعیت: ' + STATUS[s]);
    if (s === 'done') completeVisit(a);
    if (s === 'cancelled' && S.all('waitlist').length) setTimeout(function () { toast('نوبت آزاد شد — لیست انتظار را بررسی کنید (' + fa(S.all('waitlist').length) + ' نفر)'); }, 2700);
  }
  // پس از «انجام شد»: ثبت درمان و دریافت
  function completeVisit(a) {
    var svc = S.get('services', a.serviceId), exists = S.all('treatments').some(function (t) { return t.apptId === a.id; });
    if (exists) return;
    var b = balanceOf(a.patientId);
    var body = '<div class="small muted" style="margin-bottom:10px">درمان انجام‌شده و مبلغ دریافتی را ثبت کنید (اختیاری).</div><div class="stack">' +
      '<div class="grid g2 keep"><label class="f"><span>شرح درمان</span><input class="input" id="cvT" value="' + esc(svc ? svc.name : '') + '"></label><label class="f"><span>شماره دندان</span><input class="input ltr" id="cvTooth" placeholder="مثلاً 36" inputmode="numeric"></label></div>' +
      '<div class="grid g2 keep"><label class="f"><span>هزینه (تومان)</span><input class="input ltr num" id="cvP" inputmode="numeric" value="' + (svc && svc.price ? svc.price : '') + '"></label>' +
      '<label class="f"><span>دریافتی الان (تومان)</span><input class="input ltr num" id="cvPay" inputmode="numeric" value="' + (svc && svc.price ? svc.price : '') + '"></label></div>' +
      '<label class="f"><span>روش پرداخت</span><select class="input" id="cvM">' + Object.keys(METHODS).map(function (k) { return '<option value="' + k + '">' + METHODS[k] + '</option>'; }).join('') + '</select></label>' +
      (b.due > 0 ? '<div class="small">بدهی قبلی بیمار: <b class="num" style="color:var(--danger)">' + money(b.due) + '</b> تومان</div>' : '') + '</div>';
    openModal({ title: 'ثبت درمان و پرداخت — ' + esc(pName(a.patientId)), body: body,
      foot: '<button class="btn primary" id="cvOk">' + ic('check') + 'ثبت</button><button class="btn ghost" data-act="closeModal">رد کردن</button>',
      onMount: function (el) {
        $('#cvOk', el).onclick = function () {
          var title = $('#cvT', el).value.trim(), price = num($('#cvP', el).value), pay = num($('#cvPay', el).value);
          if (title || price) S.save('treatments', { patientId: a.patientId, apptId: a.id, date: a.date, title: title || 'درمان', tooth: en($('#cvTooth', el).value).trim(), price: price, doctorId: a.doctorId, serviceId: a.serviceId, status: 'done' });
          if (pay > 0) S.save('payments', { patientId: a.patientId, apptId: a.id, date: J.today(), amount: pay, method: $('#cvM', el).value });
          closeModal(); toast('ثبت شد');
        };
      } });
  }

  // ---------- فرم بیمار ----------
  function patientForm(id) {
    var p = id ? Object.assign({}, S.get('patients', id)) : { fileNo: nextFileNo() };
    var body = '<div class="stack"><div class="grid g2 keep"><label class="f"><span>نام و نام خانوادگی *</span><input class="input" id="pf_name" value="' + esc(p.name || '') + '"></label>' +
      '<label class="f"><span>شماره پرونده</span><input class="input ltr num" id="pf_file" inputmode="numeric" value="' + esc(p.fileNo || '') + '"></label></div>' +
      '<div class="grid g2 keep"><label class="f"><span>موبایل</span><input class="input ltr" id="pf_phone" inputmode="tel" value="' + esc(p.phone || '') + '"></label>' +
      '<label class="f"><span>تلفن دوم</span><input class="input ltr" id="pf_phone2" inputmode="tel" value="' + esc(p.phone2 || '') + '"></label></div>' +
      '<div class="grid g2 keep"><label class="f"><span>کد ملی</span><input class="input ltr" id="pf_nid" inputmode="numeric" value="' + esc(p.nationalId || '') + '"></label>' +
      '<label class="f"><span>تاریخ تولد (شمسی)</span><input class="input ltr" id="pf_birth" placeholder="1370/05/20" value="' + (p.birth ? en(J.jStr(p.birth)) : '') + '"></label></div>' +
      '<div class="grid g2 keep"><label class="f"><span>جنسیت</span><select class="input" id="pf_g"><option value="">—</option><option value="f"' + (p.gender === 'f' ? ' selected' : '') + '>خانم</option><option value="m"' + (p.gender === 'm' ? ' selected' : '') + '>آقا</option></select></label>' +
      '<label class="f"><span>بیمه</span><input class="input" id="pf_ins" value="' + esc(p.insurance || '') + '"></label></div>' +
      '<label class="f"><span>⚠ هشدار پزشکی (حساسیت دارویی، بیماری زمینه‌ای، داروی مصرفی، بارداری...)</span><textarea class="input" id="pf_alerts" placeholder="مثلاً: حساسیت به پنی‌سیلین، مصرف وارفارین">' + esc(p.alerts || '') + '</textarea></label>' +
      '<label class="f"><span>معرف / نحوه آشنایی</span><input class="input" id="pf_ref" value="' + esc(p.referrer || '') + '"></label>' +
      '<label class="f"><span>آدرس</span><input class="input" id="pf_addr" value="' + esc(p.address || '') + '"></label>' +
      '<label class="f"><span>یادداشت</span><textarea class="input" id="pf_notes">' + esc(p.notes || '') + '</textarea></label></div>';
    openModal({ title: id ? 'ویرایش بیمار' : 'بیمار جدید', body: body,
      foot: '<button class="btn primary" id="pfSave">' + ic('check') + 'ذخیره</button><button class="btn ghost" data-act="closeModal">انصراف</button>',
      onMount: function (el) {
        setTimeout(function () { if (!id) $('#pf_name', el).focus(); }, 50);
        $('#pfSave', el).onclick = function () {
          var name = val('pf_name').trim(); if (!name) { toast('نام بیمار را وارد کنید'); return; }
          var birthS = val('pf_birth').trim(), birth = birthS ? J.parseJ(birthS) : '';
          if (birthS && !birth) { toast('تاریخ تولد معتبر نیست (مثال: 1370/05/20)'); return; }
          var phone = normPhone(val('pf_phone'));
          var dup = phone && patients().find(function (x) { return x.id !== p.id && normPhone(x.phone) === phone; });
          var go = function () {
            Object.assign(p, { name: name, fileNo: digitsOnly(val('pf_file')) || p.fileNo, phone: phone, phone2: normPhone(val('pf_phone2')), nationalId: digitsOnly(val('pf_nid')), birth: birth,
              gender: val('pf_g'), insurance: val('pf_ins').trim(), alerts: val('pf_alerts').trim(), referrer: val('pf_ref').trim(), address: val('pf_addr').trim(), notes: val('pf_notes').trim() });
            var saved = S.save('patients', p); closeAll(); toast('ذخیره شد');
            if (!id) { ui.pid = saved.id; ui.ptab = 'info'; ui.view = 'patient'; render(); }
          };
          if (dup) confirmBox('بیمار دیگری با این شماره موبایل ثبت شده: <b>' + esc(dup.name) + '</b>. باز هم ذخیره شود؟', 'ذخیره', go); else go();
        };
      } });
  }

  // ---------- درمان ----------
  function treatmentForm(id, pid, tooth) {
    var t = id ? Object.assign({}, S.get('treatments', id)) : { patientId: pid, date: J.today(), tooth: tooth || '', status: 'planned', doctorId: (doctors()[0] || {}).id };
    var svcs = services();
    var body = '<div class="stack"><label class="f"><span>خدمت</span><select class="input" id="tf_svc"><option value="">— سایر —</option>' + svcs.map(function (s) { return '<option value="' + s.id + '"' + (s.id === t.serviceId ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f"><span>شرح درمان *</span><input class="input" id="tf_title" value="' + esc(t.title || '') + '"></label>' +
      '<div class="grid g2 keep"><label class="f"><span>شماره دندان (FDI)</span><input class="input ltr" id="tf_tooth" placeholder="36 یا 36,37" value="' + esc(t.tooth || '') + '"></label>' +
      '<label class="f"><span>هزینه (تومان)</span><input class="input ltr num" id="tf_price" inputmode="numeric" value="' + (t.price || '') + '"></label></div>' +
      '<div class="grid g2 keep"><label class="f"><span>وضعیت</span><select class="input" id="tf_st"><option value="planned"' + (t.status !== 'done' ? ' selected' : '') + '>برنامه‌ریزی‌شده (طرح درمان)</option><option value="done"' + (t.status === 'done' ? ' selected' : '') + '>انجام‌شده</option></select></label>' +
      '<label class="f"><span>تاریخ</span><button type="button" class="input" id="tf_date" style="text-align:right"></button></label></div>' +
      '<label class="f"><span>پزشک</span><select class="input" id="tf_doc">' + doctors(true).map(function (d) { return '<option value="' + d.id + '"' + (d.id === t.doctorId ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f"><span>توضیحات</span><input class="input" id="tf_note" value="' + esc(t.note || '') + '"></label></div>';
    openModal({ title: id ? 'ویرایش درمان' : 'درمان جدید', body: body,
      foot: '<button class="btn primary" id="tfSave">' + ic('check') + 'ذخیره</button><button class="btn ghost" data-act="closeModal">انصراف</button>' + (id ? '<div class="grow"></div><button class="btn danger icon" id="tfDel">' + ic('trash') + '</button>' : ''),
      onMount: function (el) {
        var dd = function () { $('#tf_date', el).textContent = J.jStr(t.date); }; dd();
        $('#tf_date', el).onclick = function () { datePicker(t.date, function (d) { t.date = d; dd(); }); };
        $('#tf_svc', el).onchange = function () { var s = S.get('services', this.value); if (s) { $('#tf_title', el).value = s.name; if (s.price) $('#tf_price', el).value = s.price; } };
        $('#tfSave', el).onclick = function () {
          var title = $('#tf_title', el).value.trim(); if (!title) { toast('شرح درمان را وارد کنید'); return; }
          Object.assign(t, { title: title, serviceId: $('#tf_svc', el).value, tooth: en($('#tf_tooth', el).value).replace(/[،\s]+/g, ',').replace(/^,|,$/g, ''), price: num($('#tf_price', el).value), status: $('#tf_st', el).value, doctorId: $('#tf_doc', el).value, note: $('#tf_note', el).value.trim() });
          S.save('treatments', t); closeModal(); toast('ذخیره شد');
        };
        if (id) $('#tfDel', el).onclick = function () { confirmBox('این درمان حذف شود؟', 'حذف', function () { S.remove('treatments', id); closeAll(); }, true); };
      } });
  }

  // ---------- پرداخت ----------
  function paymentForm(id, pid) {
    var x = id ? Object.assign({}, S.get('payments', id)) : { patientId: pid, date: J.today(), method: 'cash' };
    var due = balanceOf(x.patientId).due;
    var body = '<div class="stack">' + (!id && due > 0 ? '<div class="small">بدهی فعلی: <b class="num" style="color:var(--danger)">' + money(due) + '</b> تومان</div>' : '') +
      '<label class="f"><span>مبلغ (تومان) *</span><input class="input ltr num" id="py_a" inputmode="numeric" value="' + (x.amount || (due > 0 && !id ? due : '')) + '"></label>' +
      '<div class="grid g2 keep"><label class="f"><span>روش</span><select class="input" id="py_m">' + Object.keys(METHODS).map(function (k) { return '<option value="' + k + '"' + (k === x.method ? ' selected' : '') + '>' + METHODS[k] + '</option>'; }).join('') + '</select></label>' +
      '<label class="f"><span>تاریخ</span><button type="button" class="input" id="py_d" style="text-align:right"></button></label></div>' +
      '<label class="f"><span>توضیحات</span><input class="input" id="py_n" placeholder="مثلاً: قسط دوم ایمپلنت" value="' + esc(x.note || '') + '"></label></div>';
    openModal({ title: (id ? 'ویرایش پرداخت' : 'ثبت پرداخت') + ' — ' + esc(pName(x.patientId)), body: body,
      foot: '<button class="btn primary" id="pySave">' + ic('check') + 'ثبت</button><button class="btn ghost" data-act="closeModal">انصراف</button>' + (id ? '<div class="grow"></div><button class="btn danger icon" id="pyDel">' + ic('trash') + '</button>' : ''),
      onMount: function (el) {
        var dd = function () { $('#py_d', el).textContent = J.jStr(x.date); }; dd();
        $('#py_d', el).onclick = function () { datePicker(x.date, function (d) { x.date = d; dd(); }); };
        setTimeout(function () { $('#py_a', el).select(); }, 50);
        $('#pySave', el).onclick = function () {
          var amt = num($('#py_a', el).value); if (amt <= 0) { toast('مبلغ را وارد کنید'); return; }
          Object.assign(x, { amount: amt, method: $('#py_m', el).value, note: $('#py_n', el).value.trim() });
          S.save('payments', x); closeModal(); toast('پرداخت ثبت شد');
        };
        if (id) $('#pyDel', el).onclick = function () { confirmBox('این پرداخت حذف شود؟', 'حذف', function () { S.remove('payments', id); closeAll(); }, true); };
      } });
  }

  // ---------- پزشک / خدمت / انتظار ----------
  function doctorForm(id) {
    var d = id ? Object.assign({}, S.get('doctors', id)) : { color: COLORS[doctors(true).length % COLORS.length], active: true, order: doctors(true).length + 1 };
    openModal({ title: id ? 'ویرایش پزشک' : 'پزشک جدید',
      body: '<div class="stack"><label class="f"><span>نام *</span><input class="input" id="df_n" placeholder="دکتر ..." value="' + esc(d.name || '') + '"></label>' +
        '<label class="f"><span>تخصص</span><input class="input" id="df_s" placeholder="مثلاً: متخصص ارتودنسی" value="' + esc(d.specialty || '') + '"></label>' +
        '<div><div class="small muted" style="margin-bottom:4px">رنگ در تقویم</div><div class="row wrap" id="df_c">' + COLORS.map(function (c) { return '<button type="button" data-c="' + c + '" style="width:32px;height:32px;border-radius:10px;border:3px solid ' + (c === d.color ? 'var(--text)' : 'transparent') + ';background:' + c + ';cursor:pointer"></button>'; }).join('') + '</div></div>' +
        '<label class="row"><span class="switch"><input type="checkbox" id="df_a"' + (d.active !== false ? ' checked' : '') + '><span></span></span>فعال (نمایش در تقویم)</label></div>',
      foot: '<button class="btn primary" id="dfSave">ذخیره</button><button class="btn ghost" data-act="closeModal">انصراف</button>',
      onMount: function (el) {
        $$('#df_c button', el).forEach(function (b) { b.onclick = function () { d.color = b.getAttribute('data-c'); $$('#df_c button', el).forEach(function (x) { x.style.borderColor = x === b ? 'var(--text)' : 'transparent'; }); }; });
        $('#dfSave', el).onclick = function () {
          var n = $('#df_n', el).value.trim(); if (!n) { toast('نام را وارد کنید'); return; }
          Object.assign(d, { name: n, specialty: $('#df_s', el).value.trim(), active: $('#df_a', el).checked });
          S.save('doctors', d); closeModal();
        };
      } });
  }
  function serviceForm(id) {
    var s = id ? Object.assign({}, S.get('services', id)) : { duration: 30 };
    openModal({ title: id ? 'ویرایش خدمت' : 'خدمت جدید',
      body: '<div class="stack"><label class="f"><span>نام خدمت *</span><input class="input" id="sf_n" value="' + esc(s.name || '') + '"></label><div class="grid g2 keep">' +
        '<label class="f"><span>مدت (دقیقه)</span><input class="input ltr num" id="sf_d" inputmode="numeric" value="' + (s.duration || '') + '"></label>' +
        '<label class="f"><span>تعرفه (تومان)</span><input class="input ltr num" id="sf_p" inputmode="numeric" value="' + (s.price || '') + '"></label></div>' +
        '<label class="f"><span>دسته</span><select class="input" id="sf_c">' + SVC_CATS.slice(1).map(function (c) { return '<option value="' + c[0] + '"' + (svcCat(s) === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></label>' +
        '<label class="f"><span>توضیح کوتاه</span><input class="input" id="sf_ds" placeholder="مثلاً: پاکسازی جرم و پلاک" value="' + esc(s.desc || SVC_DESC[s.name] || '') + '"></label></div>',
      foot: '<button class="btn primary" id="sfSave">ذخیره</button><button class="btn ghost" data-act="closeModal">انصراف</button>' + (id ? '<div class="grow"></div><button class="btn danger icon" id="sfDel">' + ic('trash') + '</button>' : ''),
      onMount: function (el) {
        $('#sfSave', el).onclick = function () {
          var n = $('#sf_n', el).value.trim(); if (!n) { toast('نام را وارد کنید'); return; }
          Object.assign(s, { name: n, duration: num($('#sf_d', el).value) || 30, price: num($('#sf_p', el).value), category: $('#sf_c', el).value, desc: $('#sf_ds', el).value.trim() });
          S.save('services', s); closeModal();
        };
        if (id) $('#sfDel', el).onclick = function () { confirmBox('خدمت «' + esc(s.name) + '» حذف شود؟', 'حذف', function () { S.remove('services', id); closeAll(); }, true); };
      } });
  }
  function waitForm(id) {
    var w = id ? Object.assign({}, S.get('waitlist', id)) : {};
    openModal({ title: id ? 'ویرایش' : 'افزودن به لیست انتظار',
      body: '<div class="stack"><div class="grid g2 keep"><label class="f"><span>نام *</span><input class="input" id="wf_n" value="' + esc(w.name || '') + '"></label>' +
        '<label class="f"><span>موبایل</span><input class="input ltr" id="wf_p" inputmode="tel" value="' + esc(w.phone || '') + '"></label></div>' +
        '<label class="f"><span>خدمت</span><select class="input" id="wf_s"><option value="">—</option>' + services().map(function (s) { return '<option value="' + s.id + '"' + (s.id === w.service ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></label>' +
        '<label class="f"><span>زمان ترجیحی</span><input class="input" id="wf_t" placeholder="مثلاً: عصرها، شنبه و دوشنبه" value="' + esc(w.pref || '') + '"></label>' +
        '<label class="f"><span>یادداشت</span><input class="input" id="wf_no" value="' + esc(w.note || '') + '"></label></div>',
      foot: '<button class="btn primary" id="wfSave">ذخیره</button><button class="btn ghost" data-act="closeModal">انصراف</button>' + (id ? '<div class="grow"></div><button class="btn danger icon" id="wfDel">' + ic('trash') + '</button>' : ''),
      onMount: function (el) {
        $('#wfSave', el).onclick = function () {
          var n = $('#wf_n', el).value.trim(); if (!n) { toast('نام را وارد کنید'); return; }
          Object.assign(w, { name: n, phone: normPhone($('#wf_p', el).value), service: $('#wf_s', el).value, pref: $('#wf_t', el).value.trim(), note: $('#wf_no', el).value.trim() });
          S.save('waitlist', w); closeModal();
        };
        if (id) $('#wfDel', el).onclick = function () { S.remove('waitlist', id); closeAll(); };
      } });
  }

  // ---------- کاربران ----------
  function newUserForm() {
    openModal({ title: 'کاربر جدید',
      body: '<div class="stack"><label class="f"><span>نام کاربری (انگلیسی) *</span><input class="input ltr" id="nu_u" autocapitalize="off" placeholder="monshi1"></label>' +
        '<label class="f"><span>رمز عبور (حداقل ۶ کاراکتر) *</span><input class="input ltr" id="nu_p" type="text"></label>' +
        '<label class="f"><span>نام نمایشی</span><input class="input" id="nu_n" placeholder="خانم ..."></label>' +
        '<label class="f"><span>نقش</span><select class="input" id="nu_r"><option value="secretary">منشی</option><option value="doctor">پزشک</option><option value="admin">مدیر</option></select></label>' +
        '<div class="tiny muted">در Supabase باید گزینه Confirm email خاموش باشد (راهنما در README).</div></div>',
      foot: '<button class="btn primary" id="nuSave">ساخت کاربر</button><button class="btn ghost" data-act="closeModal">انصراف</button>',
      onMount: function (el) {
        $('#nuSave', el).onclick = async function () {
          var u = $('#nu_u', el).value.trim().toLowerCase(), pw = $('#nu_p', el).value;
          if (!/^[a-z0-9._-]{3,}$/.test(u)) { toast('نام کاربری فقط حروف انگلیسی و عدد، حداقل ۳ کاراکتر'); return; }
          if (pw.length < 6) { toast('رمز حداقل ۶ کاراکتر'); return; }
          this.disabled = true;
          try {
            await S.createUser(u, pw);
            S.save('staff', { id: u, name: $('#nu_n', el).value.trim() || u, role: $('#nu_r', el).value });
            closeModal(); toast('کاربر ساخته شد');
          } catch (e) { this.disabled = false; toast('خطا: ' + (e.message || e)); }
        };
      } });
  }
  function staffForm(id) {
    var u = Object.assign({}, S.get('staff', id));
    openModal({ title: 'کاربر ' + esc(id),
      body: '<div class="stack"><label class="f"><span>نام نمایشی</span><input class="input" id="sf2_n" value="' + esc(u.name || '') + '"></label>' +
        '<label class="f"><span>نقش</span><select class="input" id="sf2_r">' + ['secretary', 'doctor', 'admin'].map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + roleName(r) + '</option>'; }).join('') + '</select></label>' +
        '<div class="tiny muted">برای غیرفعال کردن کامل یا تغییر رمز کاربر دیگر، از پنل Supabase بخش Authentication استفاده کنید.</div></div>',
      foot: '<button class="btn primary" id="sf2Save">ذخیره</button><button class="btn ghost" data-act="closeModal">انصراف</button>',
      onMount: function (el) {
        $('#sf2Save', el).onclick = function () {
          if (id === S.user.username && $('#sf2_r', el).value !== 'admin' && S.all('staff').filter(function (s) { return s.role === 'admin'; }).length < 2) { toast('حداقل یک مدیر باید بماند'); return; }
          S.save('staff', Object.assign(u, { name: $('#sf2_n', el).value.trim(), role: $('#sf2_r', el).value })); closeModal();
        };
      } });
  }

  // ================= خروجی/چاپ =================
  function csv(rows) { return '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n'); }
  function stamp() { var j = J.toJ(J.today()); return j[0] + '-' + J.pad(j[1]) + '-' + J.pad(j[2]); }
  function printDay(d) {
    var st = settings(), list = apptsOn(d).filter(ACTIVE_ST);
    var h = '<h2>' + esc(st.clinicName) + '</h2><div>برنامه نوبت‌های ' + J.jLong(d) + '</div><br><table><tr><th>ساعت</th><th>بیمار</th><th>موبایل</th><th>پزشک</th><th>خدمت</th><th>یادداشت</th></tr>' +
      list.map(function (a) { var p = S.get('patients', a.patientId) || {}; return '<tr><td>' + fa(a.time) + '</td><td>' + esc(p.name) + (p.alerts ? ' ⚠' : '') + '</td><td>' + fa(p.phone || '') + '</td><td>' + esc(dName(a.doctorId)) + '</td><td>' + esc(svcName(a.serviceId)) + '</td><td>' + esc(a.notes || '') + '</td></tr>'; }).join('') +
      '</table><br><div>تعداد: ' + fa(list.length) + '</div>';
    doPrint(h);
  }
  function printStatement(pid) {
    var p = S.get('patients', pid), b = balanceOf(pid), st = settings();
    var items = [];
    treatmentsOf(pid).forEach(function (t) { if (t.status === 'done') items.push([t.date, t.title + (t.tooth ? ' (دندان ' + t.tooth + ')' : ''), t.price, '']); });
    paymentsOf(pid).forEach(function (x) { items.push([x.date, 'پرداخت ' + (METHODS[x.method] || '') + (x.note ? ' - ' + x.note : ''), '', x.amount]); });
    items.sort(function (a, b) { return String(a[0]).localeCompare(String(b[0])); });
    var h = '<h2>' + esc(st.clinicName) + '</h2><div>صورتحساب بیمار: <b>' + esc(p.name) + '</b> — پرونده ' + fa(p.fileNo || '') + ' — تاریخ ' + J.jStr(J.today()) + '</div><br>' +
      '<table><tr><th>تاریخ</th><th>شرح</th><th>هزینه</th><th>پرداخت</th></tr>' + items.map(function (r) { return '<tr><td>' + J.jStr(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + (r[2] !== '' ? money(r[2]) : '') + '</td><td>' + (r[3] !== '' ? money(r[3]) : '') + '</td></tr>'; }).join('') +
      '<tr><th colspan="2">جمع</th><th>' + money(b.charges) + '</th><th>' + money(b.paid) + '</th></tr></table><br><div><b>مانده: ' + money(b.due) + ' تومان</b></div>' +
      (st.address || st.phone ? '<br><div style="font-size:10pt">' + esc(st.address) + ' ' + fa(st.phone) + '</div>' : '');
    doPrint(h);
  }

  // ================= رویدادها =================
  var A = {
    nav: function (d) { ui.view = d.v; if (d.v === 'calendar') ui._keepScroll = false; closeAll(); render(); window.scrollTo(0, 0); },
    theme: function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var t = dark ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('dentino_theme', t); } catch (e) {}
      if (window.Android && Android.setDark) Android.setDark(t === 'dark');
      render();
    },
    closeModal: function () { closeModal(); },
    back: function () { ui.view = BACK[ui.view] || 'home'; render(); window.scrollTo(0, 0); },
    goSearch: function () { ui.view = 'patients'; render(); window.scrollTo(0, 0); var q = $('#pq'); if (q) q.focus(); },
    reminders: function () { openModal({ title: 'یادآوری نوبت‌های فردا', body: '<div class="small muted" style="margin-bottom:8px">' + J.jLong(J.addDays(J.today(), 1)) + '</div>' + remindersHTML() }); },
    svcCat: function (d) { ui.scat = d.c; render(); },
    svcBook: function (d) { closeAll(); apptForm(null, { svc: d.id, date: J.today() }); },
    newAppt: function (d) { closeAll(); apptForm(null, { pid: d.pid, date: ui.view === 'calendar' ? ui.date : J.today() }); },
    editAppt: function (d) { closeAll(); apptForm(S.get('appointments', d.id)); },
    nextAppt: function (d) { var a = S.get('appointments', d.id); closeAll(); apptForm(null, { pid: a.patientId, doc: a.doctorId, date: J.addDays(a.date, 7) }); },
    openAppt: function (d) { apptDetail(d.id); },
    delAppt: function (d) { confirmBox('این نوبت حذف شود؟ (برای حفظ سابقه، بهتر است وضعیت را «لغو» کنید)', 'حذف', function () { S.remove('appointments', d.id); closeAll(); toast('حذف شد'); }, true); },
    setStatus: function (d) { setStatus(d.id, d.s); },
    slotClick: function (d) { apptForm(null, { date: ui.date, time: d.t, doc: d.doc }); },
    shiftDay: function (d) { ui.date = J.addDays(ui.date, +d.n); ui._keepScroll = false; render(); },
    setDate: function (d) { ui.date = d.d; ui._keepScroll = false; render(); },
    today: function () { ui.date = J.today(); ui._keepScroll = false; render(); },
    pickDate: function () { datePicker(ui.date, function (d) { ui.date = d; ui._keepScroll = false; render(); }); },
    setDoc: function (d) { ui.doc = d.id; render(); },
    calMode: function (d) { ui.calMode = d.m; ui._keepScroll = false; render(); },
    openPatient: function (d) { closeAll(); ui.pid = d.id; ui.ptab = 'info'; ui.tooth = null; ui.view = 'patient'; render(); window.scrollTo(0, 0); },
    editPatient: function (d) { patientForm(d.id); },
    delPatient: function (d) {
      var n = appts().filter(function (a) { return a.patientId === d.id; }).length;
      confirmBox('پرونده «' + esc(pName(d.id)) + '» و ' + fa(n) + ' نوبت مربوطه حذف شود؟ این کار برگشت‌پذیر نیست.', 'حذف کامل', function () {
        appts().forEach(function (a) { if (a.patientId === d.id) S.remove('appointments', a.id); });
        treatmentsOf(d.id).forEach(function (t) { S.remove('treatments', t.id); });
        paymentsOf(d.id).forEach(function (t) { S.remove('payments', t.id); });
        S.remove('patients', d.id); ui.view = 'patients'; render(); toast('حذف شد');
      }, true);
    },
    ptab: function (d) { ui.ptab = d.t; render(); },
    psort: function (d) { ui.psort = d.s; render(); },
    toothClick: function (d) { ui.tooth = ui.tooth === d.n ? null : d.n; render(); },
    editTreatment: function (d) { treatmentForm(d.id, d.pid, d.tooth); },
    addPayment: function (d) { paymentForm(d.id, d.pid); },
    call: function (d) { openUrl('tel:' + normPhone(d.p)); },
    smsTo: function (d) { openUrl(smsLink(d.p, '')); },
    sendSms: function (d) {
      var a = S.get('appointments', d.id), p = S.get('patients', a.patientId);
      S.save('appointments', Object.assign({}, a, { reminded: true }));
      openUrl(smsLink(p.phone, smsText(a)));
    },
    sendWa: function (d) {
      var a = S.get('appointments', d.id), p = S.get('patients', a.patientId);
      S.save('appointments', Object.assign({}, a, { reminded: true }));
      openUrl(waLink(p.phone, smsText(a)));
    },
    smsBirthday: function (d) { var p = S.get('patients', d.id); openUrl(smsLink(p.phone, p.name + ' عزیز، زادروزتان مبارک! 🎂\n' + settings().clinicName)); },
    finRange: function (d) { ui.finRange = d.r; ui.finOffset = 0; render(); },
    finShift: function (d) { ui.finOffset = Math.min(0, ui.finOffset + (+d.n)); render(); },
    editWait: function (d) { waitForm(d.id); },
    waitToAppt: function (d) {
      var w = S.get('waitlist', d.id), p = w.phone && patients().find(function (x) { return normPhone(x.phone) === w.phone; });
      apptForm(null, { pid: p ? p.id : null, newName: p ? null : w.name, newPhone: w.phone, date: J.today(), notes: w.note || '', waitId: w.id });
    },
    setTab: function (d) { closeAll(); ui.view = 'settings'; ui.setTab = d.t; render(); window.scrollTo(0, 0); },
    saveClinic: function () { S.save('settings', Object.assign(settings(), { clinicName: val('s_name').trim() || 'مطب دندانپزشکی', greetName: val('s_greet').trim(), phone: en(val('s_phone')).trim(), address: val('s_addr').trim() })); toast('ذخیره شد'); },
    saveHours: function () {
      var s = val('s_start'), e = val('s_end');
      if (!s || !e || t2m(e) <= t2m(s)) { toast('ساعت پایان باید بعد از شروع باشد'); return; }
      S.save('settings', Object.assign(settings(), { start: s, end: e, breakStart: val('s_bs'), breakEnd: val('s_be'), slot: +val('s_slot'), workDays: $$('.s_day').filter(function (x) { return x.checked; }).map(function (x) { return +x.value; }) }));
      toast('ذخیره شد');
    },
    saveSms: function () { S.save('settings', Object.assign(settings(), { smsTemplate: val('s_sms') })); toast('ذخیره شد'); },
    editDoctor: function (d) { doctorForm(d.id); },
    editService: function (d) { serviceForm(d.id); },
    newUser: function () { newUserForm(); },
    editStaff: function (d) { staffForm(d.id); },
    changePw: function () {
      openModal({ title: 'تغییر رمز', body: '<label class="f"><span>رمز جدید (حداقل ۶ کاراکتر)</span><input class="input ltr" id="cp_p" type="password"></label>',
        foot: '<button class="btn primary" id="cpOk">ذخیره</button><button class="btn ghost" data-act="closeModal">انصراف</button>',
        onMount: function (el) { $('#cpOk', el).onclick = async function () { var p = $('#cp_p', el).value; if (p.length < 6) { toast('حداقل ۶ کاراکتر'); return; } try { await S.changePassword(p); closeModal(); toast('رمز تغییر کرد'); } catch (e) { toast('خطا: ' + e.message); } }; } });
    },
    saveCloud: function () {
      var url = val('c_url').trim().replace(/\/+$/, ''), key = val('c_key').trim();
      if (!/^https:\/\/.+/.test(url) || key.length < 20) { toast('آدرس و کلید را درست وارد کنید'); return; }
      if (S.mode === 'local') try { localStorage.setItem('dentino_migrate', JSON.stringify(S.exportAll())); } catch (e) {}
      localStorage.removeItem('dentino_force_local'); S.setCfg({ url: url, key: key }); location.reload();
    },
    disconnectCloud: function () { confirmBox('اتصال ابری قطع شود؟ برنامه به حالت محلی برمی‌گردد.', 'قطع اتصال', async function () { await S.logout(); S.setCfg(null); if (window.DENTINO_CONFIG) DENTINO_CONFIG.supabaseUrl = ''; location.reload(); }, true); },
    syncNow: async function () { await S.flush(); await S.pull(false); toast('همگام شد'); },
    logout: function () { confirmBox('از حساب خارج می‌شوید. ادامه؟', 'خروج', async function () { await S.logout(); location.reload(); }); },
    backup: function () { saveFile('dentino-backup-' + stamp() + '.json', 'application/json', JSON.stringify(S.exportAll())); },
    restore: function () {
      var inp = $('#restoreFile');
      if (!inp) { ui.view = 'settings'; ui.setTab = 'backup'; render(); inp = $('#restoreFile'); }
      inp.onchange = function () {
        var f = inp.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          try {
            var obj = JSON.parse(r.result);
            var n = (obj.data && obj.data.patients || []).length, m = (obj.data && obj.data.appointments || []).length;
            confirmBox('فایل شامل ' + fa(n) + ' بیمار و ' + fa(m) + ' نوبت است. اطلاعات فعلی <b>جایگزین</b> شود یا <b>ادغام</b>؟ (برای ادغام «انصراف» و دوباره با گزینه ادغام)', 'جایگزینی کامل', function () { S.importAll(obj, true); toast('بازیابی شد'); }, true);
            var foot = $('.overlay:last-child .modal-f');
            if (foot) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = 'ادغام'; b.onclick = function () { closeModal(); S.importAll(obj, false); toast('ادغام شد'); }; foot.insertBefore(b, foot.children[1]); }
          } catch (e) { toast('فایل نامعتبر است'); }
          inp.value = '';
        };
        r.readAsText(f);
      };
      inp.click();
    },
    exportPatients: function () {
      var bal = allBalances();
      saveFile('patients-' + stamp() + '.csv', 'text/csv', csv([['پرونده', 'نام', 'موبایل', 'تلفن دوم', 'کد ملی', 'تاریخ تولد', 'بیمه', 'هشدار پزشکی', 'مانده حساب', 'آدرس']].concat(
        patients().sort(function (a, b) { return (+a.fileNo || 0) - (+b.fileNo || 0); }).map(function (p) { return [p.fileNo, p.name, p.phone, p.phone2, p.nationalId, p.birth ? en(J.jStr(p.birth)) : '', p.insurance, p.alerts, bal[p.id] || 0, p.address]; }))));
    },
    exportAppts: function () {
      saveFile('appointments-' + stamp() + '.csv', 'text/csv', csv([['تاریخ', 'ساعت', 'مدت', 'بیمار', 'موبایل', 'پزشک', 'خدمت', 'وضعیت', 'یادداشت']].concat(
        appts().sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); }).map(function (a) { var p = S.get('patients', a.patientId) || {}; return [en(J.jStr(a.date)), a.time, a.duration, p.name, p.phone, dName(a.doctorId), svcName(a.serviceId), STATUS[a.status], a.notes]; }))));
    },
    exportPays: function () {
      var r = ui.view === 'finance' ? finRange() : ['0000', '9999'];
      saveFile('payments-' + stamp() + '.csv', 'text/csv', csv([['تاریخ', 'بیمار', 'مبلغ', 'روش', 'توضیحات']].concat(
        S.all('payments').filter(function (p) { return p.date >= r[0] && p.date <= r[1]; }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).map(function (p) { return [en(J.jStr(p.date)), pName(p.patientId), p.amount, METHODS[p.method], p.note]; }))));
    },
    printDay: function () { printDay(ui.view === 'calendar' ? ui.date : J.today()); },
    printStatement: function (d) { printStatement(d.pid); }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = A[el.getAttribute('data-act')];
    if (!fn) return;
    e.preventDefault(); e.stopPropagation();
    fn(el.dataset, el, e);
  });
  var pqT;
  document.addEventListener('input', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-in');
    if (k === 'pq') { ui.pq = e.target.value; clearTimeout(pqT); pqT = setTimeout(render, 120); }
    if (k === 'sq') { ui.sq = e.target.value; clearTimeout(pqT); pqT = setTimeout(render, 120); }
  });
  document.addEventListener('change', function (e) { if (e.target.getAttribute && e.target.getAttribute('data-chg') === 'theme') A.theme(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modals.length) closeModal(); });
  // دکمه بازگشت اندروید
  window.dentinoBack = function () {
    if (modals.length) { closeModal(); return true; }
    if (BACK[ui.view]) { A.back(); return true; }
    if (ui.view !== 'home') { ui.view = 'home'; render(); return true; }
    return false;
  };

  var rT;
  S.on(function (what) {
    clearTimeout(rT);
    rT = setTimeout(function () {
      // وقتی فرم باز است، فقط نشانگر همگام‌سازی را تازه کن تا ورودی کاربر از بین نرود
      if (modals.length && what === 'sync') return;
      render();
    }, 60);
  });
  // تازه‌سازی خط «الان» تقویم و تغییر روز
  setInterval(function () { if (!modals.length && (ui.view === 'calendar' || ui.view === 'home')) render(); }, 60000);

  // ================= ورود =================
  var SLIDES = [
    { art: { ring: true, shield: true, sparkle: true }, t1: 'لبخند سالم،', t2: 'مطب منظم', d: 'نوبت‌ها، پرونده بیماران و حساب‌ها، همه یک‌جا و مرتب؛ برای منشی و پزشک.' },
    { art: { cal: true, sparkle: true }, t1: 'نوبت‌دهی', t2: 'در چند ثانیه', d: 'تقویم شمسی، ساعت‌های خالی و یادآوری پیامکی برای کم کردن غیبت بیماران.' },
    { art: { check: true }, t1: 'پرونده کامل', t2: 'و چارت دندان', d: 'طرح درمان روی هر دندان، پرداخت‌ها و مانده حساب هر بیمار.' }
  ];
  function welcomeScreen(done, i) {
    i = i || 0; ui.gate = true;
    var s = SLIDES[i], last = i === SLIDES.length - 1;
    $('#root').innerHTML = '<div class="welcome"><div class="box"><div class="art">' + toothSVG(s.art) + '</div><h1>' + s.t1 + '<span class="acc">' + s.t2 + '</span></h1><p>' + s.d + '</p>' +
      '<button class="btn cta" id="wNext">' + (last ? 'شروع کنید' : 'بعدی') + '<span class="arr">' + ic('left') + '</span></button>' +
      '<div class="dots">' + SLIDES.map(function (x, k) { return '<i class="' + (k === i ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      '<div class="skip">' + (last ? '&nbsp;' : '<a id="wSkip">رد کردن</a>') + '</div></div></div>';
    var fin = function () { ui.gate = false; done(); };
    $('#wNext').onclick = function () { if (last) fin(); else welcomeScreen(done, i + 1); };
    if (!last) $('#wSkip').onclick = fin;
    var w = $('.welcome'), x0 = null;
    w.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    w.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (dx > 50 && !last) welcomeScreen(done, i + 1);
      else if (dx < -50 && i > 0) welcomeScreen(done, i - 1);
    });
  }
  function loginScreen(err) {
    ui.gate = true;
    $('#root').innerHTML = '<div class="welcome"><div class="box"><div class="art" style="width:min(56vw,210px)">' + toothSVG({ ring: true, shield: true, sparkle: true }) + '</div>' +
      '<h1 style="text-align:center;font-size:26px">خوش آمدید<span class="acc">به دنتینو</span></h1><p style="text-align:center;margin-bottom:18px">' + esc(settings().clinicName) + '</p>' +
      '<form class="card stack login-card" id="lf"><label class="f"><span>نام کاربری</span><input class="input ltr" id="lu" autocapitalize="off" autocomplete="username" required></label>' +
      '<label class="f"><span>رمز عبور</span><input class="input ltr" id="lp" type="password" autocomplete="current-password" required></label>' +
      (err ? '<div class="alert-box">' + esc(err) + '</div>' : '') +
      '<button class="btn cta" id="lb">ورود<span class="arr">' + ic('left') + '</span></button></form>' +
      '<div class="skip"><a id="lreset">ورود با سرور دیگر / حالت محلی</a></div></div></div>';
    $('#lf').onsubmit = async function (e) {
      e.preventDefault();
      var b = $('#lb'); b.disabled = true; b.firstChild.textContent = 'در حال ورود…';
      try { await S.login(val('lu'), val('lp')); await afterLogin(); }
      catch (er) { loginScreen(/invalid/i.test(er.message) ? 'نام کاربری یا رمز اشتباه است' : /fetch|network/i.test(er.message) || !navigator.onLine ? 'اتصال به سرور برقرار نشد؛ اینترنت یا آدرس سرور را بررسی کنید.' : er.message); }
    };
    $('#lreset').onclick = function (e) { e.preventDefault(); confirmBox('تنظیمات اتصال پاک شود و برنامه در حالت محلی اجرا شود؟', 'بله', function () { S.setCfg(null); localStorage.setItem('dentino_force_local', '1'); location.reload(); }); };
  }
  async function afterLogin() {
    $('#root').innerHTML = '<div class="login-wrap"><div class="muted">در حال دریافت اطلاعات...</div></div>';
    try {
      var chk = await S.sb.rpc('is_staff');
      if (!chk.error && chk.data === false) { await S.logout(); loginScreen('این حساب هنوز توسط مدیر مطب به لیست کاربران اضافه نشده است.'); return; }
    } catch (e) {}
    await S.pull(!localStorage.getItem('dentino_lastsync_v1'));
    // انتقال داده‌های حالت محلی (یک بار)
    var mig = localStorage.getItem('dentino_migrate');
    if (mig) { try { var o = JSON.parse(mig); if (o.data && (o.data.patients || []).length) S.importAll(o, false); } catch (e) {} localStorage.removeItem('dentino_migrate'); }
    if (!S.all('staff').length) S.save('staff', { id: S.user.username, name: S.user.username, role: 'admin' });
    seedIfEmpty();
    S.subscribe(); S.flush();
    ui.gate = false;
    render();
  }

  async function boot() {
    try { if (window.Android && Android.setDark) Android.setDark(document.documentElement.getAttribute('data-theme') === 'dark'); } catch (e) {}
    if (localStorage.getItem('dentino_force_local')) { window.DENTINO_CONFIG = {}; }
    S.init();
    if (S.mode === 'cloud') {
      var has = false;
      try { has = await S.restoreSession(); } catch (e) {}
      if (!has) { loginScreen(); return; }
      if (Object.keys(S.data).length) { seedIfEmpty(); render(); S.pull(false); S.subscribe(); S.flush(); }
      else await afterLogin();
    } else {
      seedIfEmpty();
      var seen = false; try { seen = !!localStorage.getItem('dentino_welcomed'); } catch (e) {}
      if (seen) render();
      else welcomeScreen(function () { try { localStorage.setItem('dentino_welcomed', '1'); } catch (e) {} render(); });
    }
  }
  window.addEventListener('DOMContentLoaded', boot);
  window.__dentino = { ui: ui, render: render, S: S };
})();
