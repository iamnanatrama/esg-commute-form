// =====================================================
// RAMA ESG EXECUTIVE DASHBOARD
// รวมภาพรวมองค์กรจาก module ที่เชื่อมข้อมูลจริงแล้ว
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

  document.addEventListener("DOMContentLoaded", loadExecutiveDashboard);

  async function loadExecutiveDashboard() {
    setText("sourceStatus", "กำลังโหลดข้อมูล...");

    const results = await Promise.allSettled([
      loadCommuting(),
      loadSeptic()
    ]);

    const commuting = results[0].status === "fulfilled" ? results[0].value : null;
    const septic = results[1].status === "fulfilled" ? results[1].value : null;
    const modules = [
      { key: "commuting", label: "Employee Commuting", ready: !!commuting, co2: commuting ? commuting.co2 : 0, color: "#118451" },
      { key: "septic", label: "Septic CH4", ready: !!septic, co2: septic ? septic.co2 : 0, color: "#ff7a00" },
      { key: "electricity", label: "Electricity", ready: false, co2: 0, color: "#126fd0" }
    ];

    const readyModules = modules.filter(module => module.ready);
    const totalCo2 = readyModules.reduce((sum, module) => sum + module.co2, 0);

    setText("kpiTotalCo2", fmt.number(totalCo2, 0));
    setText("kpiCoverage", `เชื่อมต่อแล้ว ${readyModules.length} จาก ${modules.length} หมวด`);
    setText("kpiCommuting", commuting ? fmt.number(commuting.co2, 0) : "รอข้อมูล");
    setText("kpiSeptic", septic ? fmt.number(septic.co2, 0) : "รอข้อมูล");
    setText("kpiEmployees", commuting ? fmt.number(commuting.activeEmployees, 0) : "รอข้อมูล");
    setText("sourceStatus", "Google Sheet / Apps Script");
    setText("lastUpdated", new Date().toLocaleString("th-TH"));

    renderModuleCards(modules);
    renderModuleChart(modules);
    renderMonthlyTrend(commuting, septic);

    if (results[0].status === "rejected") console.error("Commuting dashboard load failed:", results[0].reason);
    if (results[1].status === "rejected") console.error("Septic dashboard load failed:", results[1].reason);
  }

  async function loadCommuting() {
    if (typeof CarbonAPI === "undefined" || typeof CarbonAPI.getCommutingData !== "function") {
      throw new Error("Commuting API is not available");
    }

    const rows = await CarbonAPI.getCommutingData();
    const normalized = rows.map(row => ({
      timestamp: row.timestamp || row.Timestamp || "",
      name: row.name || row.Name || "",
      empid: row.empid || row.employee_id || row.EmpID || "",
      co2: number(row.co2_kg_per_year)
    })).filter(row => row.name || row.empid || row.co2 > 0);

    return {
      co2: normalized.reduce((sum, row) => sum + row.co2, 0),
      activeEmployees: new Set(normalized.map(row => row.empid || row.name).filter(Boolean)).size,
      monthly: groupMonthly(normalized, "timestamp", "co2")
    };
  }

  async function loadSeptic() {
    if (typeof SepticApi === "undefined" || typeof SepticApi.getRecords !== "function") {
      throw new Error("Septic API is not available");
    }

    const result = await SepticApi.getRecords({});
    const rows = Array.isArray(result.data) ? result.data : (Array.isArray(result.records) ? result.records : []);
    const summary = typeof SepticCore !== "undefined" && typeof SepticCore.summarize === "function"
      ? SepticCore.summarize(rows)
      : { co2e_kg: rows.reduce((sum, row) => sum + number(row.co2e_kg), 0) };

    return {
      co2: number(summary.co2e_kg),
      monthly: groupMonthly(rows, "month", "co2e_kg")
    };
  }

  function renderModuleCards(modules) {
    const wrap = document.getElementById("moduleCards");
    if (!wrap) return;

    wrap.innerHTML = modules.map(module => `
      <article class="module-card ${module.ready ? "ready" : "pending"}" style="--module-color:${module.color}">
        <div>
          <strong>${escapeHtml(module.label)}</strong>
          <span>${module.ready ? "เชื่อมข้อมูลแล้ว" : "รอข้อมูล"}</span>
        </div>
        <b>${module.ready ? fmt.number(module.co2, 0) + " kg CO2e" : "Pending"}</b>
      </article>
    `).join("");
  }

  function renderModuleChart(modules) {
    const ready = modules.filter(module => module.ready);
    chart("moduleChart", "doughnut", ready.map(module => module.label), ready.map(module => module.co2), ready.map(module => module.color));
  }

  function renderMonthlyTrend(commuting, septic) {
    const months = Array.from(new Set([
      ...Object.keys(commuting ? commuting.monthly : {}),
      ...Object.keys(septic ? septic.monthly : {})
    ])).sort().slice(-12);

    const values = months.map(month =>
      (commuting && commuting.monthly[month] ? commuting.monthly[month] : 0) +
      (septic && septic.monthly[month] ? septic.monthly[month] : 0)
    );

    chart("trendChart", "line", months, values, ["#118451"]);
  }

  function chart(id, type, labels, values, colors) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === "undefined") return;

    new Chart(canvas, {
      type,
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: colors[0],
          backgroundColor: type === "line" ? "rgba(17,132,81,.12)" : colors,
          borderWidth: 2,
          tension: .35,
          fill: type === "line"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: type === "doughnut" },
          tooltip: { callbacks: { label: item => `${item.label || "CO2e"}: ${fmt.number(item.raw, 1)} kg CO2e` } }
        },
        scales: type === "doughnut" ? {} : {
          y: { beginAtZero: true, grid: { color: "#e7eef1" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function groupMonthly(rows, dateKey, valueKey) {
    return rows.reduce((map, row) => {
      const month = normalizeMonth(row[dateKey]);
      if (!month) return map;
      map[month] = (map[month] || 0) + number(row[valueKey]);
      return map;
    }, {});
  }

  function normalizeMonth(value) {
    if (!value) return "";
    const text = String(value);
    const yyyyMm = text.match(/^(\d{4})-(\d{2})/);
    if (yyyyMm) return `${yyyyMm[1]}-${yyyyMm[2]}`;
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function number(value) {
    const parsed = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
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
