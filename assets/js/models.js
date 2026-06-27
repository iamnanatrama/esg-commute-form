// =====================================================
// RAMA ESG DATA MODELS
// มาตรฐานโครงสร้างข้อมูลกลางของระบบ
// ใช้เพื่อป้องกัน field ตกหล่น และทำให้ทุกหน้าส่งข้อมูลรูปแบบเดียวกัน
// =====================================================

const CarbonModel = {
  // =====================================================
  // Employee Commuting Model
  // ต้องตรงกับ column เดิมใน Google Sheet: responses
  // ห้ามเปลี่ยนชื่อ field ถ้า Dashboard เดิมยังใช้อยู่
  // =====================================================
  createCommuting(overrides = {}) {
    return {
      timestamp: "",
      name: "",
      empid: "",
      dept: "",
      branch: "",
      origin: "",
      distance_km: 0,
      work_days: "",
      work_days_count: 0,
      vehicle: "",
      fuel: "",
      work_mode: "",
      wfh_days_per_week: "",
      carpool: "",
      co2_kg_per_year: 0,
      emission_factor: 0,

      // รองรับการเพิ่มข้อมูลในอนาคต โดยไม่กระทบ column เดิม
      ...overrides
    };
  }
};