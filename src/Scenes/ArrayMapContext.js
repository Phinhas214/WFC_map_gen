class ArrayMapContext extends Phaser.Scene {
    constructor() {
        super("arrayMapScene");
        this.gridWidth = 20;
        this.gridHeight = 20;
        this.tileSize = 32;  // Using 64x64 tiles
    }

    preload() {
        this.load.path = "./assets/";

        // Load base and transition tiles
        this.load.image('water', 'water.png');
        this.load.image('land', 'land.png');
        this.load.image('tree', 'tree.png');
        this.load.image('building', 'building.png');

        // Load transition tiles for different water/land configurations
        this.load.image('water_left', 'water_left.png');           // Water on the left
        this.load.image('water_right', 'water_right.png');         // Water on the right
        this.load.image('water_top', 'water_top.png');             // Water above
        this.load.image('water_bottom', 'water_bottom.png');       // Water below
        this.load.image('water_top_left', 'water_top_left.png');   // Water above and left
        this.load.image('water_top_right', 'water_top_right.png'); // Water above and right
        this.load.image('water_bottom_left', 'water_bottom_left.png'); // Water below and left
        this.load.image('water_bottom_right', 'water_bottom_right.png'); // Water below and right
    }

    create() {
        this.generateMap();

        this.input.keyboard.on('keydown-R', () => {
            this.generateMap();
        });
        this.input.keyboard.on('keydown-S', () => {
            this.scene.start("arrayMapSceneCopy");
        });
        document.getElementById('description').innerHTML = '<h2>WFC Context Sensitive Generation</h2><br>S: Next Scene'
    }

    generateMap() {
        this.tiles = Array.from({ length: this.gridHeight }, () =>
            Array.from({ length: this.gridWidth }, () => ({
                possibleTiles: ['water', 'land'],
                collapsed: false
            }))
        );

        while (this.hasUncollapsedTiles()) {
            const tile = this.observe();
            this.propagate(tile);
        }

        this.renderMap();
        this.addDecorations();
    }

    hasUncollapsedTiles() {
        return this.tiles.some(row => row.some(tile => !tile.collapsed));
    }

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
            const context = this.getContext(x, y);
            const weightedTiles = this.getContextSensitiveWeights(tile.possibleTiles, context);
            // returns a 2X2 array, 1st array for water weight, 2nd array for land weight
            // console.log(weightedTiles);
            const weights = []; 
            weights.push(weightedTiles[0][1]);
            weights.push(weightedTiles[1][1]);
            const items = ['water', 'land'];
            const randomTile = this.weightedRandom(items, weights);
            if (weightedTiles[0][1] > weightedTiles[1][1]) {

            }
            // if (randomTile) {
            //     // console.log(randomTile[0]);

            //     if (randomTile[0] == 0) { // 0 = water
            //         tile.possibleTiles = 'water';
            //         // tile.possibleTiles[1] = 'land';
            //     }
            //     else { // 1 = land
            //         tile.possibleTiles = 'land';
            //         // tile.possibleTiles[1] = 'water';
            //     }
            // }
            

            // console.log("before " + tile.possibleTiles);
            tile.possibleTiles[0] = randomTile;
            // console.log("after " + tile.possibleTiles);
            
            tile.collapsed = true;
        }

        return chosenTile;
    }

    getContext(x, y) {
        const neighbors = this.getNeighbors(x, y);
        let context = {
            left: neighbors.find(neighbor => neighbor.nx < x) || null,
            right: neighbors.find(neighbor => neighbor.nx > x) || null,
            top: neighbors.find(neighbor => neighbor.ny < y) || null,
            bottom: neighbors.find(neighbor => neighbor.ny > y) || null,
        };
        return context;
    }

    weightedRandom(items, weights) {
        let totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let randomNumber = Math.random() * totalWeight;
      
        for (let i = 0; i < items.length; i++) {
          if (randomNumber < weights[i]) {
            return items[i];
          }
          randomNumber -= weights[i];
        }
    }

    getContextSensitiveWeights(possibleTiles, context) {
        return possibleTiles.map(tileType => {
            let weight = 1;

            // Example context-sensitive rules (add more as needed)
            if (tileType === 'water') { // water = 0
                if (context.left && context.left.type === 'water') weight *= 1.3;
                if (context.right && context.right.type === 'water') weight *= 1.3;
            }
            if (tileType === 'land') { // land = 1
                if (context.left && context.left.type === 'land') weight *= 2;
                if (context.right && context.right.type === 'land') weight *= 2;
                if (context.top && context.top.type === 'land') weight *= 2;
                if (context.bottom && context.bottom.type === 'land') weight *= 2;
            }
            if (tileType === "water") {
                return [ 0, weight ];
            }
            if (tileType === "land") {
                return [ 1, weight ];
            }
            
        });
    }

    propagate({ x, y }) {
        const stack = [{ x, y }];

        while (stack.length > 0) {
            const current = stack.pop();
            const tile = this.tiles[current.y][current.x];
            const neighbors = this.getNeighbors(current.x, current.y);

            neighbors.forEach(({ nx, ny }) => {
                const neighborTile = this.tiles[ny][nx];
                if (!neighborTile.collapsed) {
                    const context = this.getContext(nx, ny);
                    const newPossibleTiles = neighborTile.possibleTiles.filter(neighborType => {
                        return true; // Refine with specific neighbor constraints if needed
                    });

                    if (newPossibleTiles.length < neighborTile.possibleTiles.length) {
                        neighborTile.possibleTiles = newPossibleTiles;
                        stack.push({ x: nx, y: ny });
                    }
                }
            });
        }
    }

    getNeighbors(x, y) {
        const neighbors = [];
        if (x > 0) neighbors.push({ nx: x - 1, ny: y, type: this.tiles[y][x - 1].possibleTiles[0] });
        if (x < this.gridWidth - 1) neighbors.push({ nx: x + 1, ny: y, type: this.tiles[y][x + 1].possibleTiles[0] });
        if (y > 0) neighbors.push({ nx: x, ny: y - 1, type: this.tiles[y - 1][x].possibleTiles[0] });
        if (y < this.gridHeight - 1) neighbors.push({ nx: x, ny: y + 1, type: this.tiles[y + 1][x].possibleTiles[0] });
        return neighbors;
    }

    renderMap() {
        this.cameras.main.setBounds(0, 0, this.gridWidth * this.tileSize, this.gridHeight * this.tileSize);
        this.add.existing(this.cameras.main);

        this.tiles.forEach((row, y) => {
            row.forEach((tile, x) => {
                const tileType = tile.possibleTiles[0];
                this.add.image(x * this.tileSize, y * this.tileSize, tileType).setOrigin(0);
            });
        });
    }

    addDecorations() {
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(0, this.gridWidth - 1);
            const y = Phaser.Math.Between(0, this.gridHeight - 1);
            const tile = this.tiles[y][x];

            if (tile.possibleTiles[0] === 'land') {
                const decoration = Phaser.Math.RND.pick(['tree', 'building']);
                const decorationImage = this.add.image(x * this.tileSize, y * this.tileSize, decoration).setOrigin(0);
                decorationImage.setScale(0.5);
                // this.tileContainer.add(decorationImage);
            }
        }
    }
}