/* =========================================================
   EMISSION FACTORS CONFIG
   จุดสำคัญ: รวมค่า EF / GWP ไว้ที่นี่ เพื่อแก้ได้จากไฟล์เดียว
   หมายเหตุ: ค่า EF ด้านล่างเป็นค่าเริ่มต้นสำหรับระบบทดลอง
   ก่อนใช้รายงานจริง ควรตรวจสอบกับประกาศล่าสุดของ TGO
   ========================================================= */
const EF_CONFIG = {
  meta: {
    source: "TGO / Internal configurable EF",
    version: "2026-draft",
    unit_note: "kgCO2e per activity unit unless specified"
  },

  GWP_AR5: {
    CO2: 1,
    CH4: 28,
    N2O: 265,
    R32: 677,
    R134A: 1300
  },

  EF: {
    electricity: {
      default_year: 2024,
      by_year: {
        2024: 0.4999,
        2025: 0.4982
      },
      unit: "kgCO2e/kWh"
    },

    fuel: {
      diesel: { label: "Diesel", value: 2.7446, unit: "kgCO2e/L" },
      gasoline91: { label: "Gasoline 91", value: 2.2719, unit: "kgCO2e/L" },
      gasoline95: { label: "Gasoline 95", value: 2.2719, unit: "kgCO2e/L" },
      e20: { label: "E20", value: 2.0726, unit: "kgCO2e/L" },
      e85: { label: "E85", value: 1.3558, unit: "kgCO2e/L" },
      lpg: { label: "LPG", value: 1.63, unit: "kgCO2e/kg" },
      ngv: { label: "NGV", value: 2.16, unit: "kgCO2e/kg" }
    },

    vehicle_passenger_km: {
      car: { label: "รถเก๋ง", value: 0.192, unit: "kgCO2e/passenger-km" },
      motorcycle: { label: "มอเตอร์ไซค์", value: 0.103, unit: "kgCO2e/passenger-km" },
      bus: { label: "รถเมล์", value: 0.089, unit: "kgCO2e/passenger-km" },
      hybrid: { label: "รถไฮบริด", value: 0.112, unit: "kgCO2e/passenger-km" },
      train: { label: "BTS/MRT", value: 0.041, unit: "kgCO2e/passenger-km" },
      walk: { label: "เดิน", value: 0, unit: "kgCO2e/passenger-km" },
      bicycle: { label: "จักรยาน", value: 0, unit: "kgCO2e/passenger-km" }
    },

    water: { tap_water: { label: "น้ำประปา", value: 0.5410, unit: "kgCO2e/m3" } },
    waste: { landfill: { label: "Landfill", value: 2.32, unit: "kgCO2e/kg waste" } },
    septic_tank: { methane_ef: 0.3, unit: "kgCH4/kgBOD" }
  }
};
