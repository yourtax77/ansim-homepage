// 안심상속닷컴 유튜브 채널의 최신 영상 목록을 받아 data/youtube.json 으로 저장합니다.
// 사용법:  node tools/update-youtube.js
// 홈페이지를 올린 뒤에는 이 스크립트를 하루 몇 번 자동 실행하도록 설정하면
// 새 영상이 홈페이지에 자동으로 반영됩니다.
const fs = require('fs');
const path = require('path');

const CHANNEL_ID = 'UCbk_X-7CcC_xv5vH6Hm069A';
const COUNT = 4;
const OUT = path.join(__dirname, '..', 'data', 'youtube.json');

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function main() {
  const res = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID);
  if (!res.ok) throw new Error('YouTube 피드 응답 오류: ' + res.status);
  const xml = await res.text();
  const entries = xml.split('<entry>').slice(1).map(function (e) {
    const pick = function (re) { const m = e.match(re); return m ? decode(m[1].trim()) : ''; };
    const id = pick(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const link = pick(/<link rel="alternate" href="([^"]+)"/);
    const short = /\/shorts\//.test(link);
    return {
      id: id,
      title: pick(/<title>([\s\S]*?)<\/title>/).replace(/\s*#shorts\s*$/i, ''),
      published: pick(/<published>([^<]+)<\/published>/),
      short: short,
      url: link || ('https://www.youtube.com/watch?v=' + id),
      // 직접 만든 표지가 들어 있는 고화질(1280×720) 썸네일. 쇼츠는 가운데 세로 부분만 잘라 보여줍니다.
      // (세로용 oardefault.jpg 는 표지 대신 영상 장면이 나오거나 회색 빈 이미지인 경우가 많아 쓰지 않음)
      thumb: 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg',
      thumbFallback: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'
    };
  }).filter(function (v) { return v.id; });

  entries.sort(function (a, b) { return b.published.localeCompare(a.published); });
  const out = { updated: new Date().toISOString(), channelId: CHANNEL_ID, videos: entries.slice(0, COUNT) };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('저장 완료: ' + out.videos.length + '개');
  out.videos.forEach(function (v) { console.log('- ' + v.published.slice(0, 10) + ' ' + v.title); });
}

main().catch(function (e) { console.error(e.message); process.exit(1); });
