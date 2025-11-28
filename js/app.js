/**
 * Juego de Barco - Refactorizado y Mejorado
 * 
 * Este archivo contiene la lógica principal del juego, organizada en clases (POO)
 * para un código más limpio, mantenible y fácil de entender.
 */

// Configuración del Canvas
const canvas = document.getElementById("barco");
const ctx = canvas.getContext("2d");

// Elementos del DOM (Interfaz)
const btnIniciar = document.getElementById("btn-iniciar");
const menu = document.getElementById("menu");

// Carga de Imágenes (Preload)
// Cargamos las imágenes al inicio para evitar parpadeos
const images = {
    barco: new Image(),
    cano: new Image(),
    madera: new Image(),
    fondo: new Image()
};
images.barco.src = "img/barco.png";
images.cano.src = "img/boladecañon.png";
images.madera.src = "img/madera.png";
images.fondo.src = "img/fondo.png";

/**
 * Clase Base para Entidades del Juego
 * Representa cualquier objeto que se mueva en el juego (Barco, Enemigo, Amigo)
 */
class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.markedForDeletion = false; // Para eliminar objetos que salen de pantalla
    }

    // Método para dibujar la entidad
    draw(ctx, img) {
        if (img && img.complete) {
            ctx.drawImage(img, this.x, this.y, this.w, this.h);
        }
    }

    // Método base de actualización (se sobrescribe en las subclases)
    update(deltaTime) {}
}

/**
 * Clase Jugador (Barco)
 * Controlado por el usuario con las flechas
 */
class Player extends Entity {
    constructor() {
        super(80, 200, 60, 60);
        this.vy = 0; // Velocidad vertical
        this.speed = 300; // Pixeles por segundo (ajustar para suavidad)
    }

    update(input, deltaTime) {
        // Movimiento basado en las teclas presionadas
        if (input.includes("ArrowUp")) this.vy = -this.speed;
        else if (input.includes("ArrowDown")) this.vy = this.speed;
        else this.vy = 0;

        // Aplicar movimiento (velocidad * tiempo transcurrido)
        this.y += this.vy * deltaTime;

        // Límites de pantalla (no salir del canvas)
        if (this.y < 0) this.y = 0;
        if (this.y + this.h > canvas.height) this.y = canvas.height - this.h;
    }
}

/**
 * Clase Enemigo (Bola de Cañón)
 * Intenta golpear al jugador
 */
class Enemy extends Entity {
    constructor(gameWidth, gameHeight, playerY) {
        super(gameWidth, Math.random() * (gameHeight - 60), 30, 30);
        this.vx = Math.random() * 150 + 100; // Velocidad horizontal aleatoria
        
        // Calcular trayectoria hacia el jugador (predicción simple)
        // El enemigo ajusta su velocidad vertical para intentar interceptar al jugador
        const targetY = playerY;
        const diffY = targetY - this.y;
        const timeToReach = this.x / this.vx; // Tiempo estimado para cruzar la pantalla
        this.vy = diffY / timeToReach; 
    }

    update(deltaTime) {
        this.x -= this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Marcar para borrar si sale de la pantalla
        if (this.x + this.w < 0) this.markedForDeletion = true;
    }
}

/**
 * Clase Amigo (Madera)
 * Da vidas o puntos, se mueve en zig-zag
 */
class Friend extends Entity {
    constructor(gameWidth, gameHeight) {
        super(gameWidth, Math.random() * (gameHeight - 60), 30, 30);
        this.vx = Math.random() * 80 + 80;
        this.angle = 0; // Para el movimiento sinusoidal
    }

    update(deltaTime) {
        this.x -= this.vx * deltaTime;
        // Movimiento ondulado
        this.angle += 5 * deltaTime;
        this.y += Math.sin(this.angle) * 2;

        if (this.x + this.w < 0) this.markedForDeletion = true;
    }
}

/**
 * Manejador de Entrada (Teclado)
 * Captura las teclas presionadas
 */
class InputHandler {
    constructor() {
        this.keys = [];
        window.addEventListener('keydown', e => {
            if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && this.keys.indexOf(e.key) === -1) {
                this.keys.push(e.key);
            }
        });
        window.addEventListener('keyup', e => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                this.keys.splice(this.keys.indexOf(e.key), 1);
            }
        });
    }
}

/**
 * Clase Principal del Juego
 * Controla el bucle del juego, estados, niveles y puntuación
 */
class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.player = new Player();
        this.input = new InputHandler();
        this.enemies = [];
        this.friends = [];
        
        // Estado del juego
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.gameTime = 0;
        
        // Temporizadores para generación de entidades
        this.enemyTimer = 0;
        this.enemyInterval = 2000;
        this.friendTimer = 0;
        this.friendInterval = 4000;
    }

    update(deltaTime) {
        if (this.gameOver) return;

        this.gameTime += deltaTime;

        // Subir de nivel cada 25 segundos
        if (this.gameTime > 25) {
            this.levelUp();
            this.gameTime = 0;
        }

        // Actualizar Jugador
        this.player.update(this.input.keys, deltaTime);

        // Generar y Actualizar Enemigos
        if (this.enemyTimer > this.enemyInterval) {
            this.enemies.push(new Enemy(this.width, this.height, this.player.y));
            this.enemyTimer = 0;
        } else {
            this.enemyTimer += deltaTime * 1000;
        }

        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
            // Colisión con Enemigo
            if (this.checkCollision(this.player, enemy)) {
                enemy.markedForDeletion = true;
                this.lives--;
                if (this.lives <= 0) this.gameOver = true;
            }
            // Puntos por esquivar (cuando sale de pantalla)
            if (enemy.markedForDeletion && !this.checkCollision(this.player, enemy) && enemy.x + enemy.w < 0) {
                this.score += 10 * this.level;
            }
        });
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);

        // Generar y Actualizar Amigos
        if (this.friendTimer > this.friendInterval) {
            this.friends.push(new Friend(this.width, this.height));
            this.friendTimer = 0;
        } else {
            this.friendTimer += deltaTime * 1000;
        }

        this.friends.forEach(friend => {
            friend.update(deltaTime);
            // Colisión con Amigo
            if (this.checkCollision(this.player, friend)) {
                friend.markedForDeletion = true;
                this.lives++; // Ganar vida
            }
        });
        this.friends = this.friends.filter(f => !f.markedForDeletion);
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.width, this.height);
        
        // Dibujar Fondo
        if (images.fondo.complete) ctx.drawImage(images.fondo, 0, 0, this.width, this.height);

        // Dibujar Entidades
        this.player.draw(ctx, images.barco);
        this.enemies.forEach(e => e.draw(ctx, images.cano));
        this.friends.forEach(f => f.draw(ctx, images.madera));

        // Dibujar Interfaz (UI)
        this.drawUI(ctx);
    }

    drawUI(ctx) {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Puntos: " + this.score, 20, 30);
        ctx.fillText("Vidas: " + this.lives, 20, 60);
        ctx.fillText("Nivel: " + this.level, 20, 90);

        if (this.gameOver) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = "white";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", this.width/2, this.height/2);
            ctx.font = "20px Arial";
            ctx.fillText("Puntuación Final: " + this.score, this.width/2, this.height/2 + 40);
            ctx.fillText("Haz click para reiniciar", this.width/2, this.height/2 + 80);
        }
    }

    levelUp() {
        this.level++;
        this.enemyInterval = Math.max(500, 2000 - (this.level * 200)); // Más rápido cada nivel
        // Mostrar mensaje de nivel (opcional, simplificado aquí)
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    }
}

// Variables Globales
let game;
let lastTime = 0;
let animationId;

// Bucle de Animación
function animate(timeStamp) {
    const deltaTime = (timeStamp - lastTime) / 1000;
    lastTime = timeStamp;

    game.update(deltaTime);
    game.draw(ctx);

    if (!game.gameOver) {
        animationId = requestAnimationFrame(animate);
    } else {
        // Permitir reinicio al hacer click si es Game Over
        canvas.addEventListener('click', restartGame, { once: true });
    }
}

function restartGame() {
    game = new Game(canvas.width, canvas.height);
    lastTime = performance.now();
    animate(lastTime);
}

// Evento Iniciar Juego
btnIniciar.addEventListener("click", () => {
    menu.style.display = "none";
    game = new Game(canvas.width, canvas.height);
    lastTime = performance.now();
    animate(lastTime);
});