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
    const totalOrgCo2El = document.getElementById("glanceTotalOrgCo2");
    const commutingCo2El = document.getElementById("glanceCommutingCo2");
    const septicCo2El = document.getElementById("glanceSepticCo2");
    const employeesEl = document.getElementById("glanceEmployees");
    const coverageEl = document.getElementById("glanceCoverage");
    const lastUpdatedEl = document.getElementById("glanceLastUpdated");

    if (!totalOrgCo2El || !commutingCo2El || !septicCo2El || !employeesEl || !coverageEl) return;

    const results = await Promise.allSettled([
      loadCommutingSummary(),
      loadSepticSummary()
    ]);

    const commuting = results[0].status === "fulfilled" ? results[0].value : null;
    const septic = results[1].status === "fulfilled" ? results[1].value : null;
    const connectedModules = [commuting, septic].filter(Boolean).length;
    const totalOrgCo2 = (commuting ? commuting.co2 : 0) + (septic ? septic.co2 : 0);

    totalOrgCo2El.textContent = connectedModules ? fmt.number(totalOrgCo2, 0) : "รอข้อมูล";
    commutingCo2El.textContent = commuting ? fmt.number(commuting.co2, 0) : "รอข้อมูล";
    septicCo2El.textContent = septic ? fmt.number(septic.co2, 0) : "รอข้อมูล";
    employeesEl.textContent = commuting ? fmt.number(commuting.activeEmployees, 0) : "รอข้อมูล";
    coverageEl.textContent = `เชื่อมต่อแล้ว ${connectedModules} จาก 3 หมวด`;
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = `อัปเดตล่าสุด: ${new Date().toLocaleString("th-TH")}`;
    }

    if (results[0].status === "rejected") {
      console.error("Home commuting summary load failed:", results[0].reason);
    }

    if (results[1].status === "rejected") {
      console.error("Home septic summary load failed:", results[1].reason);
    }
  }

  async function loadCommutingSummary() {
    if (typeof CarbonAPI === "undefined" || typeof CarbonAPI.getCommutingData !== "function") {
      throw new Error("Commuting API is not available");
    }

    const rows = await CarbonAPI.getCommutingData();
    const normalizedRows = rows.map(normalizeCommutingRow).filter(row => row.name || row.empid || row.co2 > 0);
    const co2 = normalizedRows.reduce((sum, row) => sum + row.co2, 0);
    const activeEmployees = new Set(
      normalizedRows
        .map(row => row.empid || row.name)
        .filter(Boolean)
    ).size;

    return { co2, activeEmployees, rows: normalizedRows.length };
  }

  async function loadSepticSummary() {
    if (typeof SepticApi === "undefined" || typeof SepticApi.getRecords !== "function") {
      throw new Error("Septic API is not available");
    }

    const result = await SepticApi.getRecords({});
    const rows = Array.isArray(result.data) ? result.data : (Array.isArray(result.records) ? result.records : []);
    const summary = typeof SepticCore !== "undefined" && typeof SepticCore.summarize === "function"
      ? SepticCore.summarize(rows)
      : rows.reduce((acc, row) => acc + number(row.co2e_kg), 0);

    return {
      co2: typeof summary === "number" ? summary : number(summary.co2e_kg),
      rows: rows.length
    };
  }

  function normalizeCommutingRow(row) {
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

})();
