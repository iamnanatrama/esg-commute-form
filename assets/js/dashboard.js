const DEFAULT_API_URL = APP_CONFIG.GOOGLE_SCRIPT_URL;
 
	let rawData = [];
    let charts = {};
    let employeePage = 1;
    let employeeCurrentRows = [];
	const EMPLOYEE_PAGE_SIZE = 10;
    
	// =====================================================
// FORMATTER
// ใช้ ESGFormatter จาก assets/js/formatter.js
// เพื่อให้รูปแบบตัวเลขทั้งระบบเหมือนกัน
// =====================================================
const fmt = {
  format(value) {
    return ESGFormatter.number(value, 0);
  }
};

const fmt1 = {
  format(value) {
    return ESGFormatter.number(value, 1);
  }
};

    document.addEventListener("DOMContentLoaded", () => {
      loadData();
    });

    async function loadData() {
      const url = DEFAULT_API_URL;
	  
      if (!url) { 
		return showNotice("ยังไม่ได้ใส่ Google Apps Script Web App URL");
	  }
	  
      document.getElementById("app").classList.add("loading");
	  
      try {
       
		// =====================================================
		// โหลดข้อมูลผ่าน CarbonAPI
		// ตอนนี้ CarbonAPI ถูกย้ายไปอยู่ใน assets/js/api.js แล้ว
		// =====================================================
		
		rawData = await CarbonAPI.getCommutingData();

        rawData = rawData
			.map(normalizeRow)
			.filter(r => r.name || r.empid || r.co2 > 0);
			
        document.getElementById("sourceStatus").textContent = "Connected · " + rawData.length + " records";
        document.getElementById("lastUpdated").textContent = new Date().toLocaleString("th-TH");
        hideNotice();
        buildFilters();
        render();
      } catch (err) {
        showNotice("โหลดข้อมูลไม่สำเร็จ: " + err.message + " — ตรวจสอบ Apps Script URL, Permission, และ doGet()");
        document.getElementById("sourceStatus").textContent = "Connection failed";
      } finally {
        document.getElementById("app").classList.remove("loading");
      }
    }

    function normalizeRow(r) {
      return {
        timestamp: r.timestamp || r.Timestamp || "",
        name: r.name || r.Name || "",
        empid: r.empid || r.employee_id || r.EmpID || "",
        dept: r.dept || r.department || r.Department || "ไม่ระบุ",
        branch: normalizeBranch(r.branch || r.Branch || "ไม่ระบุ"),
        origin: r.origin || "",
        distance: num(r.distance_km),
        workDaysCount: num(r.work_days_count),
        vehicle: r.vehicle || r.Vehicle || "ไม่ระบุ",
        fuel: r.fuel || "",
        workMode: r.work_mode || "",
        carpool: r.carpool || "",
        co2: num(r.co2_kg_per_year),
        factor: num(r.emission_factor)
      };
    }

    function normalizeBranch(v) {
      const s = String(v || "").trim();
      const low = s.toLowerCase();
      if (low.includes("rama") || low.includes("พระราม") || low.includes("9")) return "Rama 9";
      if (low.includes("mahachai") || low.includes("มหาชัย")) return "Mahachai";
      return s || "ไม่ระบุ";
    }

    function num(v) {
      const n = Number(String(v ?? "").replace(/,/g, ""));
      return isNaN(n) ? 0 : n;
    }

    function getFilteredData() {
      const branch = document.getElementById("branchFilter").value;
      const dept = document.getElementById("deptFilter").value;
      return rawData.filter(r => (!branch || r.branch === branch) && (!dept || r.dept === dept));
    }

    function buildFilters() {
      const branchEl = document.getElementById("branchFilter");
      const deptEl = document.getElementById("deptFilter");
      const currentBranch = branchEl.value;
      const currentDept = deptEl.value;
      const branches = [...new Set(rawData.map(r => r.branch).filter(Boolean))].sort();
      const depts = [...new Set(rawData.map(r => r.dept).filter(Boolean))].sort();
      branchEl.innerHTML = '<option value="">All Branches</option>' + branches.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
      deptEl.innerHTML = '<option value="">All Departments</option>' + depts.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
      branchEl.value = branches.includes(currentBranch) ? currentBranch : "";
      deptEl.value = depts.includes(currentDept) ? currentDept : "";
      branchEl.onchange = () => { employeePage = 1; render(); };
      deptEl.onchange = () => { employeePage = 1; render(); };
    }

    function render() {
      const data = getFilteredData();
      const totalCo2 = sum(data, "co2");
      const responses = data.length;
      const avgCo2 = responses ? totalCo2 / responses : 0;
      const annualRoundTripKm = data.reduce((acc, r) => acc + (r.distance * 2 * r.workDaysCount * 50), 0);
      document.getElementById("kpiResponses").textContent = fmt.format(responses);
      document.getElementById("kpiCo2").textContent = fmt.format(totalCo2);
      document.getElementById("kpiAvg").textContent = fmt1.format(avgCo2);
      document.getElementById("kpiDistance").textContent = fmt.format(annualRoundTripKm);
      renderDeptChart(data);
      renderVehicleChart(data);
      renderBranchChart(data);
      renderTrendChart(data);
      renderTopTable(data);
      employeePage = 1;
      renderEmployeeDirectory();
    }

    function sum(data, key) { return data.reduce((a, b) => a + (Number(b[key]) || 0), 0); }

    function groupSum(data, key, valueKey = "co2") {
      const map = {};
      data.forEach(r => { const k = r[key] || "ไม่ระบุ"; map[k] = (map[k] || 0) + (Number(r[valueKey]) || 0); });
      return Object.entries(map).sort((a,b) => b[1] - a[1]);
    }

    function groupCount(data, key) {
      const map = {};
      data.forEach(r => { const k = r[key] || "ไม่ระบุ"; map[k] = (map[k] || 0) + 1; });
      return Object.entries(map).sort((a,b) => b[1] - a[1]);
    }

    function chart(id, type, labels, values, options = {}) {
      if (charts[id]) charts[id].destroy();
      charts[id] = new Chart(document.getElementById(id), {
        type,
        data: { labels, datasets: [{ label: options.label || "", data: values, borderWidth: 2, borderRadius: 10, tension: .35 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: type === "doughnut" },
            tooltip: { callbacks: { label: c => `${c.label || c.dataset.label}: ${fmt1.format(c.raw)}` } }
          },
          scales: type === "doughnut" ? {} : {
            y: { beginAtZero: true, grid: { color: "#eef2f7" } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    function renderDeptChart(data) {
      const rows = groupSum(data, "dept").slice(0, 10);
      chart("deptChart", "bar", rows.map(x => x[0]), rows.map(x => x[1]), { label: "kgCO₂e/year" });
    }

    function renderVehicleChart(data) {
      const rows = groupCount(data, "vehicle").slice(0, 8);
      chart("vehicleChart", "doughnut", rows.map(x => x[0]), rows.map(x => x[1]), { label: "Responses" });
    }

    function renderBranchChart(data) {
      const rows = groupSum(data, "branch").slice(0, 10);
      chart("branchChart", "bar", rows.map(x => x[0]), rows.map(x => x[1]), { label: "kgCO₂e/year" });
    }

    function renderTrendChart(data) {
      const map = {};
      data.forEach(r => {
        const d = parseDate(r.timestamp);
        if (!d) return;
        const key = d.toISOString().slice(0,10);
        map[key] = (map[key] || 0) + 1;
      });
      const rows = Object.entries(map).sort((a,b) => a[0].localeCompare(b[0])).slice(-30);
      chart("trendChart", "line", rows.map(x => x[0]), rows.map(x => x[1]), { label: "Responses" });
    }

    function parseDate(v) {
      if (!v) return null;
      if (v instanceof Date && !isNaN(v)) return v;
      const d = new Date(v);
      return isNaN(d) ? null : d;
    }

    function renderTopTable(data) {
      const rows = [...data].sort((a,b) => b.co2 - a.co2).slice(0,10);
      const tbody = document.getElementById("topTable");
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7">No data</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map((r, i) => `
        <tr>
          <td class="rank">${i + 1}</td>
          <td>${escapeHtml(r.name || "-")}</td>
          <td>${escapeHtml(r.dept || "-")}</td>
          <td>${escapeHtml(r.branch || "-")}</td>
          <td>${escapeHtml(r.vehicle || "-")}</td>
          <td>${fmt.format(r.distance)} km</td>
          <td><strong>${fmt.format(r.co2)}</strong> kgCO₂e</td>
        </tr>
      `).join("");
    }


    function getEmployeeDirectoryRows() {
      const base = getFilteredData();
      const searchEl = document.getElementById("employeeSearch");
      const q = (searchEl ? searchEl.value : "").trim().toLowerCase();

      let rows = base.filter(r => {
        if (!q) return true;
        return [
          r.empid, r.name, r.dept, r.branch, r.origin, r.vehicle, r.fuel
        ].join(" ").toLowerCase().includes(q);
      });

      const sortEl = document.getElementById("employeeSort");
      const sort = sortEl ? sortEl.value : "co2_desc";

      rows.sort((a, b) => {
        if (sort === "co2_desc") return b.co2 - a.co2;
        if (sort === "co2_asc") return a.co2 - b.co2;
        if (sort === "name_asc") return String(a.name || "").localeCompare(String(b.name || ""), "th");
        if (sort === "dept_asc") return String(a.dept || "").localeCompare(String(b.dept || ""), "th");
        if (sort === "distance_desc") return b.distance - a.distance;
        return b.co2 - a.co2;
      });

      return rows;
    }

    function renderEmployeeDirectory() {
      const tbody = document.getElementById("employeeTable");
      if (!tbody) return;

      const rows = getEmployeeDirectoryRows();
      employeeCurrentRows = rows;

      const totalUnique = new Set(getFilteredData().map(r => r.empid || r.name).filter(Boolean)).size;
      const selectedCo2 = rows.reduce((acc, r) => acc + (Number(r.co2) || 0), 0);

      document.getElementById("empTotal").textContent = fmt.format(totalUnique);
      document.getElementById("empShowing").textContent = fmt.format(rows.length);
      document.getElementById("empCo2Selected").textContent = fmt.format(selectedCo2);

      const pageSizeEl = document.getElementById("employeePageSize");
      const pageSize = Number(pageSizeEl ? pageSizeEl.value : 20);
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

      if (employeePage > totalPages) employeePage = totalPages;
      if (employeePage < 1) employeePage = 1;

      const start = (employeePage - 1) * pageSize;
      const pageRows = rows.slice(start, start + pageSize);

      document.getElementById("employeePageInfo").textContent =
        `Page ${employeePage} / ${totalPages} · ${fmt.format(rows.length)} rows`;

      if (!pageRows.length) {
        tbody.innerHTML = `<tr><td colspan="11">No data</td></tr>`;
        return;
      }

      tbody.innerHTML = pageRows.map((r, i) => `
        <tr>
          <td class="rank">${start + i + 1}</td>
          <td>${escapeHtml(r.empid || "-")}</td>
          <td>${escapeHtml(r.name || "-")}</td>
          <td>${escapeHtml(r.dept || "-")}</td>
          <td>${escapeHtml(r.branch || "-")}</td>
          <td>${escapeHtml(r.origin || "-")}</td>
          <td>${fmt.format(r.distance)} km</td>
          <td>${fmt.format(r.workDaysCount)} วัน/สัปดาห์</td>
          <td>${escapeHtml(r.vehicle || "-")}</td>
          <td>${escapeHtml(r.fuel || "-")}</td>
          <td><strong>${fmt.format(r.co2)}</strong> kgCO₂e</td>
        </tr>
      `).join("");
    }

    function nextEmployeePage() {
      const pageSizeEl = document.getElementById("employeePageSize");
      const pageSize = Number(pageSizeEl ? pageSizeEl.value : 20);
      const totalPages = Math.max(1, Math.ceil(employeeCurrentRows.length / pageSize));

      if (employeePage < totalPages) {
        employeePage++;
        renderEmployeeDirectory();
      }
    }

    function prevEmployeePage() {
      if (employeePage > 1) {
        employeePage--;
        renderEmployeeDirectory();
      }
    }

    function exportEmployeeCSV() {
      const rows = employeeCurrentRows.length ? employeeCurrentRows : getEmployeeDirectoryRows();
      const headers = [
        "empid", "name", "dept", "branch", "origin", "distance_km",
        "work_days_count", "vehicle", "fuel", "work_mode", "carpool",
        "co2_kg_per_year", "emission_factor"
      ];

      const csvRows = [headers.join(",")].concat(rows.map(r => {
        const values = [
          r.empid, r.name, r.dept, r.branch, r.origin, r.distance,
          r.workDaysCount, r.vehicle, r.fuel, r.workMode, r.carpool,
          r.co2, r.factor
        ];
        return values.map(csvEscape).join(",");
      }));

      const blob = new Blob(["\ufeff" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employee_esg_directory.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function csvEscape(v) {
      const s = String(v ?? "");
      if (/[",\n\r]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
      return s;
    }


    function showNotice(msg) {
      const n = document.getElementById("notice");
      n.style.display = "block";
      n.textContent = msg;
    }

    function hideNotice() { document.getElementById("notice").style.display = "none"; }

    function escapeHtml(v) {
      return String(v ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    }