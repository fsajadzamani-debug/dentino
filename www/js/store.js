/* لایه داده: حالت محلی (فقط همین دستگاه) یا ابری (Supabase، همگام بین همه دستگاه‌ها)
   همه داده‌ها در جدول records با ستون‌های (coll, id, data, deleted, updated_at, updated_by) ذخیره می‌شوند. */
(function (g) {
  var LS_DATA = 'dentino_data_v1';
  var LS_QUEUE = 'dentino_queue_v1';
  var LS_CFG = 'dentino_cfg_v1';
  var LS_SYNC = 'dentino_lastsync_v1';
  var EMAIL_DOMAIN = '@dentino.app';

  function lsGet(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('storage', e); } }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  var Store = {
    data: {},          // coll -> { id -> record }
    queue: [],         // تغییرات ارسال‌نشده (حالت ابری)
    listeners: [],
    sb: null,
    user: null,        // { username, email }
    mode: 'local',
    online: navigator.onLine,
    syncing: false,

    cfg: function () {
      var c = lsGet(LS_CFG, null);
      if (c && c.url && c.key) return c;
      if (g.DENTINO_CONFIG && g.DENTINO_CONFIG.supabaseUrl && g.DENTINO_CONFIG.supabaseKey)
        return { url: g.DENTINO_CONFIG.supabaseUrl, key: g.DENTINO_CONFIG.supabaseKey };
      return null;
    },
    setCfg: function (c) { if (c) lsSet(LS_CFG, c); else localStorage.removeItem(LS_CFG); },

    init: function () {
      this.data = lsGet(LS_DATA, {});
      this.queue = lsGet(LS_QUEUE, []);
      var c = this.cfg();
      if (c && g.supabase) {
        this.mode = 'cloud';
        this.sb = g.supabase.createClient(c.url, c.key, { auth: { persistSession: true, storageKey: 'dentino_auth' } });
      }
      var self = this;
      g.addEventListener('online', function () { self.online = true; self.flush(); self.emit('net'); });
      g.addEventListener('offline', function () { self.online = false; self.emit('net'); });
    },

    on: function (fn) { this.listeners.push(fn); },
    emit: function (what) { this.listeners.forEach(function (fn) { try { fn(what); } catch (e) { console.error(e); } }); },
    persist: function () { lsSet(LS_DATA, this.data); lsSet(LS_QUEUE, this.queue); },

    all: function (coll) {
      var m = this.data[coll] || {};
      return Object.keys(m).map(function (k) { return m[k]; }).filter(function (r) { return !r._deleted; });
    },
    get: function (coll, id) { var r = (this.data[coll] || {})[id]; return r && !r._deleted ? r : null; },

    save: function (coll, obj) {
      obj = Object.assign({}, obj);
      if (!obj.id) { obj.id = uid(); obj.createdAt = new Date().toISOString(); }
      obj.updatedAt = new Date().toISOString();
      if (this.user) obj.updatedBy = this.user.username;
      (this.data[coll] = this.data[coll] || {})[obj.id] = obj;
      this.enqueue(coll, obj, false);
      this.persist();
      this.emit(coll);
      return obj;
    },
    remove: function (coll, id) {
      var r = (this.data[coll] || {})[id];
      if (!r) return;
      r = Object.assign({}, r, { _deleted: true, updatedAt: new Date().toISOString() });
      this.data[coll][id] = r;
      this.enqueue(coll, r, true);
      this.persist();
      this.emit(coll);
    },

    enqueue: function (coll, obj, deleted) {
      if (this.mode !== 'cloud') return;
      this.queue = this.queue.filter(function (q) { return !(q.coll === coll && q.id === obj.id); });
      this.queue.push({ coll: coll, id: obj.id, data: obj, deleted: !!deleted });
      var self = this;
      clearTimeout(this._ft);
      this._ft = setTimeout(function () { self.flush(); }, 300);
    },

    flush: async function () {
      if (this.mode !== 'cloud' || !this.user || !this.queue.length || this._flushing) return;
      this._flushing = true;
      var batch = this.queue.slice(0, 200);
      var rows = batch.map(function (q) {
        return { coll: q.coll, id: q.id, data: q.data, deleted: q.deleted, updated_by: Store.user.username };
      });
      try {
        var res = await this.sb.from('records').upsert(rows, { onConflict: 'coll,id' });
        if (res.error) throw res.error;
        var done = {}; batch.forEach(function (q) { done[q.coll + '/' + q.id + '/' + q.data.updatedAt] = 1; });
        this.queue = this.queue.filter(function (q) { return !done[q.coll + '/' + q.id + '/' + q.data.updatedAt]; });
        this.persist();
        this.emit('sync');
      } catch (e) {
        console.warn('flush failed', e);
      } finally {
        this._flushing = false;
        if (this.queue.length && this.online) { var s = this; setTimeout(function () { s.flush(); }, 5000); }
      }
    },

    applyRow: function (row) {
      var pending = this.queue.some(function (q) { return q.coll === row.coll && q.id === row.id; });
      if (pending) return false; // تغییر محلی جدیدتر هنوز ارسال نشده
      var obj = Object.assign({}, row.data || {}, { id: row.id });
      if (row.deleted) obj._deleted = true;
      (this.data[row.coll] = this.data[row.coll] || {})[row.id] = obj;
      return true;
    },

    pull: async function (full) {
      if (this.mode !== 'cloud' || !this.user) return;
      this.syncing = true; this.emit('sync');
      var since = full ? null : lsGet(LS_SYNC, null);
      var from = 0, size = 1000, maxTs = since, changed = false;
      try {
        while (true) {
          var q = this.sb.from('records').select('*').order('updated_at', { ascending: true }).range(from, from + size - 1);
          if (since) q = q.gt('updated_at', since);
          var res = await q;
          if (res.error) throw res.error;
          var self = this;
          res.data.forEach(function (r) { if (self.applyRow(r)) changed = true; if (!maxTs || r.updated_at > maxTs) maxTs = r.updated_at; });
          if (res.data.length < size) break;
          from += size;
        }
        if (maxTs) lsSet(LS_SYNC, maxTs);
        this.persist();
      } catch (e) { console.warn('pull failed', e); this.lastError = e.message || String(e); }
      this.syncing = false;
      this.emit(changed ? '*' : 'sync');
    },

    subscribe: function () {
      if (this.mode !== 'cloud' || this._chan) return;
      var self = this;
      this._chan = this.sb.channel('records-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, function (p) {
          var r = p.new && p.new.id ? p.new : null;
          if (!r) return;
          if (self.applyRow(r)) { self.persist(); self.emit(r.coll); }
        })
        .subscribe();
      // پشتیبان: هر ۶۰ ثانیه همگام‌سازی افزایشی
      this._poll = setInterval(function () { if (self.online) self.pull(false); }, 60000);
    },

    // ---------- احراز هویت ----------
    toEmail: function (u) { u = String(u).trim().toLowerCase(); return u.indexOf('@') > -1 ? u : u + EMAIL_DOMAIN; },
    toUser: function (email) { return String(email || '').replace(EMAIL_DOMAIN, ''); },

    restoreSession: async function () {
      if (this.mode !== 'cloud') return false;
      var s = await this.sb.auth.getSession();
      var sess = s.data && s.data.session;
      if (!sess) return false;
      this.user = { username: this.toUser(sess.user.email), email: sess.user.email };
      return true;
    },
    login: async function (username, password) {
      var r = await this.sb.auth.signInWithPassword({ email: this.toEmail(username), password: password });
      if (r.error) throw r.error;
      this.user = { username: this.toUser(r.data.user.email), email: r.data.user.email };
    },
    logout: async function () {
      if (this.sb) await this.sb.auth.signOut();
      this.user = null;
      clearInterval(this._poll);
      if (this._chan) { this.sb.removeChannel(this._chan); this._chan = null; }
      localStorage.removeItem(LS_DATA); localStorage.removeItem(LS_SYNC); localStorage.removeItem(LS_QUEUE);
      this.data = {}; this.queue = [];
    },
    // ساخت کاربر جدید (نیاز به خاموش بودن Confirm email در Supabase)
    createUser: async function (username, password) {
      var c = this.cfg();
      var tmp = g.supabase.createClient(c.url, c.key, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'dentino_tmp' } });
      var r = await tmp.auth.signUp({ email: this.toEmail(username), password: password });
      if (r.error) throw r.error;
      return r.data;
    },
    changePassword: async function (pw) {
      var r = await this.sb.auth.updateUser({ password: pw });
      if (r.error) throw r.error;
    },

    // ---------- پشتیبان ----------
    exportAll: function () {
      var out = { app: 'dentino', version: 1, exportedAt: new Date().toISOString(), data: {} };
      var self = this;
      Object.keys(this.data).forEach(function (c) { out.data[c] = self.all(c); });
      return out;
    },
    importAll: function (obj, replace) {
      if (!obj || !obj.data) throw new Error('فایل پشتیبان معتبر نیست');
      var self = this;
      if (replace) Object.keys(this.data).forEach(function (c) { self.all(c).forEach(function (r) { self.remove(c, r.id); }); });
      Object.keys(obj.data).forEach(function (c) {
        (obj.data[c] || []).forEach(function (r) {
          (self.data[c] = self.data[c] || {})[r.id] = r;
          self.enqueue(c, r, false);
        });
      });
      this.persist();
      this.emit('*');
    }
  };

  g.Store = Store;
  g.uid = uid;
})(window);
