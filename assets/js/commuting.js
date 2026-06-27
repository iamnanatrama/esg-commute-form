// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('form-title').textContent = CONFIG.FORM_TITLE;
  document.getElementById('form-desc').textContent = CONFIG.FORM_DESC;
  if (CONFIG.SHEET_URL && !CONFIG.SHEET_URL.includes('YOUR_SCRIPT_ID')) {
    document.getElementById('config-warn').style.display = 'none';
  }
  const mainBack = document.getElementById('btn-main-back');
  if (mainBack && CONFIG.MAIN_URL) mainBack.href = CONFIG.MAIN_URL;
});

// ── State ──
let selectedVehicle = '';
let selectedFuel = '';
let selectedDays = [];
let workMode = 'มาทำงาน Onsite ทุกวัน';
let carpoolVal = 'ไม่มี';

// CO2 emission factors (kg CO2e per km per vehicle)
const EF = EMISSION_FACTORS.VEHICLE;

// ── Slider / Input Sync ──
function syncSlider(v) {
  document.getElementById('dist-show').textContent = v;
  document.getElementById('dist-input').value = v;
  calcCO2();
}
function syncInput(v) {
  const val = Math.max(1, Math.min(500, parseInt(v) || 1));
  document.getElementById('dist-slider').value = Math.min(150, val);
  document.getElementById('dist-show').textContent = val;
  calcCO2();
}

// ── Day Chips ──
document.querySelectorAll('.day-chip').forEach(el => {
  el.addEventListener('click', () => {
    el.classList.toggle('active');
    selectedDays = [...document.querySelectorAll('.day-chip.active')].map(d => d.dataset.day);
    document.getElementById('days-count').textContent = `เลือก ${selectedDays.length} วัน`;
    calcCO2();
  });
});

// ── Vehicle ──
function selectVehicle(el) {
  document.querySelectorAll('.v-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedVehicle = el.dataset.v;
  const needFuel = ['รถยนต์ส่วนตัว', 'รถจักรยานยนต์', 'รถตู้/Carpool'];
  document.getElementById('fuel-section').style.display = needFuel.includes(selectedVehicle) ? '' : 'none';
  document.getElementById('vehicle-other-wrap').style.display = selectedVehicle === 'อื่นๆ' ? '' : 'none';
  selectedFuel = '';
  document.querySelectorAll('.fuel-card').forEach(c => c.classList.remove('active'));
  document.getElementById('vehicle-error').style.display = 'none';
  calcCO2();
}

// ── Fuel ──
function selectFuel(el) {
  document.querySelectorAll('.fuel-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedFuel = el.dataset.f;
  calcCO2();
}

// ── Radio (mode / carpool) ──
function selectMode(el, groupId, val) {
  document.querySelectorAll(`#${groupId} .radio-pill`).forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  if (groupId === 'work-mode-group') {
    workMode = val;
    document.getElementById('wfh-row').style.display = val === 'Hybrid (มาบางวัน)' ? '' : 'none';
  } else {
    carpoolVal = val;
  }
}

// ── CO2 Calc ──
function calcCO2() {
  if (!selectedVehicle || selectedDays.length === 0) {
    document.getElementById('co2-val').textContent = '—';
    document.getElementById('co2-unit').textContent = ' กก. CO₂e/ปี';
    return;
  }
  const dist = parseInt(document.getElementById('dist-input').value) || 20;
  const map = EF[selectedVehicle] || { default: 0.15 };
  const factor = (selectedFuel && map[selectedFuel] !== undefined) ? map[selectedFuel] : map.default;
  const co2 = dist * 2 * selectedDays.length * 50 * factor;
  document.getElementById('co2-val').textContent = Math.round(co2).toLocaleString('th-TH');
  document.getElementById('co2-unit').textContent = ' กก. CO₂e/ปี';
}

// ── Add Dept Modal ──
function openAddDept() {
  document.getElementById('modal-dept').classList.add('open');
  setTimeout(() => document.getElementById('new-dept-input').focus(), 100);
}
function closeAddDept() {
  document.getElementById('modal-dept').classList.remove('open');
  document.getElementById('new-dept-input').value = '';
}
function confirmAddDept() {
  const name = document.getElementById('new-dept-input').value.trim();
  if (!name) return;
  const sel = document.getElementById('dept');
  // check dup
  for (let i = 0; i < sel.options.length; i++) {
    if (sel.options[i].text === name) {
      sel.value = name;
      closeAddDept();
      return;
    }
  }
  const opt = new Option(name, name);
  sel.insertBefore(opt, sel.options[sel.options.length - 1]); // before อื่นๆ
  sel.value = name;
  closeAddDept();
}
document.getElementById('new-dept-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmAddDept();
  if (e.key === 'Escape') closeAddDept();
});
document.getElementById('modal-dept').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-dept')) closeAddDept();
});

// ── Validate ──
function validate() {
  let ok = true;
  const required = [
    { id: 'name', fid: 'f-name', msg: '' },
    { id: 'empid', fid: 'f-empid', msg: '' },
    { id: 'origin', fid: 'f-origin', msg: '' },
    { id: 'dept', fid: 'f-dept', msg: '' },
  ];
  required.forEach(r => {
    const el = document.getElementById(r.id);
    const fe = document.getElementById(r.fid);
    if (!el.value.trim() || el.value === '') {
      fe.classList.add('has-error');
      ok = false;
    } else {
      fe.classList.remove('has-error');
    }
  });
  if (!selectedVehicle) {
    document.getElementById('vehicle-error').style.display = 'block';
    ok = false;
  } else {
    document.getElementById('vehicle-error').style.display = 'none';
  }
  if (selectedDays.length === 0) {
    document.getElementById('days-error').style.display = 'block';
    ok = false;
  } else {
    document.getElementById('days-error').style.display = 'none';
  }
  return ok;
}

// ── Toast ──
function showToast(type, title, detail) {
  const toast = document.getElementById('toast');
  toast.className = 'toast ' + type;
  const icons = { success: '✅', error: '❌', loading: '⏳' };
  document.getElementById('toast-icon').textContent = icons[type] || '';
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-detail').textContent = detail;
  toast.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideToast() { document.getElementById('toast').className = 'toast'; }

// ── Submit ──
async function submitForm() {
  hideToast();
  if (!validate()) {
    showToast('error', 'กรุณากรอกข้อมูลให้ครบ', 'ช่องที่มีขอบสีแดงคือช่องที่ยังไม่ได้กรอก');
    return;
  }
  if (CONFIG.SHEET_URL.includes('YOUR_SCRIPT_ID')) {
    showToast('error', 'ยังไม่ได้ตั้งค่า SHEET_URL', 'แก้ไขค่า CONFIG.SHEET_URL ในไฟล์ HTML ก่อนใช้งาน');
    return;
  }

  // Collect data
  const dist = parseInt(document.getElementById('dist-input').value) || 20;
  // =====================================================
// CARBON CORE CALCULATION
// ใช้สูตรกลางจาก assets/js/carbon-core.js
// dist = ระยะทางขาเดียว จึงคูณ 2 เพื่อเป็นไป-กลับ
// selectedDays.length * 50 = จำนวนวันทำงานต่อปีโดยประมาณ
// =====================================================
const annualWorkDays = selectedDays.length * 50;
const roundTripDistance = dist * 2;

const carbonResult = CarbonCore.calculateCommutingCO2({
  distanceKm: roundTripDistance,
  workDaysCount: annualWorkDays,
  vehicle: selectedVehicle,
  fuel: selectedFuel,
  carpool: carpoolVal
});

const factor = carbonResult.emissionFactor;
const co2 = Math.round(carbonResult.kgCO2e);
  const wfhDays = workMode === 'Hybrid (มาบางวัน)' ? document.getElementById('wfh-days').value : '-';
  const vehicleFinal = selectedVehicle === 'อื่นๆ'
    ? (document.getElementById('vehicle-other').value.trim() || 'อื่นๆ')
    : selectedVehicle;

  const payload = {
    timestamp: new Date().toLocaleString('th-TH'),
    name: document.getElementById('name').value.trim(),
    empid: document.getElementById('empid').value.trim(),
    dept: document.getElementById('dept').value,
    branch: document.getElementById('branch').value.trim(),
    origin: document.getElementById('origin').value.trim(),
    distance_km: dist * 2,
    work_days: selectedDays.join(', '),
    work_days_count: selectedDays.length,
    vehicle: vehicleFinal,
    fuel: selectedFuel || '-',
    work_mode: workMode,
    wfh_days_per_week: wfhDays,
    carpool: carpoolVal,
    co2_kg_per_year: co2,
    emission_factor: factor
  };

	// =====================================================
// VALIDATE BEFORE SUBMIT
// ตรวจสอบข้อมูลก่อนส่งเข้า Google Sheet
// =====================================================
const validation = ESGValidator.validateCommuting(payload);

if (!validation.valid) {
  alert(validation.errors.join("\n"));
  return;
}

  // UI: loading state
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  document.getElementById('btn-label').style.display = 'none';
  document.getElementById('btn-spinner').style.display = 'inline-block';
  showToast('loading', 'กำลังบันทึกข้อมูล...', 'กรุณารอสักครู่');

  try {
    // Google Apps Script รับ POST แบบ no-cors ดังนั้นต้อง mode: 'no-cors'
    await fetch(CONFIG.SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    // no-cors ไม่ return response body — ถ้า fetch ไม่ throw = สำเร็จ
    showToast('success',
      'บันทึกข้อมูลเรียบร้อย ✅',
      `${payload.name} (${payload.empid}) | ${vehicleFinal} | CO₂ ≈ ${co2.toLocaleString('th-TH')} กก./ปี | กำลังกลับหน้าหลัก...`
    );
    if (CONFIG.RETURN_AFTER_SAVE && CONFIG.MAIN_URL) {
      setTimeout(() => {
        window.location.href = CONFIG.MAIN_URL;
      }, CONFIG.SUCCESS_REDIRECT_DELAY || 1400);
    }
  } catch (err) {
    showToast('error', 'เกิดข้อผิดพลาด', 'ตรวจสอบ SHEET_URL และการเชื่อมต่ออินเทอร์เน็ต: ' + err.message);
  } finally {
    btn.disabled = false;
    document.getElementById('btn-label').style.display = '';
    document.getElementById('btn-spinner').style.display = 'none';
  }
}

// ── Reset ──
function resetForm() {
  ['name','empid','branch','origin','vehicle-other','dist-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'dist-input' ? '20' : '';
  });
  document.getElementById('dept').value = '';
  document.getElementById('dist-slider').value = 20;
  document.getElementById('dist-show').textContent = '20';
  document.querySelectorAll('.v-card').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.fuel-card').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.day-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.radio-pill:first-child').forEach(p => p.classList.add('active'));
  // reset first pill per group
  document.querySelector('#work-mode-group .radio-pill').classList.add('active');
  document.querySelector('#carpool-group .radio-pill').classList.add('active');
  selectedVehicle = ''; selectedFuel = ''; selectedDays = [];
  workMode = 'มาทำงาน Onsite ทุกวัน'; carpoolVal = 'ไม่มี';
  document.getElementById('fuel-section').style.display = 'none';
  document.getElementById('vehicle-other-wrap').style.display = 'none';
  document.getElementById('wfh-row').style.display = 'none';
  document.getElementById('co2-val').textContent = '—';
  document.getElementById('days-count').textContent = 'เลือก 0 วัน';
  document.getElementById('days-error').style.display = 'none';
  document.getElementById('vehicle-error').style.display = 'none';
  document.querySelectorAll('.has-error').forEach(e => e.classList.remove('has-error'));
  hideToast();
}