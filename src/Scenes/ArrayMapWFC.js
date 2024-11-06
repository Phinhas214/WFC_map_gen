class ArrayMapWFC extends Phaser.Scene {
    constructor() {
        super("arrayMapSceneCopy");
        this.gridWidth = 20;
        this.gridHeight = 20;
        this.tileSize = 32;
        this.tileContainer = null; 
    }

    preload() {
        this.load.path = "./assets/";

        // Load base and transition tiles
        this.load.image('water', 'water.png');
        this.load.image('land', 'land.png');
        this.load.image('tree', 'tree.png');
        this.load.image('building', 'building.png');
        this.load.image('tempTile', 'monstrosity.png');
    }

    create() {
        this.tileContainer = this.add.container(0, 0);  // Create a container for tiles
        this.generateMap();

        this.input.keyboard.on('keydown-R', () => {
            this.generateMap();
        });
        this.input.keyboard.on('keydown-S', () => {
            this.scene.start("arrayMapScene");
        });
        document.getElementById('description').innerHTML = '<h2>WFC Generation</h2><br>S: Next Scene'
    }

    generateMap() {
        this.tileContainer.removeAll(true);

        this.tiles = Array.from({ length: this.gridHeight }, () =>
            Array.from({ length: this.gridWidth }, () => ({
                possibleTiles: ['water', 'land'],
                collapsed: false
            }))
        );
    
        this.generateTiles();
    }
    
    async generateTiles() {
        while (this.hasUncollapsedTiles()) {
            const tile = this.observe();
            this.propagate(tile);
            this.renderMap();
            // await this.delay(1);
        }
    
        this.addDecorations();
    }
    
    delay(ms) {
        return new Promise(resolve => this.time.delayedCall(ms, resolve));
    }

    hasUncollapsedTiles() {
        for (let row of this.tiles) {
            for (let tile of row) {
                if (!tile.collapsed) {
                    return true;
                }
            }
        }
        return false;
    }

    // Observe function - Finds tile with lowest entropy and collapses it
    observe() {
        let minEntropy = Infinity;
        let chosenTile = null;

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile = this.tiles[y][x];
                if (!tile.collapsed && tile.possibleTiles.length < minEntropy) {
                    minEntropy = tile.possibleTiles.length;
                    chosenTile = { x, y };
                }
            }
        }

        if (chosenTile) {
            const { x, y } = chosenTile;
            const tile = this.tiles[y][x];
            const randomTile = Phaser.Math.RND.pick(tile.possibleTiles);

            tile.possibleTiles = [randomTile];
            tile.collapsed = true;
        }

        return chosenTile;
    }

    // Propagate constraints from a tile to its neighbors
    propagate({ x, y }) {
        const stack = [{ x, y }];

        while (stack.length > 0) {
            const current = stack.pop();
            const tile = this.tiles[current.y][current.x];

            const neighbors = this.getNeighbors(current.x, current.y);

            neighbors.forEach(({ nx, ny }) => {
                const neighborTile = this.tiles[ny][nx];
                if (!neighborTile.collapsed) {
                    const newPossibleTiles = neighborTile.possibleTiles.filter((neighborType) => {
                        return true;
                    });

                    if (newPossibleTiles.length < neighborTile.possibleTiles.length) {
                        neighborTile.possibleTiles = newPossibleTiles;
                        stack.push({ x: nx, y: ny });
                    }
                }
            });
        }
    }

    // Helper to get neighbors within bounds
    getNeighbors(x, y) {
        const neighbors = [];
        if (x > 0) neighbors.push({ nx: x - 1, ny: y }); // left
        if (x < this.gridWidth - 1) neighbors.push({ nx: x + 1, ny: y }); // right
        if (y > 0) neighbors.push({ nx: x, ny: y - 1 }); // top
        if (y < this.gridHeight - 1) neighbors.push({ nx: x, ny: y + 1 }); // bottom
        return neighbors;
    }

    renderMap() {
        this.tileContainer.removeAll(true);

        this.tiles.forEach((row, y) => {
            row.forEach((tile, x) => {
                let tileChoice;
                if (tile.collapsed) {
                    tileChoice = tile.possibleTiles[0];
                } else {
                    tileChoice = 'tempTile';
                }

                const placedTile = this.add.image(x * this.tileSize, y * this.tileSize, tileChoice).setOrigin(0);
                placedTile.setScale(0.5);
                this.tileContainer.add(placedTile);
            });
        });
    }

    // Adds decorations such as trees or buildings
    addDecorations() {
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(0, this.gridWidth - 1);
            const y = Phaser.Math.Between(0, this.gridHeight - 1);
            const tile = this.tiles[y][x];

            if (tile.possibleTiles[0] === 'land') {
                const decoration = Phaser.Math.RND.pick(['tree', 'building']);
                const decorationImage = this.add.image(x * this.tileSize, y * this.tileSize, decoration).setOrigin(0);
                decorationImage.setScale(0.5);
                this.tileContainer.add(decorationImage);
            }
        }
    }
}