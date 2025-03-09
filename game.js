class SoundManager {
    constructor() {
        // Criar o contexto de áudio apenas quando necessário
        this._audioContext = null;
        this.isMuted = localStorage.getItem('isMuted') === 'true';
        this.volume = parseFloat(localStorage.getItem('soundVolume')) || 0.3;
        this.bgmVolume = parseFloat(localStorage.getItem('bgmVolume')) || 0.3;
        this.bgm = null;
        this.sounds = {
            match: () => this.createMatchSound(),
            swap: () => this.createSwapSound(),
            invalid: () => this.createInvalidSound(),
            powerup: () => this.createPowerupSound()
        };
        this.initBackgroundMusic();
        
        // Adicionar listener para interação do usuário
        const startAudio = () => {
            this.playBackgroundMusic();
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };
        
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
    }

    initBackgroundMusic() {
        this.bgm = new Audio('assets/audio/ChillLofiR.mp3');
        this.bgm.loop = true;
        this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
        
        this.bgm.addEventListener('ended', () => {
            if (!this.isMuted) {
                this.bgm.play().catch(console.error);
            }
        });
        
        // Tentar iniciar a música imediatamente
        this.playBackgroundMusic();
    }

    playBackgroundMusic() {
        if (this.bgm && !this.isMuted) {
            this.bgm.play().catch(error => {
                console.log('Aguardando interação do usuário para tocar a música...');
            });
        }
    }

    setBgmVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('bgmVolume', this.bgmVolume);
        if (this.bgm) {
            this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
        }
    }

    // Getter para criar o contexto de áudio sob demanda
    get audioContext() {
        if (!this._audioContext) {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this._audioContext;
    }

    createOscillator(frequency, type = 'sine', duration = 0.1) {
        if (this.isMuted || !this._audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.error('Erro ao criar som:', error);
        }
    }

    createMatchSound() {
        if (this.isMuted || !this._audioContext) return;

        const melodies = [
            // Melodia 1: Lá, Dó#, Mi (original)
            () => {
                this.createOscillator(440, 'sine', 0.15);
                setTimeout(() => this.createOscillator(554.37, 'sine', 0.15), 100);
                setTimeout(() => this.createOscillator(659.25, 'sine', 0.15), 200);
            },
            // Melodia 2: Dó, Mi, Sol
            () => {
                this.createOscillator(523.25, 'sine', 0.15);
                setTimeout(() => this.createOscillator(659.25, 'sine', 0.15), 100);
                setTimeout(() => this.createOscillator(783.99, 'sine', 0.15), 200);
            },
            // Melodia 3: Ré, Fá#, Lá
            () => {
                this.createOscillator(587.33, 'sine', 0.15);
                setTimeout(() => this.createOscillator(739.99, 'sine', 0.15), 100);
                setTimeout(() => this.createOscillator(880, 'sine', 0.15), 200);
            },
            // Melodia 4: Mi, Sol#, Si
            () => {
                this.createOscillator(659.25, 'sine', 0.15);
                setTimeout(() => this.createOscillator(830.61, 'sine', 0.15), 100);
                setTimeout(() => this.createOscillator(987.77, 'sine', 0.15), 200);
            },
            // Melodia 5: Sol, Si, Ré
            () => {
                this.createOscillator(783.99, 'sine', 0.15);
                setTimeout(() => this.createOscillator(987.77, 'sine', 0.15), 100);
                setTimeout(() => this.createOscillator(1174.66, 'sine', 0.15), 200);
            }
        ];

        const randomMelody = melodies[Math.floor(Math.random() * melodies.length)];
        randomMelody();
    }

    createSwapSound() {
        this.createOscillator(880, 'sine', 0.05);
    }

    createInvalidSound() {
        this.createOscillator(220, 'square', 0.1);
        setTimeout(() => this.createOscillator(196, 'square', 0.1), 100);
    }

    createPowerupSound() {
        this.createOscillator(440, 'sine', 0.1);
        setTimeout(() => this.createOscillator(880, 'sine', 0.2), 100);
    }

    play(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            if (this._audioContext && this._audioContext.state === 'suspended') {
                this._audioContext.resume();
            }
            this.sounds[soundName]();
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('soundVolume', this.volume);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('isMuted', this.isMuted);
        
        if (this.bgm) {
            this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
        }
        
        return this.isMuted;
    }

    getVolume() {
        return this.volume;
    }
}

class ZenMatch {
    constructor() {
        this.gridSize = 8;
        this.score = 0;
        this.selectedCell = null;
        this.isProcessing = false;
        this.soundManager = new SoundManager();
        this.pieces = [
            { name: 'moon', icon: 'fa-moon', color: '#9B59B6' },
            { name: 'star', icon: 'fa-star', color: '#F1C40F' },
            { name: 'heart', icon: 'fa-heart', color: '#E74C3C' },
            { name: 'diamond', icon: 'fa-gem', color: '#3498DB' },
            { name: 'sun', icon: 'fa-sun', color: '#F39C12' }
        ];
        
        this.grid = document.querySelector('.grid');
        if (!this.grid) {
            console.error('Grid element not found');
            return;
        }
        
        this.setupGame();
        this.setupModals();
        this.setupPowerups();
        this.updateScore(0);

        // Adicionar listener para o botão de novo jogo
        const startGameButton = document.getElementById('startGame');
        if (startGameButton) {
            startGameButton.addEventListener('click', () => {
                // Inicializar o contexto de áudio no primeiro clique
                if (this.soundManager.audioContext.state === 'suspended') {
                    this.soundManager.audioContext.resume();
                }
                this.setupGame();
                this.updateScore(0);
                this.soundManager.play('powerup');
            });
        }

        // Adicionar botão de som
        this.setupSoundButton();

        // Adicionar listener para inicializar áudio no primeiro clique do grid
        this.grid.addEventListener('click', () => {
            if (this.soundManager.audioContext.state === 'suspended') {
                this.soundManager.audioContext.resume();
            }
        }, { once: true });
    }

    setupModals() {
        // Configurar botões de fechar
        document.querySelectorAll('.close-button').forEach(button => {
            button.addEventListener('click', () => {
                button.closest('.modal').style.display = 'none';
            });
        });

        // Configurar botões que abrem modais
        document.getElementById('shopButton').addEventListener('click', () => {
            document.getElementById('shopModal').style.display = 'flex';
        });

        document.getElementById('achievementsButton').addEventListener('click', () => {
            document.getElementById('achievementsModal').style.display = 'flex';
        });

        document.getElementById('rankingButton').addEventListener('click', () => {
            document.getElementById('rankingModal').style.display = 'flex';
        });

        // Fechar modal ao clicar fora
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        // Configurar tabs da loja
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover classe active de todas as tabs
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                // Adicionar classe active na tab clicada
                tab.classList.add('active');

                // Esconder todas as seções
                document.querySelectorAll('.shop-section').forEach(section => {
                    section.classList.remove('active');
                });

                // Mostrar a seção correspondente
                const targetSection = document.getElementById(tab.dataset.tab);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            });
        });

        // Configurar botões de compra de power-ups
        document.querySelectorAll('.powerup-buy-button').forEach(button => {
            button.addEventListener('click', () => {
                const powerupName = button.parentElement.querySelector('h3').textContent;
                const cost = parseInt(button.textContent);
                this.buyPowerup(powerupName, cost);
            });
        });

        // Configurar botão premium
        document.querySelector('.premium-button').addEventListener('click', () => {
            this.buyPremium();
        });
    }

    buyPowerup(powerupName, cost) {
        const zenCoins = parseInt(document.getElementById('zenCoins').textContent);
        if (zenCoins >= cost) {
            // Atualizar moedas
            document.getElementById('zenCoins').textContent = zenCoins - cost;
            
            // Atualizar contador do power-up
            const powerupButton = document.querySelector(`.powerup-button[data-powerup="${powerupName.toLowerCase()}"]`);
            if (powerupButton) {
                const countElement = powerupButton.querySelector('.powerup-count');
                const currentCount = parseInt(countElement.textContent);
                countElement.textContent = currentCount + 1;
                powerupButton.disabled = false;
            }
            
            this.showMessage(`${powerupName} comprado com sucesso!`, 'success');
        } else {
            this.showMessage('Moedas Zen insuficientes!', 'error');
        }
    }

    buyPremium() {
        // Simular uma compra bem-sucedida
        const premiumBadge = document.querySelector('.premium-badge');
        const buttonsContainer = document.querySelector('.buttons');
        
        // Remover classes existentes para garantir uma transição limpa
        buttonsContainer.classList.remove('premium-active');
        
        // Ativar o badge premium com animação
        premiumBadge.style.display = 'inline-block';
        
        // Usar setTimeout para garantir que a animação seja suave
        setTimeout(() => {
            premiumBadge.classList.add('active');
            buttonsContainer.classList.add('premium-active');
        }, 50);

        // Desbloquear temas
        document.querySelectorAll('.theme-item.locked').forEach(theme => {
            theme.classList.remove('locked');
            const button = theme.querySelector('.theme-button');
            button.textContent = 'Selecionar';
        });

        this.showMessage('Você agora é um Zen Master!', 'success');
        document.getElementById('shopModal').style.display = 'none';
    }

    showMessage(text, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = text;
        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 10);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateScore(points) {
        this.score = points;
        document.getElementById('score').textContent = this.score;
    }

    setupGame() {
        this.grid.innerHTML = '';
        this.grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.isProcessing = false;
        this.selectedCell = null;
        
        // Criar matriz do tabuleiro
        const board = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        
        // Primeiro, criar todas as células
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.grid.appendChild(cell);
                
                // Adicionar peça garantindo que não forme combinação
                let piece;
                do {
                    piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
                } while (this.wouldFormMatchInMatrix(row, col, piece.name, board));
                
                board[row][col] = piece.name;
                this.createPiece(cell, piece);
            }
        }

        // Adicionar event listeners
        const cells = this.grid.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });
    }

    wouldFormMatchInMatrix(row, col, pieceName, board) {
        // Verificar horizontalmente
        if (col >= 2) {
            if (board[row][col-1] === pieceName && board[row][col-2] === pieceName) {
                return true;
            }
        }
        
        // Verificar verticalmente
        if (row >= 2) {
            if (board[row-1][col] === pieceName && board[row-2][col] === pieceName) {
                return true;
            }
        }
        
        return false;
    }

    createPiece(cell, piece) {
        // Limpar a célula
        cell.className = 'cell';
        cell.innerHTML = '';
        
        // Adicionar classe e tipo da peça
        cell.classList.add(piece.name);
        cell.dataset.pieceType = piece.name;
        
        // Criar e estilizar o ícone
        const icon = document.createElement('i');
        icon.className = `fas ${piece.icon}`;
        icon.style.color = piece.color;
        icon.style.textShadow = `0 0 10px ${piece.color}40`;
        
        // Adicionar o ícone à célula
        cell.appendChild(icon);
        
        return piece;
    }

    addRandomPiece(cell) {
        const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        return this.createPiece(cell, piece);
    }

    handleCellClick(cell) {
        if (this.isProcessing) return;

        if (!this.selectedCell) {
            // Primeira célula selecionada
            this.selectedCell = cell;
            cell.classList.add('selected');
        } else if (this.selectedCell === cell) {
            // Clicou na mesma célula, desseleciona
            this.selectedCell.classList.remove('selected');
            this.selectedCell = null;
        } else {
            // Segunda célula selecionada
            const row1 = parseInt(this.selectedCell.dataset.row);
            const col1 = parseInt(this.selectedCell.dataset.col);
            const row2 = parseInt(cell.dataset.row);
            const col2 = parseInt(cell.dataset.col);

            if (this.areAdjacent(row1, col1, row2, col2)) {
                this.swapCells(this.selectedCell, cell);
            } else {
                // Se não forem adjacentes, muda a seleção
                this.selectedCell.classList.remove('selected');
                this.selectedCell = cell;
                cell.classList.add('selected');
                return;
            }

            this.selectedCell.classList.remove('selected');
            this.selectedCell = null;
        }
    }

    async swapCells(cell1, cell2) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        // Guardar informações originais
        const class1 = cell1.className;
        const class2 = cell2.className;
        const content1 = cell1.innerHTML;
        const content2 = cell2.innerHTML;
        const type1 = cell1.dataset.pieceType;
        const type2 = cell2.dataset.pieceType;

        // Tocar som de troca
        this.soundManager.play('swap');

        // Trocar aparências e tipos
        cell1.className = class2;
        cell2.className = class1;
        cell1.innerHTML = content2;
        cell2.innerHTML = content1;
        cell1.dataset.pieceType = type2;
        cell2.dataset.pieceType = type1;

        // Verificar se formou combinação
        const matches = await this.checkForMatches();

        if (!matches) {
            // Se não formou combinação, reverter a troca com animação
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Tocar som de movimento inválido
            this.soundManager.play('invalid');
            
            // Adicionar classe de animação antes de reverter
            cell1.classList.add('invalid-move');
            cell2.classList.add('invalid-move');
            
            // Reverter a troca
            cell1.className = class1;
            cell2.className = class2;
            cell1.innerHTML = content1;
            cell2.innerHTML = content2;
            cell1.dataset.pieceType = type1;
            cell2.dataset.pieceType = type2;
            
            // Manter a classe invalid-move
            cell1.classList.add('invalid-move');
            cell2.classList.add('invalid-move');
            
            setTimeout(() => {
                cell1.classList.remove('invalid-move');
                cell2.classList.remove('invalid-move');
                this.isProcessing = false;
            }, 500);
        } else {
            // Se formou combinação, processar matches
            await this.processMatches();
            this.isProcessing = false;
        }
    }

    async checkForMatches() {
        const cells = this.grid.querySelectorAll('.cell');
        let hasMatches = false;

        // Verificar matches horizontais
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 2; col++) {
                const cell1 = this.grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const cell2 = this.grid.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`);
                const cell3 = this.grid.querySelector(`[data-row="${row}"][data-col="${col + 2}"]`);

                if (cell1 && cell2 && cell3) {
                    const type1 = cell1.dataset.pieceType;
                    const type2 = cell2.dataset.pieceType;
                    const type3 = cell3.dataset.pieceType;

                    if (type1 && type1 === type2 && type2 === type3) {
                        hasMatches = true;
                        break;
                    }
                }
            }
            if (hasMatches) break;
        }

        // Verificar matches verticais se não encontrou horizontais
        if (!hasMatches) {
            for (let col = 0; col < this.gridSize; col++) {
                for (let row = 0; row < this.gridSize - 2; row++) {
                    const cell1 = this.grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    const cell2 = this.grid.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`);
                    const cell3 = this.grid.querySelector(`[data-row="${row + 2}"][data-col="${col}"]`);

                    if (cell1 && cell2 && cell3) {
                        const type1 = cell1.dataset.pieceType;
                        const type2 = cell2.dataset.pieceType;
                        const type3 = cell3.dataset.pieceType;

                        if (type1 && type1 === type2 && type2 === type3) {
                            hasMatches = true;
                            break;
                        }
                    }
                }
                if (hasMatches) break;
            }
        }

        return hasMatches;
    }

    async processMatches() {
        let hasMatches;
        do {
            hasMatches = false;
            const matches = new Set();

            // Verificar matches horizontais
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize - 2; col++) {
                    const cell1 = this.grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    const cell2 = this.grid.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`);
                    const cell3 = this.grid.querySelector(`[data-row="${row}"][data-col="${col + 2}"]`);

                    if (cell1 && cell2 && cell3) {
                        const type1 = cell1.dataset.pieceType;
                        const type2 = cell2.dataset.pieceType;
                        const type3 = cell3.dataset.pieceType;

                        if (type1 && type1 === type2 && type2 === type3) {
                            matches.add(cell1);
                            matches.add(cell2);
                            matches.add(cell3);
                            hasMatches = true;
                        }
                    }
                }
            }

            // Verificar matches verticais
            for (let col = 0; col < this.gridSize; col++) {
                for (let row = 0; row < this.gridSize - 2; row++) {
                    const cell1 = this.grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    const cell2 = this.grid.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`);
                    const cell3 = this.grid.querySelector(`[data-row="${row + 2}"][data-col="${col}"]`);

                    if (cell1 && cell2 && cell3) {
                        const type1 = cell1.dataset.pieceType;
                        const type2 = cell2.dataset.pieceType;
                        const type3 = cell3.dataset.pieceType;

                        if (type1 && type1 === type2 && type2 === type3) {
                            matches.add(cell1);
                            matches.add(cell2);
                            matches.add(cell3);
                            hasMatches = true;
                        }
                    }
                }
            }

            if (hasMatches) {
                // Tocar som de combinação
                this.soundManager.play('match');
                
                // Atualizar pontuação
                this.updateScore(this.score + matches.size * 10);
                
                // Animar e remover matches
                matches.forEach(cell => {
                    cell.classList.add('matching');
                });

                await new Promise(resolve => setTimeout(resolve, 400));
                
                matches.forEach(cell => {
                    cell.innerHTML = '';
                    cell.className = 'cell';
                    cell.dataset.pieceType = '';
                });

                // Aplicar gravidade
                await this.applyGravity();
            }

        } while (hasMatches);
    }

    areAdjacent(row1, col1, row2, col2) {
        return (Math.abs(row1 - row2) === 1 && col1 === col2) ||
               (Math.abs(col1 - col2) === 1 && row1 === row2);
    }

    updateCellAppearance(cell, piece) {
        cell.className = `cell ${piece.name}`;
        const icon = cell.querySelector('i') || document.createElement('i');
        icon.className = `fas ${piece.icon}`;
        if (!cell.contains(icon)) {
            cell.appendChild(icon);
        }
    }

    async applyGravity() {
        // Processar coluna por coluna
        for (let col = 0; col < this.gridSize; col++) {
            // Primeiro, mover todas as peças existentes para baixo
            let emptySpaces = 0;
            for (let row = this.gridSize - 1; row >= 0; row--) {
                const currentCell = this.grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                
                if (!currentCell.querySelector('i')) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // Encontrou uma peça que precisa cair
                    const targetRow = row + emptySpaces;
                    const targetCell = this.grid.querySelector(`[data-row="${targetRow}"][data-col="${col}"]`);
                    
                    // Mover a peça para baixo
                    targetCell.className = currentCell.className;
                    targetCell.innerHTML = currentCell.innerHTML;
                    targetCell.dataset.pieceType = currentCell.dataset.pieceType;
                    
                    // Limpar a célula original
                    currentCell.className = 'cell';
                    currentCell.innerHTML = '';
                    currentCell.dataset.pieceType = '';
                }
            }

            // Depois, preencher os espaços vazios no topo
            for (let row = emptySpaces - 1; row >= 0; row--) {
                const cell = this.grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (!cell.querySelector('i')) {
                    this.addRandomPiece(cell);
                    cell.classList.add('dropping');
                }
            }
        }

        // Aguardar a animação de queda
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Remover a classe de animação
        this.grid.querySelectorAll('.dropping').forEach(cell => {
            cell.classList.remove('dropping');
        });

        // Verificar se há novas combinações
        const hasNewMatches = await this.checkForMatches();
        if (hasNewMatches) {
            await this.processMatches();
        }
    }

    setupPowerups() {
        document.querySelectorAll('.powerup-button').forEach(button => {
            button.addEventListener('click', () => {
                const powerupType = button.dataset.powerup;
                const countElement = button.querySelector('.powerup-count');
                const count = parseInt(countElement.textContent);

                if (count > 0) {
                    this.usePowerup(powerupType, button);
                } else {
                    this.showMessage('Você não tem power-ups suficientes!', 'error');
                }
            });
        });
    }

    usePowerup(type, button) {
        const countElement = button.querySelector('.powerup-count');
        const count = parseInt(countElement.textContent);

        // Tocar som de power-up
        this.soundManager.play('powerup');

        switch (type) {
            case 'meditation':
                // Remove uma peça selecionada
                if (this.selectedCell) {
                    this.removePiece(this.selectedCell);
                    this.updateScore(this.score + 5);
                    this.showMessage('Peça removida com sucesso!', 'success');
                } else {
                    this.showMessage('Selecione uma peça para remover!', 'info');
                    return; // Não consome o power-up se nenhuma peça foi selecionada
                }
                break;

            case 'harmony':
                // Embaralha o tabuleiro
                this.shuffleBoard();
                this.showMessage('Tabuleiro embaralhado!', 'success');
                break;

            case 'serenity':
                // Mostra possíveis combinações
                this.showHints();
                this.showMessage('Combinações possíveis destacadas!', 'success');
                break;

            case 'explosion':
                // Explode todas as peças e converte em pontos
                this.explodeAllPieces();
                break;
        }

        // Atualizar contador do power-up
        countElement.textContent = count - 1;
        if (count - 1 === 0) {
            button.disabled = true;
        }
    }

    async explodeAllPieces() {
        const cells = this.grid.querySelectorAll('.cell');
        let totalPieces = 0;

        // Adicionar classe de explosão em todas as células
        cells.forEach(cell => {
            if (cell.querySelector('i')) {
                cell.classList.add('explosion');
                totalPieces++;
            }
        });

        // Calcular pontuação (20 pontos por peça)
        const points = totalPieces * 20;
        this.updateScore(this.score + points);

        // Aguardar a animação de explosão
        await new Promise(resolve => setTimeout(resolve, 500));

        // Limpar todas as células
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.className = 'cell';
            cell.dataset.pieceType = '';
        });

        // Mostrar mensagem de sucesso
        this.showMessage(`Explosão Zen! +${points} pontos!`, 'success');

        // Preencher o tabuleiro com novas peças
        await this.applyGravity();
    }

    removePiece(cell) {
        cell.classList.add('matching');
        setTimeout(() => {
            this.addRandomPiece(cell);
            cell.classList.remove('matching');
        }, 500);
        this.selectedCell = null;
    }

    shuffleBoard() {
        const cells = Array.from(this.grid.querySelectorAll('.cell'));
        const pieces = cells.map(cell => {
            const icon = cell.querySelector('i').className;
            const pieceClass = Array.from(cell.classList).find(c => c !== 'cell');
            return { icon, pieceClass };
        });

        // Embaralhar array de peças
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }

        // Aplicar novas peças
        cells.forEach((cell, index) => {
            cell.className = `cell ${pieces[index].pieceClass}`;
            const icon = cell.querySelector('i') || document.createElement('i');
            icon.className = pieces[index].icon;
            if (!cell.contains(icon)) {
                cell.appendChild(icon);
            }
        });
    }

    showHints() {
        const cells = Array.from(this.grid.querySelectorAll('.cell'));
        let foundHint = false;

        // Remover hints anteriores
        cells.forEach(cell => cell.classList.remove('hint'));

        // Procurar por combinações possíveis
        for (let i = 0; i < cells.length - 1; i++) {
            const cell1 = cells[i];
            const row1 = parseInt(cell1.dataset.row);
            const col1 = parseInt(cell1.dataset.col);

            for (let j = i + 1; j < cells.length; j++) {
                const cell2 = cells[j];
                const row2 = parseInt(cell2.dataset.row);
                const col2 = parseInt(cell2.dataset.col);

                // Verificar se são adjacentes
                if (this.areAdjacent(row1, col1, row2, col2)) {
                    // Tentar trocar temporariamente
                    const class1 = cell1.className;
                    const class2 = cell2.className;
                    cell1.className = class2;
                    cell2.className = class1;

                    // Verificar se forma uma combinação
                    if (this.wouldFormMatch(cell1) || this.wouldFormMatch(cell2)) {
                        cell1.classList.add('hint');
                        cell2.classList.add('hint');
                        foundHint = true;
                    }

                    // Reverter troca
                    cell1.className = class1;
                    cell2.className = class2;

                    if (foundHint) break;
                }
            }
            if (foundHint) break;
        }

        if (!foundHint) {
            this.showMessage('Não há combinações possíveis!', 'info');
            this.shuffleBoard();
        }
    }

    setupSoundButton() {
        const soundButton = document.querySelector('.sound-button');
        const volumeControl = document.querySelector('.volume-slider');

        if (soundButton) {
            soundButton.innerHTML = `<i class="fas ${this.soundManager.isMuted ? 'fa-volume-mute' : 'fa-volume-up'}"></i>`;
            
            soundButton.addEventListener('click', () => {
                const isMuted = this.soundManager.toggleMute();
                soundButton.innerHTML = `<i class="fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}"></i>`;
            });
        }

        if (volumeControl) {
            volumeControl.value = this.soundManager.getVolume() * 100;
            
            volumeControl.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.soundManager.setVolume(volume);
                if (!this.soundManager.isMuted && volume > 0) {
                    this.soundManager.play('swap');
                }
            });
        }
    }
}

class ZenStore {
    constructor(game) {
        this.game = game;
        this.zenCoins = parseInt(localStorage.getItem('relaxingCoins')) || 0;
        this.isPremium = localStorage.getItem('isPremium') === 'true';
        this.powerups = {
            meditation: parseInt(localStorage.getItem('powerup_meditation')) || 0,
            harmony: parseInt(localStorage.getItem('powerup_harmony')) || 0,
            serenity: parseInt(localStorage.getItem('powerup_serenity')) || 0
        };
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        document.querySelectorAll('.powerup-button').forEach(button => {
            button.addEventListener('click', () => {
                const powerup = button.dataset.powerup;
                if (this.powerups[powerup] > 0 || this.isPremium) {
                    this.usePowerup(powerup);
                }
            });
        });
    }

    usePowerup(powerup) {
        if (!this.isPremium) {
            this.powerups[powerup]--;
            localStorage.setItem(`powerup_${powerup}`, this.powerups[powerup]);
        }
        
        switch(powerup) {
            case 'meditation':
                // Implementar lógica do power-up de meditação
                break;
            case 'harmony':
                // Implementar lógica do power-up de harmonia
                break;
            case 'serenity':
                // Implementar lógica do power-up de serenidade
                break;
        }

        this.updateUI();
    }

    updateUI() {
        document.querySelector('.relaxing-coins').textContent = this.zenCoins;
        document.querySelector('.premium-badge').style.display = this.isPremium ? 'inline-block' : 'none';

        Object.entries(this.powerups).forEach(([powerup, count]) => {
            const button = document.querySelector(`.powerup-button[data-powerup="${powerup}"]`);
            if (button) {
                button.disabled = count === 0 && !this.isPremium;
                button.querySelector('.powerup-count').textContent = this.isPremium ? '∞' : count;
            }
        });
    }

    addCoins(amount) {
        this.zenCoins += amount;
        localStorage.setItem('relaxingCoins', this.zenCoins);
        this.updateUI();
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ZenMatch();
}); 