/**
 * 안심상속센터 상담 신청 접수 (Google Apps Script)
 *
 * 홈페이지 상담 신청 폼의 내용을
 *   1) 이 스크립트가 붙은 구글 시트의 '상담신청' 탭에 한 줄씩 쌓고
 *   2) 아래 NOTIFY_EMAIL 주소로 알림 메일을 보냅니다.
 *
 * 설정 방법은 tools/상담신청-연결방법.md 를 보세요.
 */

// ★ 상담 신청 알림을 받을 이메일 주소 (여러 개면 쉼표로 구분)
//   비워두면 이 시트를 만든 구글 계정으로 알림이 갑니다.
const NOTIFY_EMAIL = '';

const SHEET_NAME = '상담신청';
const HEADERS = ['접수일시', '성함', '연락처', '상담 분야', '상황 설명', '접수 페이지', '처리 상태', '메모'];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // 스팸 방지: 사람에게는 보이지 않는 칸이 채워져 있으면 무시
  if (p.website) return reply_('ok');

  const name = clean_(p.name, 40);
  const tel = clean_(p.tel, 30);
  if (!name || tel.replace(/[^0-9]/g, '').length < 9) return reply_('invalid');

  const type = clean_(p.type, 40);
  const msg = clean_(p.msg, 2000);
  const page = clean_(p.page, 200);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }
    sh.appendRow([new Date(), name, tel, type, msg, page, '미확인', '']);
  } finally {
    lock.releaseLock();
  }

  MailApp.sendEmail({
    to: NOTIFY_EMAIL || Session.getEffectiveUser().getEmail(),
    subject: '[안심상속센터] 새 상담 신청 - ' + name + ' (' + (type || '분야 미선택') + ')',
    body:
      '홈페이지로 새 상담 신청이 들어왔습니다.\n\n' +
      '성함: ' + name + '\n' +
      '연락처: ' + tel + '\n' +
      '상담 분야: ' + type + '\n' +
      '상황 설명:\n' + (msg || '(없음)') + '\n\n' +
      '접수 페이지: ' + page + '\n' +
      '접수 시각: ' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm') + '\n\n' +
      '전체 목록: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  });

  return reply_('ok');
}

// 길이 제한 + 시트 수식 실행 방지 (=, +, -, @ 로 시작하면 글자로 저장)
function clean_(v, max) {
  let s = String(v || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function reply_(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}

// 설정 확인용: Apps Script 편집기에서 이 함수를 한 번 실행하면 시트에 테스트 줄이 생기고 메일이 옵니다.
function testSubmit() {
  doPost({ parameter: { name: '테스트', tel: '010-0000-0000', type: '상속세 신고', msg: '연결 테스트입니다.', page: 'test' } });
}
