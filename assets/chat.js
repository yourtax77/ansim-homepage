/* 채팅형 간단 상담창 (모든 페이지 공통)
 * - 오른쪽 아래 버튼 → 대화하듯 상담 분야·상황·성함·연락처를 받아
 *   기존 상담 신청과 같은 구글 시트 + 알림 메일로 보냅니다 (office.js 의 consultEndpoint).
 * - 실시간 대화가 아니라, 남겨 주신 내용을 보고 세무사가 연락드리는 방식입니다.
 */
(function () {
  var O = window.OFFICE || {};
  if (window.__ansimChat) return;
  window.__ansimChat = true;

  var css = [
    '.ac-btn{position:fixed;right:20px;bottom:20px;z-index:60;display:flex;align-items:center;gap:8px;height:56px;padding:0 20px 0 16px;border:0;border-radius:999px;background:#1f4d45;color:#fff;font:700 15px/1 "Pretendard Variable",Pretendard,-apple-system,"Malgun Gothic",sans-serif;box-shadow:0 10px 26px rgba(23,60,53,.35);cursor:pointer;transition:transform .15s}',
    '.ac-btn:hover{transform:translateY(-2px)}',
    '.ac-btn svg{width:24px;height:24px;flex:none}',
    '.ac-btn .dot{position:absolute;top:8px;right:10px;width:9px;height:9px;border-radius:50%;background:#e9c98f;box-shadow:0 0 0 2px #1f4d45}',
    '.ac-win{position:fixed;right:20px;bottom:88px;z-index:61;width:370px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100vh - 120px);display:none;flex-direction:column;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.25);font-family:"Pretendard Variable",Pretendard,-apple-system,"Malgun Gothic",sans-serif;color:#1d2523;word-break:keep-all}',
    '.ac-win.open{display:flex}',
    '.ac-head{background:linear-gradient(140deg,#173c35,#1f4d45 60%,#2f6b5f);color:#fff;padding:16px 18px 14px;position:relative}',
    '.ac-head b{display:block;font-size:18px;letter-spacing:-.03em}',
    '.ac-head span{display:block;font-size:13px;opacity:.85;margin-top:4px}',
    '.ac-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:20px;line-height:34px;cursor:pointer}',
    '.ac-body{flex:1;overflow-y:auto;padding:16px 14px 8px;background:#f6f4ef}',
    '.ac-row{display:flex;gap:8px;margin-bottom:10px;align-items:flex-start}',
    '.ac-row.me{justify-content:flex-end}',
    '.ac-ava{width:32px;height:32px;border-radius:9px;flex:none;background:url(/favicon.svg) center/cover}',
    '.ac-msg{max-width:78%;background:#fff;border:1px solid #e3e0d8;border-radius:4px 14px 14px 14px;padding:10px 12px;font-size:14.5px;line-height:1.55;white-space:pre-line}',
    '.ac-row.me .ac-msg{background:#1f4d45;color:#fff;border-color:#1f4d45;border-radius:14px 4px 14px 14px}',
    '.ac-msg em{font-style:normal;font-weight:700;color:#1f4d45}',
    '.ac-chips{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 12px 40px}',
    '.ac-chips button{border:1.5px solid #1f4d45;background:#fff;color:#1f4d45;border-radius:999px;padding:7px 12px;font-family:inherit;font-size:13.5px;font-weight:600;line-height:1.2;cursor:pointer}',
    '.ac-chips button:hover{background:#e7f0ec}',
    '.ac-agree{margin:2px 0 12px 40px;background:#fff;border:1px solid #e3e0d8;border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.55;color:#5d6764}',
    '.ac-agree label{display:flex;gap:8px;align-items:flex-start;color:#1d2523;font-weight:600;cursor:pointer}',
    '.ac-agree input{margin-top:3px;width:16px;height:16px;flex:none}',
    '.ac-agree a{color:#1f4d45}',
    '.ac-agree button{margin-top:10px;width:100%;height:42px;border:0;border-radius:10px;background:#1f4d45;color:#fff;font-family:inherit;font-size:14.5px;font-weight:700;cursor:pointer}',
    '.ac-agree button:disabled{opacity:.45;cursor:default}',
    '.ac-foot{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #e3e0d8;background:#fff}',
    '.ac-foot textarea{flex:1;resize:none;overflow:hidden;height:44px;border:1px solid #e3e0d8;border-radius:10px;padding:11px 12px;font-family:inherit;font-size:15px;line-height:1.4;color:inherit;outline:none}',
    '.ac-foot textarea:focus{border-color:#1f4d45}',
    '.ac-foot textarea:disabled{background:#f3f3f1}',
    '.ac-foot button{width:46px;height:44px;flex:none;border:0;border-radius:10px;background:#1f4d45;color:#fff;cursor:pointer;display:grid;place-items:center}',
    '.ac-foot button:disabled{background:#c5cbc9;cursor:default}',
    '.ac-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
    '@media (max-width:760px){.ac-btn{bottom:84px;right:14px;height:52px;padding:0 16px 0 13px;font-size:14px}.ac-win{right:12px;left:12px;width:auto;max-width:none;bottom:12px;height:auto;top:72px;max-height:none}}',
    '@media print{.ac-btn,.ac-win{display:none!important}}'
  ].join('');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="2.6"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ac-btn';
  btn.setAttribute('aria-label', '채팅으로 상담 남기기');
  btn.innerHTML = ICON + '<span>채팅 상담</span><i class="dot"></i>';

  var win = document.createElement('section');
  win.className = 'ac-win';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', '안심상속센터 채팅 상담');
  win.innerHTML =
    '<div class="ac-head"><b>안심상속센터 상담</b><span>남겨 주시면 평일 9~18시에 세무사가 직접 연락드립니다</span>' +
    '<button type="button" class="ac-x" aria-label="닫기">×</button></div>' +
    '<div class="ac-body" aria-live="polite"></div>' +
    '<div class="ac-foot"><textarea rows="1" placeholder="위 버튼을 눌러 주세요" disabled></textarea>' +
    '<button type="button" aria-label="보내기" disabled>' + SEND + '</button></div>' +
    '<div class="ac-hp" aria-hidden="true"><input type="text" tabindex="-1" autocomplete="off"></div>';

  document.body.appendChild(btn);
  document.body.appendChild(win);

  var body = win.querySelector('.ac-body');
  var ta = win.querySelector('textarea');
  var sendBtn = win.querySelector('.ac-foot button');
  var hp = win.querySelector('.ac-hp input');
  var data = {};
  var onText = null;
  var started = false;
  var run = 0;  // 창을 새로 열 때마다 증가 (이전 대화의 늦은 응답 무시)

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function scroll() { body.scrollTop = body.scrollHeight; }
  function bot(html) {
    var r = document.createElement('div');
    r.className = 'ac-row';
    r.innerHTML = '<div class="ac-ava" aria-hidden="true"></div><div class="ac-msg">' + html + '</div>';
    body.appendChild(r); scroll();
  }
  function me(text) {
    var r = document.createElement('div');
    r.className = 'ac-row me';
    r.innerHTML = '<div class="ac-msg">' + esc(text) + '</div>';
    body.appendChild(r); scroll();
  }
  function chips(list, cb) {
    var w = document.createElement('div');
    w.className = 'ac-chips';
    list.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = t;
      b.onclick = function () { w.remove(); me(t); cb(t); };
      w.appendChild(b);
    });
    body.appendChild(w); scroll();
  }
  function ask(placeholder, cb) {
    ta.disabled = false; sendBtn.disabled = false;
    ta.placeholder = placeholder; ta.value = '';
    onText = cb;
    setTimeout(function () { ta.focus(); }, 50);
  }
  function lock(ph) { ta.disabled = true; sendBtn.disabled = true; ta.value = ''; ta.placeholder = ph || ''; onText = null; }
  function submitText() {
    var v = ta.value.trim();
    if (!onText || !v) return;
    var cb = onText;
    me(v); lock();
    var r = run;
    setTimeout(function () { if (r === run) cb(v); }, 250);
  }
  sendBtn.onclick = submitText;
  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submitText(); }
  });

  function start() {
    bot('안녕하세요, <em>안심상속센터</em>입니다.\n어떤 상담이 필요하신가요?');
    chips(['상속세 신고', '사전증여', '세무조사 대응', '일본·중국 상속', '기타 문의'], function (t) {
      data.type = t;
      var r = run;
      setTimeout(function () { if (r === run) stepMsg(); }, 300);
    });
  }
  function stepMsg() {
    bot('상황을 간단히 적어 주세요.\n예: 3월에 아버지가 돌아가셨고, 아파트 1채와 예금이 있어요.');
    ask('상황을 적어 주세요 (줄바꿈 Shift+Enter)', function (v) { data.msg = v; stepName(); });
  }
  function stepName() {
    bot('상담받으실 분의 <em>성함</em>을 알려 주세요.');
    ask('성함', function (v) { data.name = v.slice(0, 40); stepTel(); });
  }
  function stepTel(again) {
    bot(again ? '연락처를 다시 확인해 주세요. 숫자 9자리 이상으로 적어 주세요.'
      : data.name + '님, 연락받으실 <em>전화번호</em>를 알려 주세요.\n해외에 계시면 국가번호를 붙여 주세요. (예: +81-90-1234-5678)');
    ask('010-0000-0000', function (v) {
      if (v.replace(/[^0-9]/g, '').length < 9) { stepTel(true); return; }
      data.tel = v.slice(0, 30); stepAgree();
    });
  }
  function stepAgree() {
    bot('마지막으로 개인정보 수집·이용 동의가 필요합니다.');
    var w = document.createElement('div');
    w.className = 'ac-agree';
    w.innerHTML =
      '수집 항목: 성함, 연락처, 상담 내용 · 목적: 상담 연락 · 보관: 1년 후 파기<br>' +
      '<a href="/privacy/" target="_blank" rel="noopener">개인정보처리방침 보기</a>' +
      '<label style="margin-top:8px"><input type="checkbox"> 위 내용에 동의합니다</label>' +
      '<button type="button" disabled>상담 남기기</button>';
    var cb = w.querySelector('input'), go = w.querySelector('button');
    cb.onchange = function () { go.disabled = !cb.checked; };
    go.onclick = function () { go.disabled = true; cb.disabled = true; send(w); };
    body.appendChild(w); scroll();
    lock('아래 동의 후 상담 남기기를 눌러 주세요');
  }
  function send(box) {
    if (!O.consultEndpoint) { bot('지금은 접수가 어렵습니다. 전화(' + esc(O.phone || '') + ')로 문의해 주세요.'); return; }
    bot('보내는 중입니다…');
    var p = new URLSearchParams({
      name: data.name, tel: data.tel, type: data.type,
      msg: data.msg || '', page: location.pathname + ' (채팅 상담)', website: hp.value
    });
    var r = run;
    fetch(O.consultEndpoint, { method: 'POST', mode: 'no-cors', body: p })
      .then(function () {
        if (r !== run) return;
        box.remove();
        bot('<em>접수되었습니다.</em> 감사합니다.\n확인 후 평일 9~18시 안에 세무사가 직접 연락드리겠습니다.');
        lock('상담이 접수되었습니다');
      })
      .catch(function () {
        if (r !== run) return;
        bot('전송에 실패했습니다. 잠시 후 다시 시도하시거나 전화(' + esc(O.phone || '') + ')로 문의해 주세요.');
        box.querySelector('button').disabled = false;
        box.querySelector('input').disabled = false;
      });
  }

  function open() {
    win.classList.add('open'); btn.style.display = 'none';
    // 열 때마다 처음부터 새로 시작
    run++;
    body.innerHTML = '';
    data = {};
    lock('위 버튼을 눌러 주세요');
    started = true;
    start();
  }
  function close() { win.classList.remove('open'); btn.style.display = ''; }
  btn.onclick = open;
  win.querySelector('.ac-x').onclick = close;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && win.classList.contains('open')) close(); });
  // 페이지 안의 '채팅 상담' 버튼(data-chat)도 이 창을 엽니다
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-chat]');
    if (!a) return;
    e.preventDefault();
    open();
  });
  window.openAnsimChat = open;
})();
