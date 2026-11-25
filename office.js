// ★ 사무소 정보: 여기만 고치면 홈페이지와 계산기 모두에 반영됩니다
// 값을 '' 로 비워두면 해당 항목(문자 상담, 이메일 등)은 화면에서 숨겨집니다.
window.OFFICE = {
  brand: '안심상속센터',                 // 홈페이지 대표 이름 (로고 윗줄)
  domain: 'www.안심상속.com',
  name: '세무법인대교 WM & Consulting',  // 세무법인 상호 (로고 아랫줄)
  tax: '조근열 세무사',
  phone: '02-6949-0252',
  mobile: '',                            // 문자 상담용 휴대폰 (비우면 숨김)
  email: '',                             // 상담 이메일 (비우면 숨김)
  address: '서울 영등포구 양평로21길 26, 14층 1401호',
  bizNo: '279-85-01960',
  youtube: 'https://www.youtube.com/channel/UCbk_X-7CcC_xv5vH6Hm069A',   // 안심상속닷컴 채널
  blog: 'https://blog.naver.com/easyzip', // 네이버 블로그 주소
  consultUrl: '../index.html#consult',   // 계산기에서 상담신청으로 가는 주소
  consultEndpoint: 'https://script.google.com/macros/s/AKfycbz5N600zcD-PfG-KJcO-ZCGHDJcskIakMp1m201eMrVbPSvr6CwZzhAtYBlkDE80M5Kgg/exec' // 상담 신청 접수 주소 (구글 Apps Script 웹 앱 URL, tools/상담신청-연결방법.md 참고)
};
