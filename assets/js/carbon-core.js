// =====================================================
// RAMA ESG CARBON CORE
// จุดรวมสูตรคำนวณ Carbon Footprint กลางของระบบ
// ทุกหน้าควรเรียกสูตรจากไฟล์นี้ เพื่อลดการเขียนซ้ำ
// =====================================================

const CarbonCore = {
  // =====================================================
  // ดึงค่า EF ของการเดินทางพนักงาน
  // vehicle = ประเภทยานพาหนะ เช่น รถยนต์ส่วนตัว
  // fuel = ชนิดเชื้อเพลิง เช่น น้ำมันเบนซิน
  // =====================================================
  getVehicleEF(vehicle, fuel) {
    const vehicleEF = EMISSION_FACTORS.VEHICLE[vehicle];

    if (!vehicleEF) {
      return EMISSION_FACTORS.VEHICLE["อื่นๆ"]?.default || 0;
    }

    if (fuel && vehicleEF[fuel] !== undefined) {
      return vehicleEF[fuel];
    }

    return vehicleEF.default || 0;
  },

  // =====================================================
  // คำนวณ CO2 จากการเดินทางมาทำงาน
  //
  // distanceKm = ระยะทางต่อเที่ยว หรือระยะทางที่ฟอร์มส่งมา
  // workDaysCount = จำนวนวันทำงานต่อปี
  // emissionFactor = kgCO2e/km
  // carpool = จำนวนคนร่วมเดินทาง ถ้าไม่มีให้เป็น 1
  //
  // สูตร:
  // kgCO2e/year = distanceKm × workDaysCount × EF ÷ carpool
  // หมายเหตุ:
  // ถ้าระบบของคุณคิดไป-กลับไว้แล้ว ห้ามคูณ 2 ซ้ำ
  // =====================================================
  calculateCommutingCO2({
    distanceKm = 0,
    workDaysCount = 0,
    vehicle = "อื่นๆ",
    fuel = "",
    carpool = 1
  }) {
    const distance = Number(distanceKm) || 0;
    const days = Number(workDaysCount) || 0;
    const share = Number(carpool) > 0 ? Number(carpool) : 1;

    const ef = this.getVehicleEF(vehicle, fuel);

    const kgPerYear = (distance * days * ef) / share;

    return {
      kgCO2e: kgPerYear,
      tCO2e: kgPerYear / 1000,
      emissionFactor: ef
    };
  },

  // =====================================================
  // คำนวณ Scope 2: การใช้ไฟฟ้า
  // =====================================================
  calculateElectricityCO2(kWh, efKey = "grid_2025") {
    const item = EMISSION_FACTORS.ELECTRICITY[efKey];
    const ef = item?.ef || 0;

    const kg = (Number(kWh) || 0) * ef;

    return {
      kgCO2e: kg,
      tCO2e: kg / 1000,
      emissionFactor: ef
    };
  },

  // =====================================================
  // คำนวณการใช้น้ำประปา
  // =====================================================
  calculateWaterCO2(m3, efKey = "tap_water") {
    const item = EMISSION_FACTORS.WATER[efKey];
    const ef = item?.ef || 0;

    const kg = (Number(m3) || 0) * ef;

    return {
      kgCO2e: kg,
      tCO2e: kg / 1000,
      emissionFactor: ef
    };
  }
};