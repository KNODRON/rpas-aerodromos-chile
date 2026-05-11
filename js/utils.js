function distanciaKm(a,b){
  let R=6371;
  let dLat=(b.lat-a.lat)*Math.PI/180;
  let dLon=(b.lng-a.lng)*Math.PI/180;

  let x=Math.sin(dLat/2)**2 +
        Math.cos(a.lat*Math.PI/180) *
        Math.cos(b.lat*Math.PI/180) *
        Math.sin(dLon/2)**2;

  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function alertaPorDistancia(km){
  if(km <= 3) return "ALTO RIESGO";
  if(km <= 5) return "PRECAUCIÓN";
  return "BAJO";
}

function mostrarAviso(texto) {

  const aviso = document.createElement("div");

  aviso.className = "toast-alert";
  aviso.innerText = texto;

  document.body.appendChild(aviso);

  setTimeout(() => {
    aviso.classList.add("show");
  }, 50);

  setTimeout(() => {
    aviso.classList.remove("show");

    setTimeout(() => {
      aviso.remove();
    }, 300);

  }, 3000);
}
