function usarMiUbicacion(){

  navigator.geolocation.getCurrentPosition(pos=>{

    let lat = pos.coords.latitude;
    let lon = pos.coords.longitude;

    let punto = {lat:lat,lng:lon};

    map.setView([lat,lon],13);

    let cercano = null;
    let min = 999;

    datos.forEach(p=>{
      let d = distanciaKm(punto,{lat:p.lat,lng:p.lon});
      if(d<min){
        min=d;
        cercano=p;
      }
    });
    ultimoCentro = puntoActual;
    cargarPuntos();
    document.getElementById("resultado").innerHTML =
      "Más cercano: "+cercano.nombre+
      "<br>"+min.toFixed(2)+" km"+
      "<br>"+alertaPorDistancia(min);

  });

  datos.forEach(p=>{
  if(!p.lat || !p.lon) return;

  let d = distanciaKm(inicioMedicion, {lat:p.lat, lng:p.lon});

  if(d <= distanciaManual){
    L.circleMarker([p.lat,p.lon],{
      radius:8,
      color:"#facc15",
      fillColor:"#facc15",
      fillOpacity:0.6
    }).addTo(map);
  }
});
}
