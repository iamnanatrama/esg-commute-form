/* =========================================================
   CALCULATOR CORE
   ฟังก์ชันคำนวณกลาง ทุกหน้าควรเรียกใช้จากไฟล์นี้
   ========================================================= */
const CarbonCalculator = {
  kgToTon(kg){ return Number(kg || 0) / 1000; },
  round(num, digits = 4){ return Number(Number(num || 0).toFixed(digits)); },

  general(activityData, emissionFactor, gwp = 1){
    const kg = Number(activityData || 0) * Number(emissionFactor || 0) * Number(gwp || 1);
    return { kgCO2e: this.round(kg, 4), tCO2e: this.round(this.kgToTon(kg), 6) };
  },

  electricity(kwh, year){
    const selectedYear = year || EF_CONFIG.EF.electricity.default_year;
    const ef = EF_CONFIG.EF.electricity.by_year[selectedYear] || EF_CONFIG.EF.electricity.by_year[EF_CONFIG.EF.electricity.default_year];
    return this.general(kwh, ef, 1);
  },

  fuel(amount, fuelKey){
    const fuel = EF_CONFIG.EF.fuel[fuelKey];
    if(!fuel) throw new Error(`Unknown fuel EF: ${fuelKey}`);
    return this.general(amount, fuel.value, 1);
  },

  commute(distanceKm, workDays, vehicleKey, roundTrip = true){
    const vehicle = EF_CONFIG.EF.vehicle_passenger_km[vehicleKey];
    if(!vehicle) throw new Error(`Unknown vehicle EF: ${vehicleKey}`);
    const multiplier = roundTrip ? 2 : 1;
    const passengerKm = Number(distanceKm || 0) * Number(workDays || 0) * multiplier;
    return this.general(passengerKm, vehicle.value, 1);
  },

  water(m3){
    return this.general(m3, EF_CONFIG.EF.water.tap_water.value, 1);
  },

  refrigerantLeakage(kgLeak, refrigerantKey){
    const gwp = EF_CONFIG.GWP_AR5[refrigerantKey];
    if(!gwp) throw new Error(`Unknown refrigerant GWP: ${refrigerantKey}`);
    return this.general(kgLeak, 1, gwp);
  },

  septicTank({ people, bod = 40, workingDays = 260, correctionFactor = 1 }){
    // TOW = P × BOD × 0.001 × I × workingDays
    const tow = Number(people || 0) * Number(bod || 0) * 0.001 * Number(correctionFactor || 1) * Number(workingDays || 0);
    const kgCH4 = tow * EF_CONFIG.EF.septic_tank.methane_ef;
    const kgCO2e = kgCH4 * EF_CONFIG.GWP_AR5.CH4;
    return { TOW: this.round(tow,4), kgCH4: this.round(kgCH4,4), kgCO2e: this.round(kgCO2e,4), tCO2e: this.round(this.kgToTon(kgCO2e),6) };
  }
};
