// =====================================================
// RAMA ESG HOME SUMMARY
// ดึง KPI หน้าแรกจาก Google Sheet ชุดเดิมผ่าน CarbonAPI
// =====================================================

(function () {
  const fmt = typeof ESGFormatter !== "undefined" ? ESGFormatter : {
    number(value, digits = 0) {
      return Number(value || 0).toLocaleString("th-TH", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      });
    }
  };

  document.addEventListener("DOMContentLoaded", loadHomeSummary);

  async function loadHomeSummary() {
    const totalCo2El = document.getElementById("glanceTotalCo2");
    const employeesEl = document.getElementById("glanceEmployees");
    const responsesEl = document.getElementById("glanceResponses");

    if (!totalCo2El || !employeesEl || !responsesEl) return;

    if (typeof CarbonAPI === "undefined" || typeof CarbonAPI.getCommutingData !== "function") {
      setUnavailable("ยังไม่ได้เชื่อมต่อ API");
      return;
    }

    try {
      const rows = await CarbonAPI.getCommutingData();
      const normalizedRows = rows.map(normalizeRow).filter(row => row.name || row.empid || row.co2 > 0);

      const totalCo2 = normalizedRows.reduce((sum, row) => sum + row.co2, 0);
      const activeEmployees = new Set(
        normalizedRows
          .map(row => row.empid || row.name)
          .filter(Boolean)
      ).size;

      totalCo2El.textContent = fmt.number(totalCo2, 0);
      employeesEl.textContent = fmt.number(activeEmployees, 0);
      responsesEl.textContent = fmt.number(normalizedRows.length, 0);
    } catch (error) {
      setUnavailable("โหลดข้อมูลไม่สำเร็จ");
      console.error("Home ESG summary load failed:", error);
    }
  }

  function normalizeRow(row) {
    return {
      name: row.name || row.Name || "",
      empid: row.empid || row.employee_id || row.EmpID || "",
      co2: number(row.co2_kg_per_year)
    };
  }

  function number(value) {
    const parsed = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function setUnavailable(message) {
    ["glanceTotalCo2", "glanceEmployees", "glanceResponses"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = message;
    });
  }
})();
