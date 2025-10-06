const canvas = document.getElementById("barco");
const ctx = canvas.getContext("2d");
const btnIniciar = document.getElementById("btn-iniciar");
const menu = document.getElementById("menu");

// Imágenes
const imgBarco = new Image();
imgBarco.src = "img/barco.png";
const imgCano = new Image();
imgCano.src = "img/boladecañon.png";
const imgMadera = new Image();
imgMadera.src = "img/madera.png";
const imgFondo = new Image();
imgFondo.src = "img/fondo.png";

// Jugador (solo se mueve arriba y abajo)
const player = {
  x: 80,
  y: 200,
  w: 60,
  h: 60,
  vy: 0,
};

// Datos del juego
let keys = {};
let enemigos = [];
let amigos = [];
let score = 0;
let vidas = 3;
let juegoIniciado = false;

// Niveles
let nivel = 1;
let niveles = [
  {
    velocidadEnemigos: 2,
    frecuenciaEnemigos: 0.02,
    frecuenciaAmigos: 0.01,
    puntosPorEnemigo: 10,
    vidasIniciales: 3,
  },
  {
    velocidadEnemigos: 3,
    frecuenciaEnemigos: 0.03,
    frecuenciaAmigos: 0.015,
    puntosPorEnemigo: 20,
    vidasIniciales: 2,
  },
  {
    velocidadEnemigos: 4,
    frecuenciaEnemigos: 0.04,
    frecuenciaAmigos: 0.02,
    puntosPorEnemigo: 30,
    vidasIniciales: 1,
  },
];

// Variable para almacenar el tiempo transcurrido
let tiempoTranscurrido = 0;

// Crear enemigo (apunta al barco)
function crearEnemigo() {
  const startY = Math.random() * (canvas.height - 60);
  const enemigo = {
    x: 800,
    y: startY,
    w: 30,
    h: 30,
    vx: Math.random() * 3 + 2,
    vy: 0,
  };
  // Calcular velocidad vertical para que vaya directo al barco
  const objetivoY = player.y + player.h / 2;
  const diffY = objetivoY - (enemigo.y + enemigo.h / 2);
  enemigo.vy = diffY / (800 / enemigo.vx); // tiempo = distancia horizontal / velocidad horizontal
  enemigos.push(enemigo);
}

// Crear amigo (movimiento ondulado)
function crearAmigos() {
  amigos.push({
    x: 800,
    y: Math.random() * (canvas.height - 60),
    w: 30,
    h: 30,
    vx: Math.random() * 2 + 1,
    angulo: 0,
  });
}

// Control teclado
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Colisión
function colision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Pasar de nivel
function cambiarDeNivel() {
  if (nivel < niveles.length) {
    nivel++;
    vidas = niveles[nivel - 1].vidasIniciales;
    ctx.font = "48px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Nivel " + nivel, canvas.width / 2, canvas.height / 2);
    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 2000);
  }
}

// Actualizar juego
function update() {
  if (!juegoIniciado) return;
  tiempoTranscurrido += 1 / 60; // incrementar el tiempo transcurrido en 1/60 segundos
  if (tiempoTranscurrido >= 25) { // verificar si han pasado 25 segundos
    cambiarDeNivel();
    tiempoTranscurrido = 0; // reiniciar el tiempo transcurrido
  }
  // Mover jugador
  if (keys["ArrowUp"]) player.vy = -4;
  else if (keys["ArrowDown"]) player.vy = 4;
  else player.vy = 0;
  player.y += player.vy;
  if (player.y < 0) player.y = 0;
  if (player.y + player.h > canvas.height) player.y = canvas.height - player.h;
  // Mover enemigos
  enemigos.forEach((e) => {
    e.x -= niveles[nivel - 1].velocidadEnemigos;
    e.y += e.vy;
  });
  // Mover amigos
  amigos.forEach((a) => {
    a.x -= a.vx;
    a.angulo += 0.1;
    a.y += Math.sin(a.angulo) * 2;
  });
  // Limpiar fuera de pantalla
  enemigos = enemigos.filter((e) => e.x + e.w > 0);
  amigos = amigos.filter((a) => a.x + a.w > 0);
  // Crear enemigos y amigos
  if (Math.random() < niveles[nivel - 1].frecuenciaEnemigos)
    crearEnemigo();
  if (Math.random() < niveles[nivel - 1].frecuenciaAmigos)
    crearAmigos();
  // Colisiones
  enemigos.forEach((e, i) => {
    if (colision(player, e)) {
      vidas--;
      enemigos.splice(i, 1);
    }
  });
  amigos.forEach((a, i) => {
    if (colision(player, a)) {
      vidas++;
      amigos.splice(i, 1);
    }
  });
}

// Dibujar juego
function draw() {
  ctx.clearRect(0, 0, 800, 480);
  if (imgFondo.complete) ctx.drawImage(imgFondo, 0, 0, 800, 480);
  if (imgBarco.complete) ctx.drawImage(imgBarco, player.x, player.y, player.w, player.h);
  enemigos.forEach((e) => {
    if (imgCano.complete) ctx.drawImage(imgCano, e.x, e.y, e.w, e.h);
  });
  amigos.forEach((a) => {
    if (imgMadera.complete) ctx.drawImage(imgMadera, a.x, a.y, a.w, a.h);
  });
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Puntos: " + score, 20, 30);
  ctx.fillText("Vidas: " + vidas, 20, 50);
  ctx.fillText("Nivel: " + nivel, 20, 70);
}

// Loop del juego
function loop() {
  if (juegoIniciado) {
    update();
    draw();
  }
  requestAnimationFrame(loop);
}

// Botón iniciar juego
btnIniciar.addEventListener("click", () => {
  juegoIniciado = true;
  menu.style.display = "none"; // ocultar menú
  loop();
});