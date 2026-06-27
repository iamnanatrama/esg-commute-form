// =====================================================
// RAMA ESG PLATFORM API
// ไฟล์นี้เป็นจุดกลางสำหรับเรียก Google Apps Script
// หน้า dashboard.html / commuting.html / calculate.html
// สามารถเรียกใช้ CarbonAPI จากไฟล์นี้ได้
// =====================================================

const CarbonAPI = {
  // =====================================================
  // ดึงข้อมูลการเดินทางจาก Google Sheet: responses
  // ใช้กับ dashboard.html
  // =====================================================
  async getCommutingData() {
    const url = APP_CONFIG.GOOGLE_SCRIPT_URL;

    const res = await fetch(
      url + (url.includes("?") ? "&" : "?") + "mode=dashboard&t=" + Date.now()
    );

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const json = await res.json();

    if (json.status && json.status !== "ok") {
      throw new Error(json.message || "Apps Script error");
    }

    return Array.isArray(json) ? json : (json.data || []);
  },

  // =====================================================
  // ส่งข้อมูลการเดินทางเข้า Google Sheet: responses
  // ใช้กับ commuting.html ในอนาคต
  // =====================================================
  async postCommutingData(payload) {
    const url = APP_CONFIG.GOOGLE_SCRIPT_URL;

    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    return await res.json();
  }
};