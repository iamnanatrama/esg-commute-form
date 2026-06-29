/**
 * septic-config.js
 * จุดแก้ไขหลักของระบบคำนวณ CH4/CO2e จากการใช้ห้องน้ำแบบ Septic Tank
 * หมายเหตุ: ห้ามใส่ Secret/API Key ในไฟล์นี้
 */
window.SEPTIC_CONFIG = {
  /**
   * URL ของ Apps Script Web App สำหรับ septic เท่านั้น
   * ไม่ใช้ config.js เพราะ config.js เป็น endpoint ของ commuting/responses เดิม
   */
  apiUrl: 'https://script.google.com/macros/s/AKfycbxVqRiVcHPJNZYeDTcOIKmcyn7OnjWn9STKSLrFOjk3jzNZw68DqopIUN8hsUMG0bGFGg/exec', // TODO: ใส่ Apps Script Web App URL ของระบบ septic ที่นี่ เช่น https://script.google.com/macros/s/xxxxx/exec
  fallbackApiUrl: '',

  appName: 'Rama ESG Septic CH4 Calculator',
  sheetName: 'septic_ch4_records',

  branches: [
    { value: 'Mahachai', labelTh: 'มหาชัย', labelEn: 'Mahachai' },
    { value: 'Rama9', labelTh: 'พระราม 9', labelEn: 'Rama 9' }
  ],

  /**
   * สูตร: CH4 kg = employee_count × work_days × BOD × B0 × MCF × correction_factor
   * CO2e kg = CH4 kg × GWP_CH4
   * แก้สูตร/ค่ากลางได้จาก object นี้ โดยไม่ต้องไล่แก้หน้า HTML
   */
  factors: {
    bodKgPerPersonDay: 0.04, // kg BOD/person/day - ค่า default สำหรับเริ่มต้น ควรปรับตามเอกสารองค์กร/Consultant
    b0Ch4KgPerKgBod: 0.6,   // kg CH4/kg BOD
    mcfSepticTank: 0.5,      // Methane Correction Factor สำหรับ septic tank
    gwpCh4: 28,              // GWP100 CH4; ปรับตามมาตรฐานรายงานที่องค์กรเลือกใช้
    correctionFactor: 1
  },

  actions: {
    save: 'saveSepticRecords',
    list: 'getSepticRecords'
  }
};
