// =====================================================
// RAMA ESG FORMATTER
// ใช้จัดรูปแบบตัวเลข วันที่ และหน่วย Carbon ทั้งระบบ
// =====================================================

const ESGFormatter = {
  number(value, digits = 2) {
    return Number(value || 0).toLocaleString("th-TH", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  },

  kgCO2e(value) {
    return `${this.number(value, 2)} kgCO₂e`;
  },

  tCO2e(value) {
    return `${this.number(value, 3)} tCO₂e`;
  },

  dateTime(value = new Date()) {
    return new Date(value).toLocaleString("th-TH");
  },

  percent(value) {
    return `${this.number(value, 1)}%`;
  }
};