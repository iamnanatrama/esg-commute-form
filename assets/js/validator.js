// =====================================================
// RAMA ESG VALIDATOR
// ใช้ตรวจสอบข้อมูลก่อนส่งเข้า Google Sheet
// เป้าหมาย: ป้องกันข้อมูลว่าง / ผิดรูปแบบ / ค่าติดลบ
// =====================================================

const ESGValidator = {
  isEmpty(value) {
    return value === undefined || value === null || String(value).trim() === "";
  },

  isPositiveNumber(value) {
    return !isNaN(value) && Number(value) > 0;
  },

  validateCommuting(payload) {
    const errors = [];

    if (this.isEmpty(payload.name)) {
      errors.push("กรุณากรอกชื่อพนักงาน");
    }

    if (this.isEmpty(payload.empid)) {
      errors.push("กรุณากรอกรหัสพนักงาน");
    }

    if (this.isEmpty(payload.dept)) {
      errors.push("กรุณาเลือกแผนก");
    }

    if (this.isEmpty(payload.branch)) {
      errors.push("กรุณากรอกสาขา");
    }

    if (!this.isPositiveNumber(payload.distance_km)) {
      errors.push("ระยะทางต้องมากกว่า 0");
    }

    if (this.isEmpty(payload.vehicle)) {
      errors.push("กรุณาเลือกประเภทยานพาหนะ");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};