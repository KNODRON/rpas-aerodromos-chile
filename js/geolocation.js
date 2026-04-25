let marcadorUbicacion = null;

function usarMiUbicacion() {
  if (!navigator.geolocation) {
    alert("Tu navegador no permite geolocalización.");
    return;
  }

  const resultado = document.getElementById("resultado");
  if (resultado) resultado.innerHTML = "Obteniendo ubicación actual...";

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const punto = { lat, lng: lon };

      map.setView([lat, lon], 13);

      if (marcadorUbicacion) {
        capaMedicion.removeLayer(marcadorUbicacion);
      }

      marcadorUbicacion = L.circleMarker([lat, lon], {
        radius: 10,
        color: "#ffffff",
        fillColor: "#22c55e",
        fillOpacity: 1,
        weight: 3
      })
      .addTo(capaMedicion)
      .bindPopup(`
        <b>Mi ubicación actual</b><br>
        ${lat.toFixed(6)}, ${lon.toFixed(6)}
      `)
      .openPopup();

      evaluarDesdePunto(punto);
    },
    () => {
      if (resultado) resultado.innerHTML = "No se pudo obtener la ubicación actual.";
      alert("No se pudo obtener la ubicación. Revisa permisos del navegador.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}
