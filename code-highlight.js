/*
 * 수업자료 코드 블록 구문 강조 (VS Code Dark+ 색상)
 * - 외부 라이브러리 없이 동작한다. 오프라인으로 열어도 색이 입혀진다.
 * - <pre><code> 안의 글자는 그대로 두고 색만 입힌다. 복사하면 원래 코드가 그대로 복사된다.
 * - 파이썬·JSON·셸 명령·오류 출력(Traceback)만 칠한다. 그 밖의 글(프롬프트 문서 등)은 건드리지 않는다.
 */
(function () {
  var css =
    'body pre code .hl-k{color:#c586c0}' +   /* if for return import 같은 흐름 키워드 */
    'body pre code .hl-d{color:#569cd6}' +   /* def class and or not in True False None */
    'body pre code .hl-s{color:#ce9178}' +   /* 문자열 */
    'body pre code .hl-x{color:#9cdcfe}' +   /* f-문자열 안의 {값} */
    'body pre code .hl-n{color:#b5cea8}' +   /* 숫자 */
    'body pre code .hl-m{color:#7ca668}' +   /* 주석 */
    'body pre code .hl-f{color:#dcdcaa}' +   /* 함수 이름 */
    'body pre code .hl-t{color:#4ec9b0}' +   /* 모듈·자료형 이름 */
    'body pre code .hl-v{color:#9cdcfe}' +   /* 변수 */
    'body pre code .hl-e{color:#f48771}';    /* 오류 */
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function set(str) {
    var o = {};
    str.split(' ').forEach(function (w) { o[w] = true; });
    return o;
  }
  var CTRL = set('if elif else for while break continue return try except finally with as import from pass raise assert yield del async await');
  var BLUE = set('def class lambda global nonlocal and or not in is True False None');
  var TYPES = set('int str float bool list dict set tuple bytes');
  var MODS = set('st requests pd re alt html random math json datetime os sys time');

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function sp(c, s) {
    return '<span class="hl-' + c + '">' + esc(s) + '</span>';
  }

  /* ---------- 파이썬 ---------- */
  var PY = /("""[\s\S]*?"""|'''[\s\S]*?''')|(#[^\n]*)|([rRbBfFuU]{0,2}(?:"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))|(\b\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?\b)|(@[A-Za-z_][\w.]*)|([A-Za-z_]\w*)|([\s\S])/g;

  function pyString(s) {
    if (/^[rRbBuU]*[fF]/.test(s)) {            // f-문자열이면 {값} 부분을 따로 칠한다
      var out = '', last = 0, m, re = /\{\{|\}\}|\{[^{}\n]*\}/g;
      while ((m = re.exec(s))) {
        out += sp('s', s.slice(last, m.index));
        out += (m[0] === '{{' || m[0] === '}}') ? sp('s', m[0]) : sp('x', m[0]);
        last = m.index + m[0].length;
      }
      return out + sp('s', s.slice(last));
    }
    return sp('s', s);
  }

  function python(code) {
    var out = '', m, prev = '';
    PY.lastIndex = 0;
    while ((m = PY.exec(code))) {
      if (m[1]) { out += sp('s', m[1]); prev = ''; }
      else if (m[2]) { out += sp('m', m[2]); }
      else if (m[3]) { out += pyString(m[3]); prev = ''; }
      else if (m[4]) { out += sp('n', m[4]); prev = ''; }
      else if (m[5]) { out += sp('f', m[5]); prev = ''; }
      else if (m[6]) {
        var w = m[6], rest = code.slice(PY.lastIndex, PY.lastIndex + 40), html;
        if (prev === 'def' || prev === 'class') html = sp('f', w);
        else if (CTRL[w]) html = sp('k', w);
        else if (BLUE[w]) html = sp('d', w);
        else if (/^[ \t]*\(/.test(rest)) html = sp(TYPES[w] ? 't' : 'f', w);
        else if (MODS[w] || TYPES[w]) html = sp('t', w);
        else html = sp('v', w);
        out += html; prev = w;
      } else {
        out += esc(m[7]);
        if (!/\s/.test(m[7])) prev = '';
      }
    }
    return out;
  }

  /* ---------- JSON ---------- */
  var JS = /("(?:\\.|[^"\\\n])*")(\s*:)?|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b|\bnull\b)|([\s\S])/g;
  function json(code) {
    var out = '', m;
    JS.lastIndex = 0;
    while ((m = JS.exec(code))) {
      if (m[1]) out += (m[2] ? sp('v', m[1]) + esc(m[2]) : sp('s', m[1]));
      else if (m[3]) out += sp('n', m[3]);
      else if (m[4]) out += sp('d', m[4]);
      else out += esc(m[5]);
    }
    return out;
  }

  /* ---------- 셸 명령 ---------- */
  function shell(code) {
    return code.split('\n').map(function (line) {
      var lead = line.match(/^\s*/)[0], body = line.slice(lead.length);
      if (!body) return esc(line);
      if (body.charAt(0) === '#') return esc(lead) + sp('m', body);
      var cm = body.match(/^(\S+)([\s\S]*)$/);
      var rest = cm[2].replace(/("[^"]*"|'[^']*')|(\s)(--?[A-Za-z][\w-]*)|(\s#.*$)/g, function (all, str, ws, flag, com) {
        if (str) return '\u0001s' + str + '\u0002';
        if (flag) return ws + '\u0001v' + flag + '\u0002';
        return '\u0001m' + com + '\u0002';
      });
      // 마커를 기준으로 조각내어 이스케이프한다
      var parts = rest.split(/(\u0001[smv][^\u0002]*\u0002)/), html = '';
      parts.forEach(function (p) {
        var mk = p.match(/^\u0001([smv])([^\u0002]*)\u0002$/);
        html += mk ? sp(mk[1], mk[2]) : esc(p);
      });
      return esc(lead) + sp('f', cm[1]) + html;
    }).join('\n');
  }

  /* ---------- 오류 출력 (Traceback) ---------- */
  function trace(code) {
    return code.split('\n').map(function (line) {
      var f = line.match(/^(\s*File )("[^"]*")(, line )(\d+)(.*)$/);
      if (f) return esc(f[1]) + sp('s', f[2]) + esc(f[3]) + sp('n', f[4]) + esc(f[5]);
      if (/^[A-Za-z]*(Error|Exception)\b/.test(line)) return sp('e', line);
      return esc(line);
    }).join('\n');
  }

  /* ---------- 코드 종류 판별 ---------- */
  var PY_HINTS = [
    /^\s*(def|class|import|from)\s+\S/m,
    /^\s*(if|elif|else|while|for|with|try|except|finally)\b[^\n]*:\s*(#.*)?$/m,
    /^\s*@[A-Za-z_]/m,
    /^\s*[A-Za-z_][\w.\[\]"']*\s*=(?!=)/m,
    /^\s*[A-Za-z_][\w.]*\(.*\)\s*(#.*)?$/m
  ];
  function detect(t) {
    var s = t.trim();
    if (/^Traceback \(most recent call last\)/.test(s)) return 'trace';
    if (/^[\[{]/.test(s)) {
      if (/"[^"\n]*"\s*:/.test(s) && s.indexOf("'") < 0) return 'json';
      return /['"]/.test(s) ? 'py' : null;
    }
    if (/^\s*(venv[\\\/]|source\s|\.[\\\/]|pip3?\s|python3?\s|py\s|streamlit\s+run|git\s|cd\s|npm\s)/m.test(t) &&
        !/^\s*(def|import|from)\s/m.test(t)) return 'sh';
    for (var i = 0; i < PY_HINTS.length; i++) if (PY_HINTS[i].test(t)) return 'py';
    return null;
  }

  var LANGS = { py: python, json: json, sh: shell, trace: trace };

  function isDark(el) {
    var c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (!c) return false;
    var a = c.length > 3 ? parseFloat(c[3]) : 1;
    if (a < 0.5) return false;
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 110;
  }

  document.querySelectorAll('pre > code').forEach(function (code) {
    if (code.children.length) return;           // 이미 다른 표시가 들어 있으면 건드리지 않는다
    var pre = code.parentNode;
    if (!isDark(pre)) return;                   // 어두운 코드 블록만 칠한다
    var text = code.textContent, lang = detect(text);
    if (!lang) return;
    code.innerHTML = LANGS[lang](text);
    code.setAttribute('data-lang', lang);
  });
})();
