const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;


app.use(express.json());

function initializeDataFiles() {
    const dataDir = path.join(__dirname, 'data');
    const scenariosDir = path.join(dataDir, 'scenarios');
    const deltasPath = path.join(dataDir, 'deltas.json');
    const counterPath = path.join(dataDir, 'counter.json');
    
    // Kreiraj data folder
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Kreiran data folder');
    }
    
    // Kreiraj scenarios folder
    if (!fs.existsSync(scenariosDir)) {
        fs.mkdirSync(scenariosDir, { recursive: true });
        console.log('Kreiran scenarios folder');
    }
    
    // Inicijalizuj deltas.json
    if (!fs.existsSync(deltasPath)) {
        fs.writeFileSync(deltasPath, JSON.stringify([], null, 2), 'utf8');
        console.log('Inicijalizovan deltas.json');
    }
    
    
    if (!fs.existsSync(counterPath)) {
        fs.writeFileSync(counterPath, JSON.stringify({ currentId: 1 }, null, 2), 'utf8');
        console.log('Inicijalizovan counter.json');
    }
}


initializeDataFiles();




app.use(express.static(__dirname));


// app.use('/css', express.static(path.join(__dirname, 'css')));
// app.use('/js', express.static(path.join(__dirname, 'js')));
// app.use('/html', express.static(path.join(__dirname, 'html')));

// Ruta za glavnu stranicu
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'writing.html'));
});

// Globalne varijable za lockove (u memoriji)
let lineLocks = {};
let userLineLock = {};
let characterLocks = {};
let userCharacterLock = {};

// ===== RUTA 1: Kreiranje novog scenarija =====
app.post('/api/scenarios', (req, res) => {
    const { title } = req.body;
    const scenarioTitle = title && title.trim() !== '' ? title : 'Neimenovani scenarij';
    const counterFilePath = path.join(__dirname, 'data', 'counter.json');
    
 
    if (!fs.existsSync(path.join(__dirname, 'data'))) {
        fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    }
    
    fs.readFile(counterFilePath, 'utf8', (err, data) => {
        if (err) {
            const initialCounter = { currentId: 1 };
            fs.writeFile(counterFilePath, JSON.stringify(initialCounter, null, 2), (err) => {
                if (err) return res.status(500).json({ error: 'Neuspješno inicijaliziranje brojača' });
                createNewScenario(initialCounter.currentId, scenarioTitle, res);
            });
        } else {
            const counter = JSON.parse(data);
            const newScenarioId = counter.currentId;
            createNewScenario(newScenarioId, scenarioTitle, res);
            
            counter.currentId++;
            fs.writeFile(counterFilePath, JSON.stringify(counter, null, 2), (err) => {
                if (err) console.error('Greška pri ažuriranju brojača');
            });
        }
    });
});

function createNewScenario(newScenarioId, scenarioTitle, res) {
    const newScenario = {
        id: newScenarioId,
        title: scenarioTitle,
        content: [
            {
                lineId: 1,
                nextLineId: null,
                text: ''
            }
        ]
    };

    const scenariosDir = path.join(__dirname, 'data', 'scenarios');
    const scenarioFilePath = path.join(scenariosDir, `scenario-${newScenarioId}.json`);

    if (!fs.existsSync(scenariosDir)) {
        fs.mkdirSync(scenariosDir, { recursive: true });
    }

    fs.writeFile(scenarioFilePath, JSON.stringify(newScenario, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Neuspješno pohranjivanje scenarija' });
        }
        res.status(200).json(newScenario);
    });
}

// ===== RUTA 2: Zaključavanje linije =====
app.post('/api/scenarios/:scenarioId/lines/:lineId/lock', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const lineId = parseInt(req.params.lineId);
    const userIdStr = String(req.body.userId);

    const scenariosDir = path.join(__dirname, 'data', 'scenarios');
    const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);

    if (!fs.existsSync(scenarioPath)) {
        return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
    const line = scenario.content.find(l => l.lineId === lineId);
    
    if (!line) {
        return res.status(404).json({ message: "Linija ne postoji!" });
    }

    const lockKey = `${scenarioId}-${lineId}`;

    if (lineLocks[lockKey] === userIdStr) {
        return res.status(200).json({ message: "Linija je uspjesno zakljucana!" });
    }

    if (lineLocks[lockKey]) {
        return res.status(409).json({ message: "Linija je vec zakljucana!" });
    }

    if (userLineLock[userIdStr]) {
        delete lineLocks[userLineLock[userIdStr]];
    }

    lineLocks[lockKey] = userIdStr;
    userLineLock[userIdStr] = lockKey;

    return res.status(200).json({ message: "Linija je uspjesno zakljucana!" });
});

// ===== RUTA 3: Ažuriranje linije =====
app.put('/api/scenarios/:scenarioId/lines/:lineId', (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const lineId = parseInt(req.params.lineId);
        const { userId, newText } = req.body;
        const userIdStr = String(userId);

        
        if (!Array.isArray(newText) || newText.length === 0) {
            return res.status(400).json({ message: "Niz new_text ne smije biti prazan!" });
        }

        
        const scenariosDir = path.join(__dirname, 'data', 'scenarios');
        const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);

        if (!fs.existsSync(scenarioPath)) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        
        const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
        const lineIndex = scenario.content.findIndex(l => l.lineId === lineId);
        
        
        if (lineIndex === -1) {
            return res.status(404).json({ message: "Linija ne postoji!" });
        }

        const line = scenario.content[lineIndex];
        const lockKey = `${scenarioId}-${lineId}`;

        
        if (!lineLocks[lockKey]) {
            return res.status(409).json({ message: "Linija nije zakljucana!" });
        }

        
        if (lineLocks[lockKey] !== userIdStr) {
            return res.status(409).json({ message: "Linija je vec zakljucana!" });
        }

       
        function wrapText(text) {
            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            const lines = [];
            
            for (let i = 0; i < words.length; i += 20) {
                lines.push(words.slice(i, i + 20).join(' '));
            }
            
            return lines.length > 0 ? lines : [''];
        }

        
        let allWrappedLines = [];
        for (const text of newText) {
            const wrapped = wrapText(text);
            allWrappedLines = allWrappedLines.concat(wrapped);
        }

       
        let maxLineId = Math.max(...scenario.content.map(l => l.lineId));
        const originalNextLineId = line.nextLineId;
        
      
        line.text = allWrappedLines[0];
        
        
        const newLines = [];
        for (let i = 1; i < allWrappedLines.length; i++) {
            maxLineId++;
            const newLine = {
                lineId: maxLineId,
                text: allWrappedLines[i],
                nextLineId: i === allWrappedLines.length - 1 ? originalNextLineId : maxLineId + 1
            };
            newLines.push(newLine);
        }

      
        if (newLines.length > 0) {
            line.nextLineId = newLines[0].lineId;
        } else {
            line.nextLineId = originalNextLineId;
        }

        
        scenario.content.splice(lineIndex + 1, 0, ...newLines);
        
        fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2), 'utf8');

       
        delete lineLocks[lockKey];
        if (typeof userLineLock !== 'undefined') {
            delete userLineLock[userIdStr];
        }

        
        const deltasPath = path.join(__dirname, 'data', 'deltas.json');
        let deltas = [];
        
        if (fs.existsSync(deltasPath)) {
            const fileContent = fs.readFileSync(deltasPath, 'utf8').trim();
            if (fileContent) {
                try {
                    deltas = JSON.parse(fileContent);
                } catch (parseError) {
                    console.error('Error parsing deltas.json, starting fresh:', parseError.message);
                    deltas = [];
                }
            }
        }

       
        const timestamp = Math.floor(Date.now() / 1000);

        
        deltas.push({
            scenarioId: scenarioId,
            type: "line_update",
            lineId: lineId,
            nextLineId: line.nextLineId,
            content: line.text,
            timestamp: timestamp
        });

        
        for (const newLine of newLines) {
            deltas.push({
                scenarioId: scenarioId,
                type: "line_update",
                lineId: newLine.lineId,
                nextLineId: newLine.nextLineId,
                content: newLine.text,
                timestamp: timestamp
            });
        }

        
        fs.writeFileSync(deltasPath, JSON.stringify(deltas, null, 2), 'utf8');

        return res.status(200).json({ message: "Linija je uspjesno azurirana!" });
        
    } catch (error) {
        console.error('Error in PUT /api/scenarios/:scenarioId/lines/:lineId:', error);
        return res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
});

// ===== RUTA 4: Zaključavanje imena lika =====
app.post('/api/scenarios/:scenarioId/characters/lock', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const userIdStr = String(req.body.userId);
    const characterName = String(req.body.characterName);
    
    const scenariosDir = path.join(__dirname, 'data', 'scenarios');
    const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);

    if (!fs.existsSync(scenarioPath)) {
        return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const lockKey = `${scenarioId}-${characterName}`;

    
    if (characterLocks[lockKey]) {
        return res.status(409).json({ message: "Konflikt! Ime lika je vec zakljucano!" });
    }

   
    if (userCharacterLock[userIdStr]) {
        delete characterLocks[userCharacterLock[userIdStr]];
    }

    
    characterLocks[lockKey] = userIdStr;
    userCharacterLock[userIdStr] = lockKey;

    return res.status(200).json({ message: "Ime lika je uspjesno zakljucano!" });
});

// ===== RUTA 5: Promjena imena lika =====
app.post('/api/scenarios/:scenarioId/characters/update', (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const { userId, oldName, newName } = req.body;
        const userIdStr = String(userId);

        const scenariosDir = path.join(__dirname, 'data', 'scenarios');
        const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);

        
        if (!fs.existsSync(scenarioPath)) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        const lockKey = `${scenarioId}-${oldName}`;

        
        if (!characterLocks[lockKey]) {
            return res.status(409).json({ message: "Konflikt! Ime lika nije zakljucano!" });
        }

        if (characterLocks[lockKey] !== userIdStr) {
            return res.status(409).json({ message: "Konflikt! Ime lika je zakljucano od strane drugog korisnika!" });
        }

       
        const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
        
       
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        
        scenario.content.forEach(line => {
            line.text = line.text.replace(regex, newName);
        });

       
        fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2), 'utf8');

        
        delete characterLocks[lockKey];
        delete userCharacterLock[userIdStr];

        
        const deltasPath = path.join(__dirname, 'data', 'deltas.json');
        let deltas = [];
        
        if (fs.existsSync(deltasPath)) {
            const fileContent = fs.readFileSync(deltasPath, 'utf8').trim();
            if (fileContent) {
                try {
                    deltas = JSON.parse(fileContent);
                } catch (parseError) {
                    console.error('Error parsing deltas.json:', parseError.message);
                    deltas = [];
                }
            }
        }

        
        deltas.push({
            scenarioId: scenarioId,
            type: "char_rename",
            oldName: oldName,
            newName: newName,
            timestamp: Math.floor(Date.now() / 1000)
        });

        
        fs.writeFileSync(deltasPath, JSON.stringify(deltas, null, 2), 'utf8');

        return res.status(200).json({ message: "Ime lika je uspjesno promijenjeno!" });
        
    } catch (error) {
        console.error('Error in POST /api/scenarios/:scenarioId/characters/update:', error);
        return res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
});

app.get('/api/scenarios/:scenarioId/deltas', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const since = req.query.since ? parseInt(req.query.since) : 0;

    const scenariosDir = path.join(__dirname, 'data', 'scenarios');
    const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);

    if (!fs.existsSync(scenarioPath)) {
        return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const deltasPath = path.join(__dirname, 'data', 'deltas.json');
    let deltas = [];

    try {
        if (fs.existsSync(deltasPath)) {
            const deltasData = fs.readFileSync(deltasPath, 'utf-8');
            if (deltasData.trim() !== '') {
                deltas = JSON.parse(deltasData);
            }
        }
    } catch (error) {
        console.error('Greška:', error.message);
        deltas = [];
    }

    const filteredDeltas = deltas
        .filter(delta => delta.scenarioId === scenarioId && delta.timestamp > since)
        .sort((a, b) => a.timestamp - b.timestamp);

    res.status(200).json({ deltas: filteredDeltas });
});

// ===== RUTA 7: Dohvat pojedinačnog scenarija =====
app.get('/api/scenarios/:scenarioId', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const scenariosDir = path.join(__dirname, 'data', 'scenarios');
    const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);

    if (!fs.existsSync(scenarioPath)) {
        return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const scenarioData = fs.readFileSync(scenarioPath, 'utf8');
    const scenario = JSON.parse(scenarioData);

    res.status(200).json(scenario);
});

// Pokretanje servera
app.listen(port, () => {
    console.log(`\n Server radi na http://localhost:${port}`);
    console.log(`Otvorite: http://localhost:${port}/html/writing.html`);
    
});