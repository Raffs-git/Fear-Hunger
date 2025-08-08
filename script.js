document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const endScreen = document.getElementById('end-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('startGameButton');
    const restartButton = document.getElementById('restartButton');
    const gameOverRestartButton = document.getElementById('gameOverRestartButton');
    const faseSpan = document.getElementById('fase');
    const vidasSpan = document.getElementById('vidas');
    const messageDiv = document.getElementById('message');

    const tileSize = 20;
    const canvasSize = 600;

    const playerImage = new Image();
    const enemyImage = new Image();
    
    playerImage.src = 'assets/vitor-cavaleiro-removebg-preview.png'; 
    enemyImage.src = 'assets/skull-soldier-pixel-art-v0-pujwuskytgha1-removebg-preview.png';

    let imagesLoaded = 0;
    const totalImages = 2;

    playerImage.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            console.log("Todas as imagens carregadas. Pronto para iniciar o jogo.");
        }
    };
    enemyImage.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            console.log("Todas as imagens carregadas. Pronto para iniciar o jogo.");
        }
    };
    

    let maze = [];
    let player = { x: 1, y: 1, lives: 3, lastMove: { dx: 0, dy: 0 }, direction: 'right' };
    let enemies = [];
    let bullets = [];
    let enemyBullets = [];
    let currentFase = 1;
    let isGameOver = false;
    let gameLoop;
    let shootLoop;
    let bulletLoop;

    const fases = [
        { size: 15, enemies: 2, shootInterval: 1500 },
        { size: 20, enemies: 4, shootInterval: 1200 },
        { size: 25, enemies: 6, shootInterval: 1000 }
    ];
    
    window.addEventListener("keydown", function(e) {
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.key) > -1) {
            e.preventDefault();
        }
    }, false);


    function generateMaze(size) {
        let newMaze = [];
        for (let i = 0; i < size; i++) {
            newMaze[i] = [];
            for (let j = 0; j < size; j++) {
                newMaze[i][j] = 1;
            }
        }
        let stack = [];
        let startX = 1;
        let startY = 1;
        stack.push({ x: startX, y: startY });
        newMaze[startY][startX] = 0;
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        while (stack.length > 0) {
            let current = stack.pop();
            let neighbors = [];
            for (let [dx, dy] of directions) {
                let neighborX = current.x + dx * 2;
                let neighborY = current.y + dy * 2;
                if (neighborX > 0 && neighborX < size - 1 && neighborY > 0 && neighborY < size - 1 && newMaze[neighborY][neighborX] === 1) {
                    neighbors.push({ x: neighborX, y: neighborY, pathX: current.x + dx, pathY: current.y + dy });
                }
            }
            if (neighbors.length > 0) {
                stack.push(current);
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                newMaze[next.pathY][next.pathX] = 0;
                newMaze[next.y][next.x] = 0;
                stack.push({ x: next.x, y: next.y });
            }
        }
        newMaze[1][1] = 0;
        newMaze[size - 2][size - 2] = 2;
        newMaze[size - 2][size - 3] = 0;
        newMaze[size - 3][size - 2] = 0;
        return newMaze;
    }

    function generateEnemies(numEnemies, size) {
        let newEnemies = [];
        for (let i = 0; i < numEnemies; i++) {
            let enemyX, enemyY;
            do {
                enemyX = Math.floor(Math.random() * (size - 2)) + 1;
                enemyY = Math.floor(Math.random() * (size - 2)) + 1;
            } while (maze[enemyY][enemyX] !== 0 || (enemyX === player.x && enemyY === player.y));
            newEnemies.push({ x: enemyX, y: enemyY, direction: 'right' });
        }
        return newEnemies;
    }

    function initGame() {
        isGameOver = false;
        player = { x: 1, y: 1, lives: 3, lastMove: { dx: 0, dy: 0 }, direction: 'right' };
        bullets = [];
        enemyBullets = [];
        messageDiv.textContent = '';
        currentFase = 1;
        vidasSpan.textContent = player.lives;
        loadFase(currentFase);
    }

    function loadFase(faseNumber) {
        if (faseNumber > fases.length) {
            winGame();
            return;
        }
        currentFase = faseNumber;
        faseSpan.textContent = currentFase;
        const faseConfig = fases[currentFase - 1];
        maze = generateMaze(faseConfig.size);
        player.x = 1;
        player.y = 1;
        enemies = generateEnemies(faseConfig.enemies, faseConfig.size);
        bullets = [];
        enemyBullets = [];
        draw();
    }

    function drawImageWithDirection(image, x, y, direction) {
        ctx.save();
        const drawX = x * tileSize;
        const drawY = y * tileSize;

        if (direction === 'left') {
            ctx.translate(drawX + tileSize, drawY);
            ctx.scale(-1, 1);
            ctx.drawImage(image, 0, 0, tileSize, tileSize);
        } else {
            ctx.translate(drawX, drawY);
            ctx.drawImage(image, 0, 0, tileSize, tileSize);
        }
        ctx.restore();
    }

    function draw() {
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[y].length; x++) {
                if (maze[y][x] === 1) {
                    ctx.fillStyle = '#4a4a4a';
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                } else if (maze[y][x] === 2) {
                    ctx.fillStyle = '#ffff99';
                    ctx.beginPath();
                    ctx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 2 - 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        drawImageWithDirection(playerImage, player.x, player.y, player.direction);
        
        enemies.forEach(enemy => {
            drawImageWithDirection(enemyImage, enemy.x, enemy.y, enemy.direction);
        });
        
        // --- CÓDIGO MODIFICADO PARA OS PROJÉTEIS DO JOGADOR ---
        ctx.fillStyle = '#e0e0e0';
        bullets.forEach(bullet => {
            let width, height;
            const thinness = tileSize / 8; 
            const length = tileSize * 0.8;
            const offsetX = (tileSize - length) / 2;
            const offsetY = (tileSize - thinness) / 2;

            if (bullet.dx !== 0) { // Movimento horizontal
                width = length;
                height = thinness;
                ctx.fillRect(bullet.x * tileSize + offsetX, bullet.y * tileSize + offsetY, width, height);
            } else if (bullet.dy !== 0) { // Movimento vertical
                width = thinness;
                height = length;
                ctx.fillRect(bullet.x * tileSize + offsetY, bullet.y * tileSize + offsetX, width, height);
            }
        });
        // --- FIM DO CÓDIGO MODIFICADO ---

        ctx.fillStyle = '#ff3333';
        enemyBullets.forEach(bullet => {
            let width, height;
            const thinness = tileSize / 8;
            const length = tileSize * 0.8;
            const offsetX = (tileSize - length) / 2;
            const offsetY = (tileSize - thinness) / 2;

            if (bullet.dx !== 0) { 
                width = length;
                height = thinness;
                ctx.fillRect(bullet.x * tileSize + offsetX, bullet.y * tileSize + offsetY, width, height);
            } else if (bullet.dy !== 0) { 
                width = thinness;
                height = length;
                ctx.fillRect(bullet.x * tileSize + offsetY, bullet.y * tileSize + offsetX, width, height);
            }
        });
    }

    function movePlayer(dx, dy) {
        if (isGameOver) return;
        const newX = player.x + dx;
        const newY = player.y + dy;
        const currentMazeSize = fases[currentFase - 1].size;
        if (newX >= 0 && newX < currentMazeSize && newY >= 0 && newY < currentMazeSize && maze[newY][newX] !== 1) {
            player.x = newX;
            player.y = newY;
            player.lastMove = { dx, dy };
            if (dx > 0) player.direction = 'right';
            if (dx < 0) player.direction = 'left';
            checkCollisions();
            checkWin();
            draw();
        }
    }

    function moveEnemies() {
        if (isGameOver) return;
        enemies.forEach(enemy => {
            const possibleMoves = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            const newX = enemy.x + move.dx;
            const newY = enemy.y + move.dy;
            const currentMazeSize = fases[currentFase - 1].size;
            if (newX > 0 && newX < currentMazeSize - 1 && newY > 0 && newY < currentMazeSize - 1 && maze[newY][newX] !== 1) {
                enemy.x = newX;
                enemy.y = newY;
                if (move.dx > 0) enemy.direction = 'right';
                if (move.dx < 0) enemy.direction = 'left';
            }
        });
        checkCollisions();
        draw();
    }

    function shoot(dx, dy) {
        if (isGameOver) return;
        bullets.push({ x: player.x, y: player.y, dx, dy });
    }

    function enemyShoot() {
        if (isGameOver || enemies.length === 0) return;
        enemies.forEach(enemy => {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            if (dx === 0 || dy === 0) {
                enemyBullets.push({ x: enemy.x, y: enemy.y, dx: Math.sign(dx), dy: Math.sign(dy) });
            }
        });
    }

    function moveBullets() {
        if (isGameOver) return;
        bullets = bullets.map(bullet => ({
            x: bullet.x + bullet.dx,
            y: bullet.y + bullet.dy,
            dx: bullet.dx,
            dy: bullet.dy
        })).filter(bullet => {
            const currentMazeSize = fases[currentFase - 1].size;
            return bullet.x >= 0 && bullet.x < currentMazeSize && bullet.y >= 0 && bullet.y < currentMazeSize && maze[bullet.y][bullet.x] !== 1;
        });

        enemyBullets = enemyBullets.map(bullet => ({
            x: bullet.x + bullet.dx,
            y: bullet.y + bullet.dy,
            dx: bullet.dx,
            dy: bullet.dy
        })).filter(bullet => {
            const currentMazeSize = fases[currentFase - 1].size;
            return bullet.x >= 0 && bullet.x < currentMazeSize && bullet.y >= 0 && bullet.y < currentMazeSize && maze[bullet.y][bullet.x] !== 1;
        });
        checkBulletCollisions();
        draw();
    }

    function checkBulletCollisions() {
        bullets = bullets.filter(bullet => {
            let hit = false;
            enemies = enemies.filter(enemy => {
                if (bullet.x === enemy.x && bullet.y === enemy.y) {
                    hit = true;
                    return false;
                }
                return true;
            });
            return !hit;
        });
        enemyBullets = enemyBullets.filter(bullet => {
            if (bullet.x === player.x && bullet.y === player.y) {
                player.lives--;
                vidasSpan.textContent = player.lives;
                if (player.lives <= 0) {
                    gameOver();
                } else {
                    messageDiv.textContent = 'Você foi atingido pela escuridão!';
                    setTimeout(() => messageDiv.textContent = '', 2000);
                    player.x = 1;
                    player.y = 1;
                }
                return false;
            }
            return true;
        });
    }

    function checkCollisions() {
        enemies.forEach(enemy => {
            if (player.x === enemy.x && player.y === enemy.y) {
                player.lives--;
                vidasSpan.textContent = player.lives;
                if (player.lives <= 0) {
                    gameOver();
                } else {
                    messageDiv.textContent = 'A criatura te tocou e a luz se enfraqueceu!';
                    setTimeout(() => messageDiv.textContent = '', 2000);
                    player.x = 1;
                    player.y = 1;
                }
            }
        });
    }

    function checkWin() {
        const currentMazeSize = fases[currentFase - 1].size;
        if (player.x === currentMazeSize - 2 && player.y === currentMazeSize - 2) {
            messageDiv.textContent = 'Um brilho de esperança... Fase ' + currentFase + ' concluída!';
            clearInterval(gameLoop);
            clearInterval(shootLoop);
            clearInterval(bulletLoop);
            setTimeout(() => {
                if (currentFase < fases.length) {
                    loadFase(currentFase + 1);
                    gameLoop = setInterval(moveEnemies, 500);
                    shootLoop = setInterval(enemyShoot, fases[currentFase - 1].shootInterval);
                    bulletLoop = setInterval(moveBullets, 100);
                } else {
                    winGame();
                }
            }, 2000);
        }
    }

    function gameOver() {
        isGameOver = true;
        clearInterval(gameLoop);
        clearInterval(shootLoop);
        clearInterval(bulletLoop);
        gameContainer.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
    }

    function winGame() {
        isGameOver = true;
        clearInterval(gameLoop);
        clearInterval(shootLoop);
        clearInterval(bulletLoop);
        gameContainer.classList.add('hidden');
        endScreen.classList.remove('hidden');
    }
    
    document.addEventListener('keydown', (e) => {
        if (!isGameOver) {
            switch (e.key) {
                case 'w':
                    movePlayer(0, -1);
                    break;
                case 's':
                    movePlayer(0, 1);
                    break;
                case 'a':
                    movePlayer(-1, 0);
                    break;
                case 'd':
                    movePlayer(1, 0);
                    break;
                case 'ArrowUp':
                    shoot(0, -1);
                    break;
                case 'ArrowDown':
                    shoot(0, 1);
                    break;
                case 'ArrowLeft':
                    shoot(-1, 0);
                    break;
                case 'ArrowRight':
                    shoot(1, 0);
                    break;
            }
        }
    });

    startButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        initGame();
        gameLoop = setInterval(moveEnemies, 500);
        bulletLoop = setInterval(moveBullets, 100);
        shootLoop = setInterval(enemyShoot, fases[currentFase - 1].shootInterval);
    });

    restartButton.addEventListener('click', () => {
        endScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        initGame();
    });

    gameOverRestartButton.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        initGame();
    });
});
