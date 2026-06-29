/**
 * septic-api.js
 * จัดการการเชื่อมต่อ Apps Script สำหรับโมดูล Septic CH4
 */
(function () {
  'use strict';

  const cfg = window.SEPTIC_CONFIG;

  /** คืน API URL จาก config กลาง */
  function getApiUrl() {
    return cfg.apiUrl || cfg.fallbackApiUrl;
  }

  /** เรียก Apps Script แบบ POST JSON */
  async function post(action, payload) {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      throw new Error('ยังไม่ได้ตั้งค่า API URL ใน config.js หรือ septic-config.js');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action,
        payload: payload || {}
      })
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);

      if (!data.success && data.status !== 'ok') {
        throw new Error(data.message || 'Apps Script returned success=false');
      }

      return data;
    } catch (err) {
      throw new Error(`อ่านผลลัพธ์จาก API ไม่ได้: ${err.message}`);
    }
  }

  /** บันทึกข้อมูลหลายแถว */
  function saveRecords(records) {
    return post(cfg.actions.save, { records }).then((result) => {
      if (!Number.isFinite(Number(result.inserted))) {
        throw new Error('Septic API endpoint ยังไม่พร้อม: ไม่พบค่า inserted จาก backend');
      }
      return result;
    });
  }

  /** อ่านข้อมูลสำหรับ Report */
  function getRecords(filters) {
    return post(cfg.actions.list, filters || {});
  }

  window.SepticApi = { saveRecords, getRecords };
}());
