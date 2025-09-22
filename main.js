const state = {
    version: 1,
    tLast: Date.now(),
    resources: {
        energy: 10,
        materials: 100,
        science: 0,
    },
    rates: {
        eps: 1,
        mps: 0,
        sps: 0,
    },
    generators: {
        solar: 0,
        geothermal: 0,
        fusion: 0,
        lab: 0
    },
    upgrades: new Set(),
    research: new Set(),
    ships: [],
    missions: [],
    colonies: []
};

const generators = {
    solar: { name: 'Solar Farm', baseCost: 10, costGrowth: 1.15, baseProd: 1, resource: 'energy' },
    geothermal: { name: 'Geothermal Plant', baseCost: 100, costGrowth: 1.2, baseProd: 10, resource: 'energy' },
    fusion: { name: 'Fusion Reactor', baseCost: 1000, costGrowth: 1.25, baseProd: 100, resource: 'energy' },
    lab: { name: 'Research Lab', baseCost: 100, costGrowth: 1.2, baseProd: 1, resource: 'science' }
};

const research = {
    unlockGeothermal: { name: 'Unlock Geothermal', cost: 10, unlocks: { generators: ['geothermal'] } },
    unlockFusion: { name: 'Unlock Fusion', cost: 100, unlocks: { generators: ['fusion'] } },
    unlockMissions: { name: 'Unlock Missions', cost: 50, unlocks: { missions: true } },
    unlockColonies: { name: 'Unlock Colonies', cost: 200, unlocks: { colonies: true } }
};

const ships = {
    scout: { name: 'Scout', cost: 100, capacity: 100 },
    miner: { name: 'Miner', cost: 500, capacity: 500 }
};

const missions = {
    explore: { name: 'Explore', duration: 60, rewards: { materials: 100 } },
    mine: { name: 'Mine Asteroid', duration: 120, rewards: { materials: 500 } }
};

const colonies = {
    alphaCentauri: { name: 'Alpha Centauri', cost: 10000, production: { energy: 100 } }
};

const upgrades = {
    solarUpgrade1: { name: 'Solar Panel Efficiency', cost: 100, multiplier: 2, generator: 'solar' },
    geothermalUpgrade1: { name: 'Geothermal Turbine Upgrade', cost: 1000, multiplier: 2, generator: 'geothermal' },
    fusionUpgrade1: { name: 'Fusion Containment Field', cost: 10000, multiplier: 2, generator: 'fusion' }
};

const ui = {
    init() {
        this.updateResources();
        this.initTabs();
        this.renderGenerators();
        this.renderUpgrades();
        this.renderResearch();
        this.renderShips();
        this.renderMissions();
    },
    updateResources() {
        const { energy, materials, science } = state.resources;
        const { eps, mps, sps } = state.rates;
        document.getElementById('resource-bar').innerHTML = `
            <span>Energy: ${energy.toFixed(2)} (${eps.toFixed(2)}/s)</span> | 
            <span>Materials: ${materials.toFixed(2)} (${mps.toFixed(2)}/s)</span> | 
            <span>Science: ${science.toFixed(2)} (${sps.toFixed(2)}/s)</span>
        `;
    },
    initTabs() {
        const tabs = document.querySelectorAll('nav button');
        const panels = document.querySelectorAll('.panel');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                panels.forEach(p => p.classList.remove('active'));
                document.getElementById(`${tab.dataset.tab}-panel`).classList.add('active');
            });
        });
    },
    renderGenerators() {
        const container = document.getElementById('generators');
        container.innerHTML = '';
        for (const id in generators) {
            const gen = generators[id];
            if (id !== 'solar' && id !== 'lab' && !Array.from(state.research).some(resId => research[resId].unlocks.generators.includes(id))) continue;
            const level = state.generators[id];
            const cost = gen.baseCost * Math.pow(gen.costGrowth, level);
            const el = document.createElement('div');
            el.innerHTML = `
                <strong>${gen.name}</strong> (Level ${level})<br>
                Produces: ${gen.baseProd * level} ${gen.resource === 'energy' ? 'E/s' : 'S/s'}<br>
                Cost: ${cost.toFixed(2)} Energy
                <button data-generator="${id}">Buy</button>
            `;
            el.querySelector('button').addEventListener('click', () => buyGenerator(id));
            container.appendChild(el);
        }
    },
    renderUpgrades() {
        const container = document.getElementById('upgrades');
        container.innerHTML = '';
        for (const id in upgrades) {
            if (state.upgrades.has(id)) continue;
            const upgrade = upgrades[id];
            const el = document.createElement('div');
            el.innerHTML = `
                <strong>${upgrade.name}</strong><br>
                Effect: x${upgrade.multiplier} to ${generators[upgrade.generator].name} production<br>
                Cost: ${upgrade.cost.toFixed(2)} Energy
                <button data-upgrade="${id}">Buy</button>
            `;
            el.querySelector('button').addEventListener('click', () => buyUpgrade(id));
            container.appendChild(el);
        }
    },
    renderResearch() {
        const container = document.getElementById('research');
        container.innerHTML = '';
        for (const id in research) {
            if (state.research.has(id)) continue;
            const res = research[id];
            const el = document.createElement('div');
            el.innerHTML = `
                <strong>${res.name}</strong><br>
                Cost: ${res.cost.toFixed(2)} Science
                <button data-research="${id}">Research</button>
            `;
            el.querySelector('button').addEventListener('click', () => buyResearch(id));
            container.appendChild(el);
        }
    },
    renderShips() {
        const container = document.getElementById('ships');
        container.innerHTML = '';
        for (const id in ships) {
            const ship = ships[id];
            const el = document.createElement('div');
            el.innerHTML = `
                <strong>${ship.name}</strong><br>
                Cost: ${ship.cost} Materials
                <button data-ship="${id}">Build</button>
            `;
            el.querySelector('button').addEventListener('click', () => buildShip(id));
            container.appendChild(el);
        }
        const shipCounts = state.ships.reduce((acc, ship) => {
            acc[ship.type] = (acc[ship.type] || 0) + 1;
            return acc;
        }, {});
        for (const id in shipCounts) {
            const el = document.createElement('div');
            el.innerHTML = `${ships[id].name}: ${shipCounts[id]}`;
            container.appendChild(el);
        }
    },
    renderMissions() {
        const container = document.getElementById('missions');
        container.innerHTML = '';
        if (!state.research.has('unlockMissions')) return;
        for (const id in missions) {
            const mission = missions[id];
            const el = document.createElement('div');
            el.innerHTML = `
                <strong>${mission.name}</strong><br>
                Duration: ${mission.duration}s<br>
                Rewards: ${Object.entries(mission.rewards).map(([key, value]) => `${value} ${key}`).join(', ')}
                <button data-mission="${id}">Start</button>
            `;
            el.querySelector('button').addEventListener('click', () => startMission(id));
            container.appendChild(el);
        }
        const activeMissions = state.missions.map(mission => {
            const remaining = (mission.endTime - Date.now()) / 1000;
            return `<li>${missions[mission.type].name} - ${remaining.toFixed(0)}s remaining</li>`;
        }).join('');
        if (activeMissions) {
            container.innerHTML += `<h3>Active Missions</h3><ul>${activeMissions}</ul>`;
        }
    }
};

function buildShip(id) {
    const ship = ships[id];
    if (state.resources.materials >= ship.cost) {
        state.resources.materials -= ship.cost;
        state.ships.push({ type: id });
        ui.renderShips();
    }
}

function startMission(id) {
    const mission = missions[id];
    // For simplicity, we'll just use one ship per mission for now
    if (state.ships.length > state.missions.length) {
        state.missions.push({ type: id, endTime: Date.now() + mission.duration * 1000 });
        ui.renderMissions();
    }
}

function buyGenerator(id) {
    const gen = generators[id];
    const level = state.generators[id];
    const cost = gen.baseCost * Math.pow(gen.costGrowth, level);
    if (state.resources.energy >= cost) {
        state.resources.energy -= cost;
        state.generators[id]++;
        updateRates();
        ui.renderGenerators();
    }
}

function buyUpgrade(id) {
    const upgrade = upgrades[id];
    if (state.resources.energy >= upgrade.cost) {
        state.resources.energy -= upgrade.cost;
        state.upgrades.add(id);
        updateRates();
        ui.renderUpgrades();
    }
}

function buyResearch(id) {
    const res = research[id];
    if (state.resources.science >= res.cost) {
        state.resources.science -= res.cost;
        state.research.add(id);
        // Unlock things
        if (res.unlocks.generators) {
            res.unlocks.generators.forEach(genId => {
                // This is just to make them visible, the actual check is in renderGenerators
            });
        }
        updateRates();
        ui.renderResearch();
        ui.renderGenerators();
    }
}

function updateRates() {
    let eps = 0;
    let sps = 0;
    for (const id in generators) {
        let multiplier = 1;
        for (const upgradeId of state.upgrades) {
            const upgrade = upgrades[upgradeId];
            if (upgrade.generator === id) {
                multiplier *= upgrade.multiplier;
            }
        }
        if (generators[id].resource === 'energy') {
            eps += generators[id].baseProd * state.generators[id] * multiplier;
        } else if (generators[id].resource === 'science') {
            sps += generators[id].baseProd * state.generators[id] * multiplier;
        }
    }
    state.rates.eps = eps;
    state.rates.sps = sps;
}

function gameLoop() {
    const now = Date.now();
    const delta = (now - state.tLast) / 1000;
    state.tLast = now;

    // Mission completion
    const completedMissions = state.missions.filter(m => now >= m.endTime);
    for (const mission of completedMissions) {
        const missionData = missions[mission.type];
        for (const resource in missionData.rewards) {
            state.resources[resource] += missionData.rewards[resource];
        }
    }
    if (completedMissions.length > 0) {
        state.missions = state.missions.filter(m => now < m.endTime);
        ui.renderMissions();
    }

    state.resources.energy += state.rates.eps * delta;
    state.resources.materials += state.rates.mps * delta;
    state.resources.science += state.rates.sps * delta;

    ui.updateResources();
    ui.renderMissions(); // To update timers

    requestAnimationFrame(gameLoop);
}

function bootstrap() {
    console.log("Game bootstrapped!");
    updateRates();
    ui.init();
    requestAnimationFrame(gameLoop);
}

bootstrap();
