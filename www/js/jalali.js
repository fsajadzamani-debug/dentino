/* تبدیل تاریخ شمسی/میلادی + ابزارهای نمایش فارسی */
(function (g) {
  function g2j(gy, gm, gd) {
    var gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var gy2 = gm > 2 ? gy + 1 : gy;
    var days = 355666 + 365 * gy + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + gdm[gm - 1];
    var jy = -1595 + 33 * ~~(days / 12053);
    days %= 12053;
    jy += 4 * ~~(days / 1461);
    days %= 1461;
    if (days > 365) { jy += ~~((days - 1) / 365); days = (days - 1) % 365; }
    var jm, jd;
    if (days < 186) { jm = 1 + ~~(days / 31); jd = 1 + (days % 31); }
    else { jm = 7 + ~~((days - 186) / 30); jd = 1 + ((days - 186) % 30); }
    return [jy, jm, jd];
  }
  function j2g(jy, jm, jd) {
    jy += 1595;
    var days = -355668 + 365 * jy + ~~(jy / 33) * 8 + ~~(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    var gy = 400 * ~~(days / 146097);
    days %= 146097;
    if (days > 36524) { gy += 100 * ~~(--days / 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * ~~(days / 1461);
    days %= 1461;
    if (days > 365) { gy += ~~((days - 1) / 365); days = (days - 1) % 365; }
    var gd = days + 1;
    var sal = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var gm;
    for (gm = 0; gm < 13 && gd > sal[gm]; gm++) gd -= sal[gm];
    return [gy, gm, gd];
  }
  function isLeapJ(jy) { var r = g2j.apply(null, j2g(jy, 12, 30)); return r[0] === jy && r[1] === 12 && r[2] === 30; }
  function monthLen(jy, jm) { return jm <= 6 ? 31 : jm <= 11 ? 30 : isLeapJ(jy) ? 30 : 29; }

  var MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  // اندیس بر اساس getDay میلادی (0=یکشنبه)
  var WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  var WD_SHORT = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
  var WD_NAMES = ['یکشنبه', 'دوشنبه', '۳شنبه', '۴شنبه', '۵شنبه', 'جمعه', 'شنبه'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function today() { return iso(new Date()); }
  function addDays(s, n) { var d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); }
  function toJ(s) { var d = parseISO(s); return g2j(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  function fromJ(jy, jm, jd) { var r = j2g(jy, jm, jd); return r[0] + '-' + pad(r[1]) + '-' + pad(r[2]); }
  function weekday(s) { return parseISO(s).getDay(); } // 0=یکشنبه ... 6=شنبه
  // ستون در تقویم ایرانی (شنبه=0 ... جمعه=6)
  function faCol(s) { return (weekday(s) + 1) % 7; }

  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function fa(x) { return String(x == null ? '' : x).replace(/\d/g, function (d) { return FA[d]; }); }
  function en(x) {
    return String(x == null ? '' : x)
      .replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
  }
  function jStr(s) { if (!s) return ''; var j = toJ(s); return fa(j[0] + '/' + pad(j[1]) + '/' + pad(j[2])); }
  function jLong(s) { var j = toJ(s); return WEEKDAYS[weekday(s)] + ' ' + fa(j[2]) + ' ' + MONTHS[j[1] - 1] + ' ' + fa(j[0]); }
  function jMid(s) { var j = toJ(s); return fa(j[2]) + ' ' + MONTHS[j[1] - 1]; }
  // ورودی متنی شمسی مثل ۱۴۰۵/۷/۹ → ISO میلادی
  function parseJ(str) {
    var m = en(str).trim().match(/^(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (!m) return null;
    var jy = +m[1]; if (jy < 100) jy += 1400;
    var jm = +m[2], jd = +m[3];
    if (jm < 1 || jm > 12 || jd < 1 || jd > monthLen(jy, jm)) return null;
    return fromJ(jy, jm, jd);
  }

  g.J = {
    g2j: g2j, j2g: j2g, isLeapJ: isLeapJ, monthLen: monthLen, MONTHS: MONTHS, WEEKDAYS: WEEKDAYS, WD_SHORT: WD_SHORT, WD_NAMES: WD_NAMES,
    pad: pad, iso: iso, parseISO: parseISO, today: today, addDays: addDays, toJ: toJ, fromJ: fromJ,
    weekday: weekday, faCol: faCol, fa: fa, en: en, jStr: jStr, jLong: jLong, jMid: jMid, parseJ: parseJ
  };
})(window);
