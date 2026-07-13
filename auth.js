/*!
 * lightauth — минималистичная клиентская авторизация для демо-приложений.
 * Без сервера: аккаунты и сессия живут в localStorage этого браузера.
 * Пароли не хранятся в открытом виде — только соль + SHA-256 хеш.
 * Данные каждого пользователя изолируются через Auth.ns(key).
 *
 * Использование:
 *   Auth.init({ app:'monee', title:'Monee', subtitle:'Личные финансы',
 *               accent:'#10b981', icon:'💚' }).then(function(user){ startApp(user); });
 *   const KEY = Auth.ns('monee.v1');   // → "monee.v1::u_ab12cd"
 */
(function (global) {
'use strict';

var USERS_KEY = 'lightauth.users.v1';
var SESS_KEY  = 'lightauth.session.v1';
var cfg = {};
var currentUser = null;

/* ---------- storage helpers ---------- */
function load(k, fallback) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
}
function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function esc(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

/* ---------- crypto ---------- */
function randSalt() {
    var a = new Uint8Array(16);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(a);
    else for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
}
function sha256(str) {
    // secure context (https / localhost) → настоящий SHA-256
    if (global.crypto && global.crypto.subtle) {
        return global.crypto.subtle
            .digest('SHA-256', new TextEncoder().encode(str))
            .then(function (buf) {
                return Array.prototype.map.call(new Uint8Array(buf), function (b) {
                    return ('0' + b.toString(16)).slice(-2);
                }).join('');
            });
    }
    // фолбэк для file:// / http — djb2 (не крипто, только чтобы демо работало офлайн)
    var h = 5381;
    for (var i = 0; i < str.length; i++) { h = ((h << 5) + h) + str.charCodeAt(i); h |= 0; }
    return Promise.resolve('djb2$' + (h >>> 0).toString(16));
}

/* ---------- accounts ---------- */
function sessionUser() {
    var id = load(SESS_KEY, null);
    if (!id) return null;
    return load(USERS_KEY, []).filter(function (u) { return u.id === id; })[0] || null;
}
function register(name, email, pass) {
    var users = load(USERS_KEY, []);
    email = (email || '').trim().toLowerCase();
    name = (name || '').trim();
    if (name.length < 2) return Promise.reject(new Error('Введите имя (минимум 2 символа)'));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Promise.reject(new Error('Введите корректный e-mail'));
    if ((pass || '').length < 4) return Promise.reject(new Error('Пароль — минимум 4 символа'));
    if (users.some(function (u) { return u.email === email; }))
        return Promise.reject(new Error('Аккаунт с такой почтой уже зарегистрирован'));
    var salt = randSalt();
    return sha256(salt + ':' + pass).then(function (hash) {
        var u = {
            id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: name, email: email, salt: salt, hash: hash, created: Date.now()
        };
        users.push(u); store(USERS_KEY, users); store(SESS_KEY, u.id);
        currentUser = u; return u;
    });
}
function login(email, pass) {
    email = (email || '').trim().toLowerCase();
    var u = load(USERS_KEY, []).filter(function (x) { return x.email === email; })[0];
    if (!u) return Promise.reject(new Error('Пользователь с такой почтой не найден'));
    return sha256(u.salt + ':' + pass).then(function (hash) {
        if (hash !== u.hash) return Promise.reject(new Error('Неверный пароль'));
        store(SESS_KEY, u.id); currentUser = u; return u;
    });
}
function logout() { try { localStorage.removeItem(SESS_KEY); } catch (e) {} location.reload(); }
function ns(key) { return key + '::' + (currentUser ? currentUser.id : 'anon'); }

/* ---------- UI ---------- */
function injectStyles() {
    if (document.getElementById('lightauth-css')) return;
    var s = document.createElement('style');
    s.id = 'lightauth-css';
    s.textContent = [
        '#la-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;',
        'background:rgba(6,10,16,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-family:inherit;animation:la-fade .3s ease}',
        '@keyframes la-fade{from{opacity:0}}',
        '@keyframes la-rise{from{opacity:0;transform:translateY(22px) scale(.97)}}',
        '.la-card{width:100%;max-width:390px;background:linear-gradient(165deg,rgba(30,36,50,.96),rgba(14,18,28,.98));',
        'border:1px solid rgba(255,255,255,.10);border-radius:22px;padding:30px 28px;color:#f1f5f9;',
        'box-shadow:0 40px 90px -30px rgba(0,0,0,.8);animation:la-rise .45s cubic-bezier(.22,1,.36,1)}',
        '.la-brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}',
        '.la-ico{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:23px;',
        'background:color-mix(in srgb,var(--la-accent) 22%,transparent);border:1px solid color-mix(in srgb,var(--la-accent) 45%,transparent)}',
        '.la-brand h2{font-size:19px;font-weight:800;letter-spacing:-.3px;margin:0;line-height:1.15}',
        '.la-brand p{font-size:12px;color:#94a3b8;margin:2px 0 0}',
        '.la-tabs{display:grid;grid-template-columns:1fr 1fr;gap:5px;background:rgba(255,255,255,.05);padding:5px;border-radius:13px;margin-bottom:20px}',
        '.la-tab{padding:10px;border:0;border-radius:9px;background:transparent;color:#94a3b8;font-weight:700;font-size:13.5px;cursor:pointer;transition:all .22s;font-family:inherit}',
        '.la-tab.on{background:var(--la-accent);color:#fff;box-shadow:0 8px 20px -10px var(--la-accent)}',
        '.la-field{margin-bottom:13px}',
        '.la-field label{display:block;font-size:11px;letter-spacing:.6px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase}',
        '.la-field input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);',
        'background:rgba(255,255,255,.04);color:#f1f5f9;font-size:14.5px;outline:none;transition:border-color .2s;font-family:inherit}',
        '.la-field input:focus{border-color:var(--la-accent)}',
        '.la-hide{display:none!important}',
        '.la-err{min-height:18px;font-size:12.5px;color:#fb7185;margin:2px 0 12px;font-weight:600}',
        '.la-go{width:100%;padding:13px;border:0;border-radius:13px;background:var(--la-accent);color:#fff;',
        'font-weight:800;font-size:14.5px;cursor:pointer;transition:transform .2s,box-shadow .2s,opacity .2s;font-family:inherit;',
        'box-shadow:0 14px 30px -12px var(--la-accent)}',
        '.la-go:hover{transform:translateY(-2px)}.la-go:active{transform:scale(.98)}.la-go[disabled]{opacity:.6;cursor:default;transform:none}',
        '.la-note{text-align:center;font-size:11.5px;color:#64748b;margin-top:16px;line-height:1.5}',
        /* chip */
        '.la-chip{display:inline-flex;align-items:center;gap:9px;padding:5px 6px 5px 5px;border-radius:100px;',
        'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(6px)}',
        '.la-chip.la-fixed{position:fixed;top:14px;right:14px;z-index:9998}',
        '.la-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:13px;color:#fff;',
        'background:var(--la-accent);flex-shrink:0}',
        '.la-nm{font-size:12.5px;font-weight:700;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:inherit}',
        '.la-out{border:0;background:transparent;color:inherit;opacity:.55;cursor:pointer;font-size:15px;padding:2px 7px;border-radius:8px;transition:opacity .2s,background .2s;font-family:inherit}',
        '.la-out:hover{opacity:1;background:rgba(255,255,255,.08)}',
        '@media(max-width:480px){.la-nm{max-width:78px}}'
    ].join('');
    document.head.appendChild(s);
}

function buildChip() {
    if (!currentUser) return;
    var host = cfg.slot && document.querySelector(cfg.slot);
    var chip = document.createElement('div');
    chip.className = 'la-chip' + (host ? '' : ' la-fixed');
    var initial = (currentUser.name || '?').trim().charAt(0).toUpperCase();
    chip.innerHTML =
        '<span class="la-av">' + esc(initial) + '</span>' +
        '<span class="la-nm" title="' + esc(currentUser.email) + '">' + esc(currentUser.name) + '</span>' +
        '<button class="la-out" title="Выйти" aria-label="Выйти">⎋</button>';
    chip.querySelector('.la-out').addEventListener('click', logout);
    (host || document.body).appendChild(chip);
}

function renderGate(resolve) {
    injectStyles();
    var ov = document.createElement('div');
    ov.id = 'la-overlay';
    ov.style.setProperty('--la-accent', cfg.accent || '#6366f1');
    ov.innerHTML =
        '<div class="la-card" role="dialog" aria-modal="true">' +
            '<div class="la-brand"><div class="la-ico">' + esc(cfg.icon || '🔒') + '</div>' +
                '<div><h2>' + esc(cfg.title || 'Вход') + '</h2><p>' + esc(cfg.subtitle || '') + '</p></div></div>' +
            '<div class="la-tabs"><button class="la-tab on" data-m="login">Вход</button>' +
                '<button class="la-tab" data-m="reg">Регистрация</button></div>' +
            '<form id="la-form" autocomplete="on" novalidate>' +
                '<div class="la-field la-name la-hide"><label>Имя</label><input name="name" type="text" autocomplete="name" placeholder="Как к вам обращаться" /></div>' +
                '<div class="la-field"><label>E-mail</label><input name="email" type="email" autocomplete="email" placeholder="you@mail.com" /></div>' +
                '<div class="la-field"><label>Пароль</label><input name="pass" type="password" autocomplete="current-password" placeholder="••••••" /></div>' +
                '<div class="la-err" id="la-err"></div>' +
                '<button class="la-go" type="submit" id="la-go">Войти</button>' +
            '</form>' +
            '<p class="la-note">🔐 Регистрация локальная — данные и аккаунт хранятся<br>только в этом браузере и никуда не отправляются.</p>' +
        '</div>';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';

    var mode = 'login';
    var form = ov.querySelector('#la-form');
    var nameWrap = ov.querySelector('.la-name');
    var nameInput = form.name, emailInput = form.email, passInput = form.pass;
    var errEl = ov.querySelector('#la-err');
    var goBtn = ov.querySelector('#la-go');

    ov.querySelectorAll('.la-tab').forEach(function (t) {
        t.addEventListener('click', function () {
            mode = t.dataset.m;
            ov.querySelectorAll('.la-tab').forEach(function (x) { x.classList.remove('on'); });
            t.classList.add('on');
            nameWrap.classList.toggle('la-hide', mode !== 'reg');
            passInput.setAttribute('autocomplete', mode === 'reg' ? 'new-password' : 'current-password');
            goBtn.textContent = mode === 'reg' ? 'Создать аккаунт' : 'Войти';
            errEl.textContent = '';
        });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        errEl.textContent = '';
        goBtn.disabled = true;
        var done = function (u) {
            document.body.style.overflow = '';
            ov.remove();
            currentUser = u;
            buildChip();
            resolve(u);
        };
        var fail = function (err) { errEl.textContent = err.message || 'Ошибка'; goBtn.disabled = false; };
        if (mode === 'reg') register(nameInput.value, emailInput.value, passInput.value).then(done, fail);
        else login(emailInput.value, passInput.value).then(done, fail);
    });

    setTimeout(function () { emailInput.focus(); }, 80);
}

function init(options) {
    cfg = options || {};
    return new Promise(function (resolve) {
        var run = function () {
            var u = sessionUser();
            if (u) { currentUser = u; injectStyles(); buildChip(); resolve(u); }
            else renderGate(resolve);
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
        else run();
    });
}

global.Auth = {
    init: init,
    ns: ns,
    user: function () { return currentUser; },
    logout: logout
};

})(window);
