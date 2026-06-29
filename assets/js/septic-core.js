/**
 * septic-core.js
 * รวมสูตรคำนวณและ utility ที่ใช้ร่วมกันระหว่างหน้า Form/Report
 */
(function () {
  'use strict';

  const cfg = window.SEPTIC_CONFIG;

  /** แปลงค่าเป็น number อย่างปลอดภัย ป้องกัน NaN */
  function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  /** ปัดทศนิยมให้เหมาะกับรายงาน */
  function round(value, digits = 4) {
    const factor = Math.pow(10, digits);
    return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
  }

  /** คืนเดือนย้อนหลังตามจำนวนที่ต้องการ รูปแบบ YYYY-MM */
  function getLastMonths(count = 12, baseDate = new Date()) {
    const months = [];
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    for (let i = count - 1; i >= 0; i -= 1) {
      const item = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push(`${item.getFullYear()}-${String(item.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }

  function normalizeMonth(value) {
    if (!value) return '';
    const text = String(value).trim();

    const yyyyMm = text.match(/^(\d{4})-(\d{2})$/);
    if (yyyyMm) return yyyyMm[0];

    const isoDateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoDateTime) {
      const date = new Date(text);
      if (Number.isNaN(date.getTime())) return `${isoDateTime[1]}-${isoDateTime[2]}`;
      date.setUTCDate(date.getUTCDate() + 1);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    }

    const isoDate = text.match(/^(\d{4})-(\d{2})-\d{2}/);
    if (isoDate) return `${isoDate[1]}-${isoDate[2]}`;

    return text;
  }

  /** แสดงชื่อเดือนภาษาไทยแบบอ่านง่าย */
  function formatMonthTh(yyyyMm) {
    const normalized = normalizeMonth(yyyyMm);
    if (!normalized || !normalized.includes('-')) return normalized || '-';
    const match = normalized.match(/^(\d{4})-(\d{2})$/);
    if (!match) return normalized || '-';
    const year = Number(match[1]);
    const month = Number(match[2]);
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat('th-TH', { month: 'short', year: 'numeric' }).format(date);
  }

  /** ดึง label สาขา */
  function getBranchLabel(value) {
    const found = cfg.branches.find((b) => b.value === value);
    return found ? found.labelTh : value || '-';
  }

  /** สูตรคำนวณกลางของ Septic Tank */
  function calculateSeptic(record, overrideFactors) {
    const factors = Object.assign({}, cfg.factors, overrideFactors || {});

    const employeeCount = toNumber(record.employee_count);
    const workDays = toNumber(record.work_days);
    const bod = toNumber(record.bod_kg_per_person_day, factors.bodKgPerPersonDay);
    const b0 = toNumber(record.b0_ch4_kg_per_kg_bod, factors.b0Ch4KgPerKgBod);
    const mcf = toNumber(record.mcf, factors.mcfSepticTank);
    const gwp = toNumber(record.gwp_ch4, factors.gwpCh4);
    const correction = toNumber(record.correction_factor, factors.correctionFactor);

    const activityDataBodKg = employeeCount * workDays * bod;
    const ch4Kg = activityDataBodKg * b0 * mcf * correction;
    const co2eKg = ch4Kg * gwp;

    return {
      activity_data_bod_kg: round(activityDataBodKg, 4),
      ch4_kg: round(ch4Kg, 4),
      co2e_kg: round(co2eKg, 4),
      co2e_ton: round(co2eKg / 1000, 6),
      factors_used: { bod, b0, mcf, gwp, correction }
    };
  }

  /** รวมยอดสำหรับหน้า Report */
  function summarize(records) {
    return records.reduce((acc, r) => {
      acc.rows += 1;
      acc.employee_count += toNumber(r.employee_count);
      acc.activity_data_bod_kg += toNumber(r.activity_data_bod_kg);
      acc.ch4_kg += toNumber(r.ch4_kg);
      acc.co2e_kg += toNumber(r.co2e_kg);
      acc.co2e_ton += toNumber(r.co2e_ton);
      return acc;
    }, {
      rows: 0,
      employee_count: 0,
      activity_data_bod_kg: 0,
      ch4_kg: 0,
      co2e_kg: 0,
      co2e_ton: 0
    });
  }

  /** Export CSV ฝั่ง Browser */
  function exportCsv(filename, rows) {
    const headers = [
      'month','branch','employee_count','work_days','bod_kg_per_person_day',
      'b0_ch4_kg_per_kg_bod','mcf','gwp_ch4','correction_factor',
      'activity_data_bod_kg','ch4_kg','co2e_kg','co2e_ton','remark','created_at'
    ];
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.join(',')].concat(
      rows.map((r) => headers.map((h) => escape(r[h])).join(','))
    ).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.SepticCore = {
    toNumber,
    round,
    getLastMonths,
    normalizeMonth,
    formatMonthTh,
    getBranchLabel,
    calculateSeptic,
    summarize,
    exportCsv
  };
}());
