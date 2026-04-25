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

}
