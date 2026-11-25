/*
 * 상속세 계산 로직 (2026년 현행 상속세 및 증여세법 기준, 피상속인 거주자)
 * 화면(index.html)과 분리해 두어, 세법이 바뀌면 이 파일만 고치면 됩니다.
 * 모든 금액 단위: 원
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InheritCalc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var 억 = 100000000;
  var 만 = 10000;

  // 상증법 제26조 세율 (과세표준 상한, 세율, 누진공제)
  var BRACKETS = [
    { upTo: 1 * 억, rate: 0.10, deduct: 0 },
    { upTo: 5 * 억, rate: 0.20, deduct: 1000 * 만 },
    { upTo: 10 * 억, rate: 0.30, deduct: 6000 * 만 },
    { upTo: 30 * 억, rate: 0.40, deduct: 16000 * 만 },
    { upTo: Infinity, rate: 0.50, deduct: 46000 * 만 }
  ];

  function n(v) {
    v = Number(v);
    return isFinite(v) && v > 0 ? v : 0;
  }
  function floor(v) { return Math.floor(v); }

  function taxOnBase(base) {
    for (var i = 0; i < BRACKETS.length; i++) {
      var b = BRACKETS[i];
      if (base <= b.upTo) {
        return { tax: floor(base * b.rate - b.deduct), rate: b.rate, deduct: b.deduct };
      }
    }
  }

  // 금융재산 상속공제 (제22조)
  function financialDeduction(netFin) {
    if (netFin <= 2000 * 만) return netFin;
    if (netFin <= 1 * 억) return 2000 * 만;
    return Math.min(floor(netFin * 0.2), 2 * 억);
  }

  /**
   * 신고기한: 상속개시일이 속하는 달의 말일부터 6개월(국외 주소 9개월)
   * @param {string} deathDate 'YYYY-MM-DD'
   */
  function filingDeadline(deathDate, abroad) {
    if (!deathDate) return null;
    var p = String(deathDate).split('-');
    if (p.length !== 3) return null;
    var y = +p[0], m = +p[1] - 1;
    var months = abroad ? 9 : 6;
    // 말일부터 N개월이 되는 날 = (사망월 + N)월의 말일
    var d = new Date(y, m + months + 1, 0);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  /**
   * @param {object} i 입력값
   *  realEstate, financial, otherAssets           상속재산
   *  financialDebt, otherDebt                     채무
   *  funeral, enshrine                            장례비, 봉안시설비
   *  giftToHeirs, giftToOthers                    사전증여 (상속인 10년 / 비상속인 5년)
   *  giftExemptions                               사전증여 당시 증여재산공제 합계
   *  giftTaxPaid                                  사전증여 증여세 산출세액 합계
   *  hasSpouse, spouseActual                      배우자 유무, 배우자가 실제 받을 금액(비우면 법정지분)
   *  children, minorAges[], ascendants            자녀 수, 미성년자 나이 목록, 직계존속 수
   *  elderly, disabledYears                       65세 이상 인원, 장애인 기대여명 합계(년)
   *  cohabitHouse, houseValue                     동거주택 요건, 주택가액(담보채무 차감 후)
   *  skipGenAmount, skipGenMinorOver20          세대생략 상속분, 미성년+20억 초과 여부
   *  lateFiling                                   신고기한 내 미신고
   */
  function calculate(i) {
    var steps = [];
    var notes = [];

    // ── 1. 상속세 과세가액 (제13조~제14조)
    var realEstate = n(i.realEstate), financial = n(i.financial), otherAssets = n(i.otherAssets);
    var gross = realEstate + financial + otherAssets;
    var debts = n(i.financialDebt) + n(i.otherDebt);

    var nonResident = !!i.nonResident;

    // 장례비용: 비거주자 피상속인은 공제 대상이 아님 (제14조②)
    var funeralTotal = 0;
    if (!nonResident) {
      var funeralDed = Math.min(Math.max(n(i.funeral), 500 * 만), 1000 * 만);
      var enshrineDed = Math.min(n(i.enshrine), 500 * 만);
      funeralTotal = funeralDed + enshrineDed;
    }

    var netEstate = Math.max(0, gross - debts - funeralTotal); // 상속재산에서 뺀 뒤 0 미만은 0
    if (gross - debts - funeralTotal < 0) {
      notes.push('채무·장례비가 상속재산보다 많아 차감 후 금액을 0원으로 보았습니다. 초과 채무는 사전증여재산에서 빼지 않습니다.');
    }
    var giftToHeirs = n(i.giftToHeirs), giftToOthers = n(i.giftToOthers);
    var gifts = giftToHeirs + giftToOthers;
    var taxableValue = netEstate + gifts;

    // ── 2. 상속공제
    var children = Math.floor(n(i.children));
    var ascendants = Math.floor(n(i.ascendants));
    var hasSpouse = !!i.hasSpouse;
    var spouseOnly = hasSpouse && children === 0 && ascendants === 0;

    var minorAges = (i.minorAges || []).map(function (a) { return Math.floor(n(a)); });
    var minorDed = minorAges.reduce(function (s, age) {
      return s + Math.max(0, 19 - age) * 1000 * 만;
    }, 0);
    var personal = children * 5000 * 만 + minorDed + Math.floor(n(i.elderly)) * 5000 * 만 +
      Math.floor(n(i.disabledYears)) * 1000 * 만;
    var basicPlusPersonal = 2 * 억 + personal;

    var lump, lumpLabel;
    if (nonResident) {
      lump = 2 * 억;
      lumpLabel = '비거주자: 기초공제 2억원만 적용 (일괄·인적·배우자·금융재산공제 없음)';
    } else if (spouseOnly) {
      lump = basicPlusPersonal;
      lumpLabel = '배우자 단독상속: 일괄공제 불가, 기초공제 2억 + 인적공제';
    } else if (i.lateFiling) {
      lump = 5 * 억;
      lumpLabel = '신고기한 내 무신고: 일괄공제 5억만 적용';
    } else if (basicPlusPersonal > 5 * 억) {
      lump = basicPlusPersonal;
      lumpLabel = '기초공제 2억 + 인적공제 ' + personal.toLocaleString('ko-KR') + '원 (일괄공제 5억보다 유리)';
    } else {
      lump = 5 * 억;
      lumpLabel = '일괄공제 5억 (기초 2억 + 인적공제 ' + personal.toLocaleString('ko-KR') + '원보다 유리)';
    }

    // 배우자상속공제 (제19조)
    var spouseDed = 0, spouseLabel = '';
    var spouseShare = 0;
    if (hasSpouse && !nonResident) {
      var others = children > 0 ? children : ascendants;
      spouseShare = others > 0 ? 1.5 / (1.5 + others) : 1;
      var limitBase = netEstate + giftToHeirs;
      var legalLimit = Math.min(floor(limitBase * spouseShare), 30 * 억);
      var hasActual = i.spouseActual !== undefined && i.spouseActual !== null && i.spouseActual !== '';
      var actual = hasActual ? n(i.spouseActual) : floor(netEstate * spouseShare);
      if (actual < 5 * 억) {
        spouseDed = 5 * 억;
        spouseLabel = '실제 상속분 ' + actual.toLocaleString('ko-KR') + '원 < 5억 → 최소 5억 공제';
      } else {
        spouseDed = Math.max(5 * 억, Math.min(actual, legalLimit));
        spouseLabel = (hasActual ? '배우자 실제 상속분' : '법정상속분만큼 받는다고 가정') +
          ' · 한도 ' + legalLimit.toLocaleString('ko-KR') + '원 (최소 5억 · 최대 30억)';
      }
      if (!hasActual) {
        notes.push('배우자상속공제는 배우자가 법정상속분만큼 받는다고 가정했습니다. 실제로는 상속재산 분할 결과와 신고기한 다음 날부터 9개월 내 분할·등기 여부에 따라 달라집니다.');
      }
    }

    // 금융재산 상속공제
    var netFin = Math.max(0, financial - n(i.financialDebt));
    var finDed = nonResident ? 0 : financialDeduction(netFin);

    // 동거주택 상속공제 (제23조의2) — 거주자만
    var houseDed = (!nonResident && i.cohabitHouse) ? Math.min(n(i.houseValue), 6 * 억) : 0;

    var totalDed = lump + spouseDed + finDed + houseDed;

    // 공제 적용 종합한도 (제24조)
    var giftBase = Math.max(0, gifts - n(i.giftExemptions));
    var dedLimit = taxableValue - (taxableValue > 5 * 억 ? giftBase : 0);
    dedLimit = Math.max(0, dedLimit);
    var appliedDed = Math.min(totalDed, dedLimit);
    var limited = appliedDed < totalDed;

    // ── 3. 세액
    var taxBase = Math.max(0, taxableValue - appliedDed);
    if (taxBase < 50 * 만) taxBase = 0; // 과세최저한 (제25조②)
    var t = taxBase > 0 ? taxOnBase(taxBase) : { tax: 0, rate: 0, deduct: 0 };
    var computed = t.tax;

    // 세대생략 할증 (제27조)
    var skipAmt = n(i.skipGenAmount);
    var surcharge = 0;
    if (skipAmt > 0 && taxableValue > 0) {
      var ratio = Math.min(1, skipAmt / taxableValue);
      var rateUp = (i.skipGenMinorOver20 && skipAmt > 20 * 억) ? 0.4 : 0.3;
      surcharge = floor(computed * ratio * rateUp);
    }

    // 증여세액공제 (제28조) — 한도: 산출세액 × 사전증여 과세표준 / 상속세 과세표준
    var giftCreditIn = n(i.giftTaxPaid);
    var giftCreditLimit = taxBase > 0 ? floor(computed * Math.min(1, giftBase / taxBase)) : 0;
    var giftCredit = Math.min(giftCreditIn, giftCreditLimit);

    // 외국납부세액공제 (제29조) — 거주자 피상속인의 해외재산에 외국에서 낸 상속세
    // 한도: 산출세액 × (해외재산 과세표준 상당액 / 상속세 과세표준) → 해외재산 비율로 근사
    var foreignAssets = nonResident ? 0 : Math.min(n(i.foreignAssets), gross);
    var foreignTaxIn = nonResident ? 0 : n(i.foreignTaxPaid);
    var foreignCreditLimit = (gross > 0 && foreignAssets > 0) ? floor(computed * foreignAssets / gross) : 0;
    var foreignCredit = Math.min(foreignTaxIn, foreignCreditLimit);
    if (foreignTaxIn > 0 && foreignAssets === 0) {
      notes.push('외국에서 낸 상속세를 공제받으려면 해외 재산 금액을 함께 입력해 주세요.');
    }

    if (nonResident) {
      notes.push('돌아가신 분이 비거주자이면 한국에 있는 재산만 과세되고, 기초공제 2억원 외의 공제(일괄·배우자·금융재산 등)와 장례비 공제를 받을 수 없습니다. 거주자·비거주자 판정은 주소와 183일 이상 거소 여부 등 사실관계로 정해집니다.');
    }

    var beforeFiling = Math.max(0, computed + surcharge - giftCredit - foreignCredit);
    var filingCredit = i.lateFiling ? 0 : floor(beforeFiling * 0.03);
    var finalTax = Math.max(0, beforeFiling - filingCredit);

    if (finalTax > 2000 * 만) {
      notes.push('납부세액이 2,000만원을 넘어 연부연납(최대 10년, 신고기한 내 신청·납세담보 필요)과 분납을 검토할 수 있습니다.');
    }

    return {
      gross: gross, debts: debts, funeralTotal: funeralTotal, netEstate: netEstate,
      gifts: gifts, taxableValue: taxableValue,
      lump: lump, lumpLabel: lumpLabel, lumpIsBasic: lumpLabel.indexOf('기초공제 2억 +') === 0 || spouseOnly, personal: personal,
      spouseDed: spouseDed, spouseLabel: spouseLabel, spouseShare: spouseShare,
      netFin: netFin, finDed: finDed, houseDed: houseDed,
      totalDed: totalDed, dedLimit: dedLimit, appliedDed: appliedDed, limited: limited,
      taxBase: taxBase, rate: t.rate, progressiveDeduct: t.deduct, computed: computed,
      surcharge: surcharge, giftCredit: giftCredit, giftCreditIn: giftCreditIn,
      foreignCredit: foreignCredit, foreignTaxIn: foreignTaxIn, nonResident: nonResident,
      filingCredit: filingCredit, finalTax: finalTax,
      notes: notes
    };
  }

  return { calculate: calculate, taxOnBase: taxOnBase, financialDeduction: financialDeduction, filingDeadline: filingDeadline, BRACKETS: BRACKETS };
});
