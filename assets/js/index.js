// =========================================================
    // Vehicle CO2 Simulator
    // แก้ค่า emission factor ได้ที่ปุ่ม data-factor ใน HTML
    // =========================================================
    (function () {
      const scene = document.getElementById('vehicleScene');
      const icon = document.getElementById('vehicleIcon');
      const name = document.getElementById('vehicleName');
      const factor = document.getElementById('factorValue');
      const tabs = document.querySelectorAll('.vehicle-tab');
      const bars = document.querySelectorAll('.emission-bars .bar');
      if (!scene || !tabs.length) return;

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          const type = tab.dataset.type;
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          scene.className = 'vehicle-scene ' + type + '-mode';
          icon.textContent = tab.dataset.icon;
          name.textContent = tab.dataset.label;
          factor.textContent = Number(tab.dataset.factor).toFixed(3);

          bars.forEach(b => b.classList.toggle('active', b.classList.contains(type)));
        });
      });
    })();