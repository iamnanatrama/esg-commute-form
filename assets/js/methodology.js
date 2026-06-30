// =====================================================
// RAMA ESG METHODOLOGY
// แสดงสูตรและพารามิเตอร์จาก config/factor ที่ระบบใช้งานจริง
// =====================================================

(function () {
  document.addEventListener("DOMContentLoaded", renderMethodology);

  function renderMethodology() {
    renderSepticFactors();
    renderVehicleFactors();
    renderOtherFactors();
    setText("methodUpdated", new Date().toLocaleString("th-TH"));
  }

  function renderSepticFactors() {
    const target = document.getElementById("septicFactors");
    if (!target || typeof SEPTIC_CONFIG === "undefined") return;

    const f = SEPTIC_CONFIG.factors || {};
    const rows = [
      ["BOD per person", f.bodKgPerPersonDay, "kg BOD/person/day", "septic-config.js", "ต้องแนบเอกสารอ้างอิง/อนุมัติ"],
      ["B0 CH4", f.b0Ch4KgPerKgBod, "kg CH4/kg BOD", "septic-config.js", "ต้องแนบเอกสารอ้างอิง/อนุมัติ"],
      ["MCF septic tank", f.mcfSepticTank, "-", "septic-config.js", "ต้องแนบเอกสารอ้างอิง/อนุมัติ"],
      ["GWP CH4", f.gwpCh4, "kg CO2e/kg CH4", "septic-config.js", "ต้องระบุ version มาตรฐานที่เลือกใช้"],
      ["Correction factor", f.correctionFactor, "-", "septic-config.js", "ค่า default ระบบ"]
    ];

    target.innerHTML = rows.map(rowTemplate).join("");
  }

  function renderVehicleFactors() {
    const target = document.getElementById("vehicleFactors");
    if (!target || typeof EMISSION_FACTORS === "undefined" || !EMISSION_FACTORS.VEHICLE) return;

    const rows = [];
    Object.entries(EMISSION_FACTORS.VEHICLE).forEach(([vehicle, values]) => {
      Object.entries(values).forEach(([fuel, factor]) => {
        if (fuel === "default") {
          rows.push([vehicle, factor, "kg CO2e/km", "emission-factors.js", "default"]);
          return;
        }
        rows.push([`${vehicle} / ${fuel}`, factor, "kg CO2e/km", "emission-factors.js", "fuel-specific"]);
      });
    });

    target.innerHTML = rows.map(rowTemplate).join("");
  }

  function renderOtherFactors() {
    const target = document.getElementById("otherFactors");
    if (!target || typeof EMISSION_FACTORS === "undefined") return;

    const rows = [];
    Object.entries(EMISSION_FACTORS.GWP || {}).forEach(([name, value]) => {
      rows.push([`GWP ${name}`, value, "kg CO2e/kg gas", "emission-factors.js", "ต้องระบุ version มาตรฐาน"]);
    });
    Object.entries(EMISSION_FACTORS.ELECTRICITY || {}).forEach(([key, item]) => {
      rows.push([`Electricity ${key}`, item.ef, item.unit || "kg CO2e/kWh", "emission-factors.js", "รอเชื่อมข้อมูลกิจกรรม"]);
    });
    Object.entries(EMISSION_FACTORS.WATER || {}).forEach(([key, item]) => {
      rows.push([`Water ${key}`, item.ef, item.unit || "kg CO2e/m3", "emission-factors.js", "รอเชื่อมข้อมูลกิจกรรม"]);
    });

    target.innerHTML = rows.map(rowTemplate).join("");
  }

  function rowTemplate(row) {
    return `
      <tr>
        <td>${escapeHtml(row[0])}</td>
        <td><strong>${escapeHtml(row[1])}</strong></td>
        <td>${escapeHtml(row[2])}</td>
        <td>${escapeHtml(row[3])}</td>
        <td>${escapeHtml(row[4])}</td>
      </tr>
    `;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
