/*const express = require('express');
const fs = require('fs');
const path = require('path');
const { sequelize, Scenario, Line, Delta, Checkpoint } = require('./models');
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
//===================NOVE RUTE ZA SPIRALU 4==========================

// POST /api/scenarios/:scenarioId/checkpoint
app.post('/api/scenarios/:scenarioId/checkpoint', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        await Checkpoint.create({
            scenarioId: scenarioId,
            timestamp: Math.floor(Date.now() / 1000)
        });

        res.status(200).json({ message: "Checkpoint je uspjesno kreiran!" });
    } catch (error) {
        console.error('Greška:', error);
        res.status(500).json({ error: 'Greška pri kreiranju checkpointa' });
    }
});

// GET /api/scenarios/:scenarioId/checkpoints
app.get('/api/scenarios/:scenarioId/checkpoints', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        const checkpoints = await Checkpoint.findAll({
            where: { scenarioId: scenarioId },
            attributes: ['id', 'timestamp'],
            order: [['timestamp', 'ASC']]
        });

        res.status(200).json(checkpoints);
    } catch (error) {
        console.error('Greška:', error);
        res.status(500).json({ error: 'Greška pri dohvatu checkpointa' });
    }
});

// GET /api/scenarios/:scenarioId/restore/:checkpointId
app.get('/api/scenarios/:scenarioId/restore/:checkpointId', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const checkpointId = parseInt(req.params.checkpointId);

        const checkpoint = await Checkpoint.findByPk(checkpointId);
        if (!checkpoint || checkpoint.scenarioId !== scenarioId) {
            return res.status(404).json({ message: "Checkpoint ne postoji!" });
        }

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        // Uzmi početno stanje (prve linije kreirane sa POST /api/scenarios)
        const initialLines = await Line.findAll({
            where: { scenarioId: scenarioId },
            order: [['id', 'ASC']],
            limit: 1
        });

        let content = {};
        if (initialLines.length > 0) {
            content[initialLines[0].lineId] = {
                lineId: initialLines[0].lineId,
                text: '',
                nextLineId: null
            };
        }

        // Dohvati sve delte do checkpointa
        const deltas = await Delta.findAll({
            where: {
                scenarioId: scenarioId,
                timestamp: { [require('sequelize').Op.lte]: checkpoint.timestamp }
            },
            order: [['timestamp', 'ASC'], ['id', 'ASC']]
        });

        // Primijeni delte
        for (const delta of deltas) {
            if (delta.type === 'line_update') {
                content[delta.lineId] = {
                    lineId: delta.lineId,
                    text: delta.content,
                    nextLineId: delta.nextLineId
                };
            } else if (delta.type === 'char_rename') {
                const regex = new RegExp(`\\b${delta.oldName}\\b`, 'g');
                for (const key in content) {
                    content[key].text = content[key].text.replace(regex, delta.newName);
                }
            }
        }

        const finalContent = Object.values(content);

        res.status(200).json({
            id: scenario.id,
            title: scenario.title,
            content: finalContent
        });

    } catch (error) {
        console.error('Greška:', error);
        res.status(500).json({ error: 'Greška pri restore checkpointa' });
    }
});

// Pokretanje servera
app.listen(port, () => {
    console.log(`\n Server radi na http://localhost:${port}`);
    console.log(`Otvorite: http://localhost:${port}/html/writing.html`);
    
});
*/
const express = require('express');
const path = require('path');
const { sequelize, Scenario, Line, Delta, Checkpoint } = require('./models');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Globalne varijable za lockove (ostaju u memoriji)
let lineLocks = {};
let userLineLock = {};
let characterLocks = {};
let userCharacterLock = {};

// Ruta za glavnu stranicu
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'writing.html'));
});

// ===== RUTA 1: Kreiranje novog scenarija =====
app.post('/api/scenarios', async (req, res) => {
    try {
        const { title } = req.body;
        const scenarioTitle = title && title.trim() !== '' ? title : 'Neimenovani scenarij';
        
        // Kreiraj scenario u bazi
        const newScenario = await Scenario.create({ title: scenarioTitle });
        
        // Kreiraj početnu liniju
        await Line.create({
            lineId: 1,
            text: '',
            nextLineId: null,
            scenarioId: newScenario.id
        });

        res.status(200).json({
            id: newScenario.id,
            title: newScenario.title,
            content: [
                {
                    lineId: 1,
                    nextLineId: null,
                    text: ''
                }
            ]
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Neuspješno kreiranje scenarija' });
    }
});

// ===== RUTA 2: Zaključavanje linije =====
app.post('/api/scenarios/:scenarioId/lines/:lineId/lock', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const lineId = parseInt(req.params.lineId);
        const userIdStr = String(req.body.userId);

        // Provjeri da li scenario postoji
        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        // Provjeri da li linija postoji
        const line = await Line.findOne({
            where: { scenarioId, lineId }
        });
        
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
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error RUTA 2' });
    }
});
//RUTA 3

app.put('/api/scenarios/:scenarioId/lines/:lineId', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const lineId = parseInt(req.params.lineId);
        const { userId, newText } = req.body;
        const userIdStr = String(userId);

        if (!Array.isArray(newText) || newText.length === 0) {
            return res.status(400).json({ message: "Niz new_text ne smije biti prazan!" });
        }

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        const line = await Line.findOne({
            where: { scenarioId, lineId }
        });

        if (!line) {
            return res.status(404).json({ message: "Linija ne postoji!" });
        }
        
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

        const allLines = await Line.findAll({
            where: { scenarioId },
            order: [['lineId', 'DESC']]
        });

        let maxLineId = allLines.length > 0 ? Math.max(...allLines.map(l => l.lineId)) : 0;
        const originalNextLineId = line.nextLineId;
        const timestamp = Math.floor(Date.now() / 1000);

       
        await line.update({ text: allWrappedLines[0] });

        // 2. Kreiraj nove linije (samo Line objekte, bez delta)
        const newLines = [];
        for (let i = 1; i < allWrappedLines.length; i++) {
            maxLineId++;
            const newLine = await Line.create({
                lineId: maxLineId,
                text: allWrappedLines[i],
                nextLineId: i === allWrappedLines.length - 1 ? originalNextLineId : maxLineId + 1,
                scenarioId
            });
            newLines.push(newLine);
        }

        // 3. Ažuriraj nextLineId prve linije
        let finalNextLineId;
        if (newLines.length > 0) {
            finalNextLineId = newLines[0].lineId;
            await line.update({ nextLineId: finalNextLineId });
        } else {
            finalNextLineId = originalNextLineId;
        }

        // 4. TEK SADA kreiraj delte (identično kao JSON)
        
        // Delta za prvu liniju (sa finalnim nextLineId)
        await Delta.create({
            scenarioId: scenarioId,
            type: "line_update",
            lineId: lineId,
            nextLineId: finalNextLineId,  
            content: allWrappedLines[0],
            timestamp: timestamp
        });

        // Delte za nove linije
        for (const newLine of newLines) {
            await Delta.create({
                scenarioId: scenarioId,
                type: "line_update",
                lineId: newLine.lineId,
                nextLineId: newLine.nextLineId,
                content: newLine.text,
                timestamp: timestamp
            });
        }

        // 5. Otključaj
        delete lineLocks[lockKey];
        if (typeof userLineLock !== 'undefined') {
            delete userLineLock[userIdStr];
        }

        return res.status(200).json({ message: "Linija je uspjesno azurirana!" });
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            message: "Internal server error RUTA 3", 
            error: error.message 
        });
    }
});
// ===== RUTA 4: Zaključavanje imena lika =====
app.post('/api/scenarios/:scenarioId/characters/lock', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const userIdStr = String(req.body.userId);
        const characterName = String(req.body.characterName);
        
        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
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
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error RUTA 4' });
    }
});

// ===== RUTA 5: Promjena imena lika =====
app.post('/api/scenarios/:scenarioId/characters/update', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const { userId, oldName, newName } = req.body;
        const userIdStr = String(userId);

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        const lockKey = `${scenarioId}-${oldName}`;

        if (!characterLocks[lockKey]) {
            return res.status(409).json({ message: "Konflikt! Ime lika nije zakljucano!" });
        }

        if (characterLocks[lockKey] !== userIdStr) {
            return res.status(409).json({ message: "Konflikt! Ime lika je zakljucano od strane drugog korisnika!" });
        }

        // Dohvati sve linije
        const lines = await Line.findAll({
            where: { scenarioId }
        });

        const regex = new RegExp(`\\b${oldName}\\b`, 'g');

        // Ažuriraj sve linije
        for (const line of lines) {
            if (line.text.includes(oldName)) {
                const updatedText = line.text.replace(regex, newName);
                await line.update({ text: updatedText });
            }
        }

        // Sačuvaj delta
        await Delta.create({
            scenarioId,
            type: "char_rename",
            oldName,
            newName,
            timestamp: Math.floor(Date.now() / 1000)
        });

        delete characterLocks[lockKey];
        delete userCharacterLock[userIdStr];

        return res.status(200).json({ message: "Ime lika je uspjesno promijenjeno!" });
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            message: "Internal server error RUTA 5", 
            error: error.message 
        });
    }
});

// ===== RUTA 6: Dohvat delti =====
//mozda ne valja
app.get('/api/scenarios/:scenarioId/deltas', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const since = req.query.since ? parseInt(req.query.since) : 0;

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        const { Op } = require('sequelize');
        const deltas = await Delta.findAll({
            where: {
                scenarioId,
                timestamp: { [Op.gt]: since }
            },
            order: [['timestamp', 'ASC']]
        });

        res.status(200).json({ deltas });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error RUTA 6' });
    }
});

// ===== RUTA 7: Dohvat scenarija =====
app.get('/api/scenarios/:scenarioId', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        const lines = await Line.findAll({
            where: { scenarioId },
            order: [['lineId', 'ASC']]
        });

        const content = lines.map(line => ({
            lineId: line.lineId,
            text: line.text,
            nextLineId: line.nextLineId
        }));

        res.status(200).json({
            id: scenario.id,
            title: scenario.title,
            content
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== NOVE RUTE ZA SPIRALU 4 =====

// POST /api/scenarios/:scenarioId/checkpoint
app.post('/api/scenarios/:scenarioId/checkpoint', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const { userId } = req.body;
        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        await Checkpoint.create({
            scenarioId: scenarioId,
            timestamp: Math.floor(Date.now() / 1000)
        });

        res.status(200).json({ message: "Checkpoint je uspjesno kreiran!" });
    } catch (error) {
        console.error('Greška:', error);
        res.status(500).json({ error: 'Greška pri kreiranju checkpointa' });
    }
});

// GET /api/scenarios/:scenarioId/checkpoints
app.get('/api/scenarios/:scenarioId/checkpoints', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        const checkpoints = await Checkpoint.findAll({
            where: { scenarioId: scenarioId },
            attributes: ['id', 'timestamp'],
            order: [['timestamp', 'ASC']]
        });

        res.status(200).json(checkpoints);
    } catch (error) {
        console.error('Greška:', error);
        res.status(500).json({ error: 'Greška pri dohvatu checkpointa' });
    }
});
/*
// GET /api/scenarios/:scenarioId/restore/:checkpointId
app.get('/api/scenarios/:scenarioId/restore/:checkpointId', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const checkpointId = parseInt(req.params.checkpointId);

        const checkpoint = await Checkpoint.findByPk(checkpointId);
        if (!checkpoint || checkpoint.scenarioId !== scenarioId) {
            return res.status(404).json({ message: "Checkpoint ne postoji!" });
        }

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        // Početno stanje - dohvati početnu liniju (prvu kreiranu)
        const initialLine = await Line.findOne({
            where: { scenarioId, lineId: 1 },
            order: [['id', 'ASC']]
        });

        let content = {};
        if (initialLine) {
            content[1] = {
                lineId: 1,
                text: '',
                nextLineId: null
            };
        }

        // Dohvati delte do checkpointa
        const { Op } = require('sequelize');
        const deltas = await Delta.findAll({
            where: {
                scenarioId,
                timestamp: { [Op.lte]: checkpoint.timestamp }
            },
            order: [['timestamp', 'ASC'], ['id', 'ASC']]
        });

        // Primijeni delte
        for (const delta of deltas) {
            if (delta.type === 'line_update') {
                content[delta.lineId] = {
                    lineId: delta.lineId,
                    text: delta.content,
                    nextLineId: delta.nextLineId
                };
            } else if (delta.type === 'char_rename') {
                const regex = new RegExp(`\\b${delta.oldName}\\b`, 'g');
                for (const key in content) {
                    content[key].text = content[key].text.replace(regex, delta.newName);
                }
            }
        }

        const finalContent = Object.values(content);

        res.status(200).json({
            id: scenario.id,
            title: scenario.title,
            content: finalContent
        });

    } catch (error) {
        console.error('Greška:', error);
        res.status(500).json({ error: 'Greška pri restore checkpointa' });
    }
});
*/
// GET /api/scenarios/:scenarioId/restore/:checkpointId
app.get('/api/scenarios/:scenarioId/restore/:checkpointId', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const checkpointId = parseInt(req.params.checkpointId);

        const checkpoint = await Checkpoint.findByPk(checkpointId);
        if (!checkpoint || checkpoint.scenarioId !== scenarioId) {
            return res.status(404).json({ message: "Checkpoint ne postoji!" });
        }

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "Scenario ne postoji!" });
        }

        // Početno stanje - dohvati SVE početne linije scenarija
        const initialLines = await Line.findAll({
            where: { scenarioId }
        });

        // Inicijaliziraj content sa početnim stanjem
        let content = {};
        for (const line of initialLines) {
            content[line.lineId] = {
                lineId: line.lineId,
                text: line.text,
                nextLineId: line.nextLineId
            };
        }

        // Dohvati delte do checkpointa
        const { Op } = require('sequelize');
        const deltas = await Delta.findAll({
            where: {
                scenarioId,
                timestamp: { [Op.lte]: checkpoint.timestamp }
            },
            order: [['timestamp', 'ASC'], ['id', 'ASC']]
        });

        // Primijeni delte hronološki
        for (const delta of deltas) {
            if (delta.type === 'line_update') {
                content[delta.lineId] = {
                    lineId: delta.lineId,
                    text: delta.content,
                    nextLineId: delta.nextLineId
                };
            } else if (delta.type === 'char_rename') {
                const regex = new RegExp(`\\b${delta.oldName}\\b`, 'g');
                for (const key in content) {
                    content[key].text = content[key].text.replace(regex, delta.newName);
                }
            }
        }

        // Konvertuj u niz
        const finalContent = Object.values(content);

        res.status(200).json({
            id: scenario.id,
            title: scenario.title,
            content: finalContent
        });

    } catch (error) {
        console.error('Greška:', error);
        res.status(500).json({ error: 'Greška pri restore checkpointa' });
    }
});

// Funkcija za inicijalizaciju testnih podataka
async function initializeTestData() {
    try {
        // 1. Kreiraj scenario
        const scenario = await Scenario.create({
            id: 1,
            title: "Potraga za izgubljenim ključem"
        });

        // 2. Kreiraj linije
        const lines = [
            {
                lineId: 1,
                text: "NARATOR: Sunce je polako zalazilo nad starim gradom.",
                nextLineId: 2,
                scenarioId: 1
            },
            {
                lineId: 2,
                text: "ALICE: Jesi li siguran da je ključ ostao u biblioteci?",
                nextLineId: 3,
                scenarioId: 1
            },
            {
                lineId: 3,
                text: "BOB: To je posljednje mjesto gdje sam ga vidio prije nego što je pala noć.",
                nextLineId: 4,
                scenarioId: 1
            },
            {
                lineId: 4,
                text: "ALICE: Moramo požuriti prije nego što čuvar zaključa glavna vrata.",
                nextLineId: 5,
                scenarioId: 1
            },
            {
                lineId: 5,
                text: "BOB: Čekaj, čuješ li taj zvuk iza polica?",
                nextLineId: 6,
                scenarioId: 1
            },
            {
                lineId: 6,
                text: "NARATOR: Iz sjene se polako pojavila nepoznata figura.",
                nextLineId: null,
                scenarioId: 1
            }
        ];

        await Line.bulkCreate(lines);

        // 3. Kreiraj delte
        const deltas = [
            {
                scenarioId: 1,
                type: "line_update",
                lineId: 1,
                nextLineId: 2,
                content: "NARATOR: Sunce je polako zalazilo nad starim gradom.",
                oldName: null,
                newName: null,
                timestamp: 1736520000
            },
            {
                scenarioId: 1,
                type: "line_update",
                lineId: 2,
                nextLineId: 3,
                content: "ALICE: Jesi li siguran da je ključ ostao u biblioteci?",
                oldName: null,
                newName: null,
                timestamp: 1736520010
            },
            {
                scenarioId: 1,
                type: "line_update",
                lineId: 3,
                nextLineId: 4,
                content: "BOB: To je posljednje mjesto gdje sam ga vidio prije nego što je pala noć.",
                oldName: null,
                newName: null,
                timestamp: 1736520020
            },
            {
                scenarioId: 1,
                type: "line_update",
                lineId: 4,
                nextLineId: 5,
                content: "ALICE: Moramo požuriti prije nego što čuvar zaključa glavna vrata.",
                oldName: null,
                newName: null,
                timestamp: 1736520030
            },
            {
                scenarioId: 1,
                type: "line_update",
                lineId: 5,
                nextLineId: 6,
                content: "BOB: Čekaj, čuješ li taj zvuk iza polica?",
                oldName: null,
                newName: null,
                timestamp: 1736520040
            },
            {
                scenarioId: 1,
                type: "line_update",
                lineId: 6,
                nextLineId: null,
                content: "NARATOR: Iz sjene se polako pojavila nepoznata figura.",
                oldName: null,
                newName: null,
                timestamp: 1736520050
            },
            {
                scenarioId: 1,
                type: "char_rename",
                lineId: null,
                nextLineId: null,
                content: null,
                oldName: "BOB",
                newName: "ROBERT",
                timestamp: 1736520100
            }
        ];

        await Delta.bulkCreate(deltas);

        console.log('Testni podaci su uspješno inicijalizirani!');
    } catch (error) {
        console.error('Greška pri inicijalizaciji testnih podataka:', error);
    }
}

async function initializeServer() {
    try {
        await sequelize.sync({ force: true });
        console.log('Baza je uspjesno sinhronizovana');
        await initializeTestData();

        app.listen(port, () => {
            console.log(`\nServer radi na http://localhost:${port}`);
            console.log(` Otvorite: http://localhost:${port}/html/writing.html`);
        });
    } catch (error) {
        console.error('Ne moze se inicijalizirati server ', error);
        process.exit(1);
    }
}

initializeServer(); 