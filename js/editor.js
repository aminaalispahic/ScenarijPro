let divEditor = document.getElementById("divEditor");
let editor = EditorTeksta(divEditor);
let porukeDiv = document.getElementById("poruke");



window.addEventListener('DOMContentLoaded', function() {
    ucitajScenarij(trenutniScenarij);
    
    // Periodično provjeri promjene (svake 5 sekundi)
    setInterval(function() {
        provijeriPromjene();
    }, 5000);
});


function ispisiPoruku(poruka) {
    porukeDiv.innerHTML = poruka;
    porukeDiv.classList.add('aktivan'); 
}


function formatirajRezultat(rezultat) {
    if (Array.isArray(rezultat)) {
        if (rezultat.length === 0) {
            return '<p>Prazan niz</p>';
        }
        return '<pre>' + JSON.stringify(rezultat, null, 2) + '</pre>';
    }
    if (typeof rezultat === 'object') {
        return '<pre>' + JSON.stringify(rezultat, null, 2) + '</pre>';
    }
    return '<p>' + rezultat + '</p>';
}

// Dugme: Bold
document.getElementById('boldiraj').addEventListener('click', function() {
    let rezultat = editor.formatirajTekst("bold");
    if (rezultat) {
        ispisiPoruku('<p style="color: green;">✓ Tekst je boldiran!</p>');
    } else {
        ispisiPoruku('<p style="color: red;">✗ Formatiranje nije uspjelo. Morate selektovati tekst.</p>');
    }
});

// Dugme: Italic
document.getElementById('italik').addEventListener('click', function() {
    let rezultat = editor.formatirajTekst("italic");
    if (rezultat) {
        ispisiPoruku('<p style="color: green;">✓ Dodan italic</p>');
    } else {
        ispisiPoruku('<p style="color: red;">✗ Formatiranje nije uspjelo. Morate selektovati tekst.</p>');
    }
});

// Dugme: Underline
document.getElementById('PODVUCI').addEventListener('click', function() {
    let rezultat = editor.formatirajTekst("underline");
    if (rezultat) {
        ispisiPoruku('<p style="color: green;">✓ Tekst je podvučen!</p>');
    } else {
        ispisiPoruku('<p style="color: red;">✗ Formatiranje nije uspjelo. Morate selektovati tekst.</p>');
    }
});

// Dugme: Broj riječi
document.getElementById('brojrijeci').addEventListener('click', function() {
    let rezultat = editor.dajBrojRijeci();
    ispisiPoruku('<h3>Broj riječi:</h3>' + formatirajRezultat(rezultat));
});

// Dugme: Uloge
document.getElementById('uloge').addEventListener('click', function() {
    let rezultat = editor.dajUloge();
    ispisiPoruku('<h3>Uloge:</h3>' + formatirajRezultat(rezultat));
});

// Dugme: Pogrešne uloge
document.getElementById('pogresneUloge').addEventListener('click', function() {
    let rezultat = editor.pogresnaUloga();
    if (rezultat.length === 0) {
        ispisiPoruku('<h3>Pogrešne uloge:</h3><p>Nema pogrešno napisanih uloga.</p>');
    } else {
        ispisiPoruku('<h3>Pogrešne uloge:</h3>' + formatirajRezultat(rezultat));
    }
});

// Dugme: Broj linija (za određenu ulogu)
document.getElementById('brojLinija').addEventListener('click', function() {
    let uloga = document.getElementById('nadiUloge').value.trim();
    
    if (!uloga) {
        ispisiPoruku('<p style="color: red;"> Morate unijeti ime uloge u polje</p>');
        return;
    }
    
    let rezultat = editor.brojLinijaTeksta(uloga);
    ispisiPoruku('<h3>Broj linija za ulogu "' + uloga.toUpperCase() + '":</h3><p>' + rezultat + '</p>');
});

// Dugme: Scenarij uloge
document.getElementById('scenarij').addEventListener('click', function() {
    let uloga = document.getElementById('nadiUloge').value.trim();
    
    if (!uloga) {
        ispisiPoruku('<p style="color: red;">✗ Morate unijeti ime uloge u polje</p>');
        return;
    }
    
    let rezultat = editor.scenarijUloge(uloga.toUpperCase());
    if (rezultat.length === 0) {
        ispisiPoruku('<h3>Scenarij uloge "' + uloga.toUpperCase() + '":</h3><p>Uloga ne postoji ili nema replika.</p>');
    } else {
        ispisiPoruku('<h3>Scenarij uloge "' + uloga.toUpperCase() + '":</h3>' + formatirajRezultat(rezultat));
    }
});

// Dugme: Grupisi uloge
document.getElementById('grupisanje').addEventListener('click', function() {
    let rezultat = editor.grupisiUloge();
    if (rezultat.length === 0) {
        ispisiPoruku('<h3>Grupisane uloge:</h3><p>Nema dijalog segmenata.</p>');
    } else {
        ispisiPoruku('<h3>Grupisane uloge:</h3>' + formatirajRezultat(rezultat));
    }
});



/////AJAX DIOOOO///////////////////////////////////////////////////////////////////////////////////
// ===== GLOBALNE VARIJABLE =====
let trenutniScenarij = null;
let trenutniKorisnik = null;
let trenutnaLinija = null;
let lastTimestamp = Math.floor(Date.now() / 1000);

// ===== INICIJALIZACIJA =====
window.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    
    // Periodično provjeri promjene (svake 5 sekundi)
    setInterval(function() {
        if (trenutniScenarij) {
            provijeriPromjene();
        }
    }, 5000);
});

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    
    document.getElementById('createScenarioBtn').addEventListener('click', function() {
        const title = document.getElementById('scenarioTitle').value.trim();
        kreirajScenarij(title);
    });

   
    document.getElementById('loadScenarioBtn').addEventListener('click', function() {
        const scenarioId = document.getElementById('scenarioId').value;
        if (scenarioId) {
            ucitajScenarij(scenarioId);
        } else {
            prikaziStatus('Molimo unesite ID scenarija', 'error');
        }
    });

   
    document.getElementById('lockLineBtn').addEventListener('click', function() {
        const userId = document.getElementById('userId').value;
        const scenarioId = document.getElementById('scenarioId').value;
        const lineId = document.getElementById('lineId').value;
        
        if (!userId || !scenarioId || !lineId) {
            prikaziStatus('Molimo unesite User ID, Scenario ID i Line ID', 'error');
            return;
        }
        
        zakljucajLiniju(scenarioId, lineId, userId);
    });

    
    document.getElementById('updateLineBtn').addEventListener('click', function() {
        const userId = document.getElementById('userId').value;
        const scenarioId = document.getElementById('scenarioId').value;
        const lineId = document.getElementById('updateLineId').value;
        const newText = document.getElementById('newLineText').value;
        
        if (!userId || !scenarioId || !lineId || !newText) {
            prikaziStatus('Molimo popunite sva polja', 'error');
            return;
        }
        
        azurirajLiniju(scenarioId, lineId, userId, [newText]);
    });

    // Zaključavanje imena lika
    document.getElementById('lockCharacterBtn').addEventListener('click', function() {
        const userId = document.getElementById('userId').value;
        const scenarioId = document.getElementById('scenarioId').value;
        const characterName = document.getElementById('lockCharacterName').value.trim();
        
        if (!userId || !scenarioId || !characterName) {
            prikaziStatus('Molimo unesite User ID, Scenario ID i ime lika', 'error');
            return;
        }
        
        zakljucajKarakter(scenarioId, userId, characterName);
    });

    document.getElementById('changeCharacterNameBtn').addEventListener('click', function() {
        const userId = document.getElementById('userId').value;
        const scenarioId = document.getElementById('scenarioId').value;
        const oldName = document.getElementById('oldCharacterName').value.trim();
        const newName = document.getElementById('newCharacterName').value.trim();
        
        if (!userId || !scenarioId || !oldName || !newName) {
            prikaziStatus('Molimo popunite sva polja', 'error');
            return;
        }
        
        promijeniImeKaraktera(scenarioId, userId, oldName, newName);
    });

    
document.getElementById('showDeltasBtn').addEventListener('click', async () => {
    const scenarioId = document.getElementById('scenarioId').value;
    const since = document.getElementById('deltasInput').value || 0; 
    
    if (!scenarioId) {
        showStatus('Unesite Scenario ID!', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/scenarios/${scenarioId}/deltas?since=${since}`);
        const data = await response.json();
        
        const container = document.getElementById('deltasContainer'); 
        
        if (!data.deltas || data.deltas.length === 0) {
            container.innerHTML = '<div class="no-changes">Nema novih promjena</div>';
            container.style.display = 'block'; 
            return;
        }

        let html = '<h3>Delta Promjene</h3><div class="deltas-list">';
        
        data.deltas.forEach(delta => {
            const timestamp = new Date(delta.timestamp * 1000).toLocaleString('hr-HR');
            
            if (delta.type === 'line_update') {
                html += `
                    <div class="delta-item line-update">
                        <div class="delta-header">
                            <span class="delta-type">Ažuriranje Linije</span>
                            <span class="delta-time">${timestamp}</span>
                        </div>
                        <div class="delta-content">
                            <p><strong>Line ID:</strong> ${delta.lineId}</p>
                            <p><strong>Next Line ID:</strong> ${delta.nextLineId || 'null'}</p>
                            <p><strong>Sadržaj:</strong> ${delta.content || '<em>(prazan)</em>'}</p>
                        </div>
                    </div>
                `;
            } else if (delta.type === 'char_rename') {
                html += `
                    <div class="delta-item char-rename">
                        <div class="delta-header">
                            <span class="delta-type">Promjena Imena Lika</span>
                            <span class="delta-time">${timestamp}</span>
                        </div>
                        <div class="delta-content">
                            <p><strong>Staro Ime:</strong> ${delta.oldName}</p>
                            <p><strong>Novo Ime:</strong> ${delta.newName}</p>
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        container.innerHTML = html;
        container.style.display = 'block'; 
        
        showStatus(`Učitano ${data.deltas.length} promjena`, 'success');
        
    } catch (error) {
        console.error('Greška:', error);
        showStatus('Greška pri učitavanju delta promijena', 'error');
    }
});

    
    document.getElementById('showDeltasBtn').addEventListener('click', function() {
        const scenarioId = document.getElementById('scenarioId').value;
        
        if (!scenarioId) {
            prikaziStatus('Molimo unesite Scenario ID', 'error');
            return;
        }
        
        
        PoziviAjax.dajPromjene(scenarioId, 0, function(status, data) {
            if (status !== 200) {
                prikaziStatus('Greška: ' + (data.error || data.message), 'error');
                return;
            }
            
            prikaziDeltas(data.deltas);
            prikaziStatus('Prikazano ' + (data.deltas ? data.deltas.length : 0) + ' promjena', 'success');
        });
    });

    
document.getElementById('showScenarioDetailsBtn').addEventListener('click', async () => {
    const scenarioId = document.getElementById('scenarioDetailsInput').value; 
    
    if (!scenarioId) {
        showStatus('Unesite Scenario ID za detalje!', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/scenarios/${scenarioId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showStatus('Scenario ne postoji!', 'error');
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const scenario = await response.json();
        const container = document.getElementById('scenarioDetailsContainer'); 
        
        // Generisanje HTML-a za prikaz
        let html = `
            <div class="scenario-info">
                <h3>Detalji Scenarija</h3>
                <div class="info-item">
                    <strong>ID:</strong> ${scenario.id}
                </div>
                <div class="info-item">
                    <strong>Naslov:</strong> ${scenario.title}
                </div>
                <div class="info-item">
                    <strong>Broj linija:</strong> ${scenario.content.length}
                </div>
            </div>
            
            <div class="scenario-content">
                <h4>Sadržaj (Linije)</h4>
                <div class="lines-list">
        `;
        
        if (scenario.content && scenario.content.length > 0) {
            scenario.content.forEach(line => {
                html += `
                    <div class="line-item">
                        <div class="line-header">
                            <span class="line-id">Line ID: ${line.lineId}</span>
                            <span class="next-line">Next: ${line.nextLineId || 'null'}</span>
                        </div>
                        <div class="line-text">
                            ${line.text || '<em>(prazna linija)</em>'}
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<div class="no-lines">Nema linija u scenariju</div>';
        }
        
        html += '</div></div>';
        
        container.innerHTML = html;
        container.style.display = 'block'; // Eksplicitno prikaži
        
        showStatus('Detalji scenarija uspješno učitani', 'success');
        
    } catch (error) {
        console.error('Greška pri učitavanju detalja:', error);
        showStatus('Greška pri učitavanju detalja scenarija', 'error');
        
        const container = document.getElementById('scenarioDetailsContainer');
        container.innerHTML = '<div class="no-data">Greška pri učitavanju podataka</div>';
        container.style.display = 'block';
    }
});
}

// ===== FUNKCIJE ZA POZIVE BACKENDA =====

function kreirajScenarij(title) {
    PoziviAjax.dodajScenario(title, function(status, data) {
        if (status !== 200) {
            prikaziStatus('Greška pri kreiranju scenarija: ' + (data.error || data.message), 'error');
            return;
        }
        
        trenutniScenarij = data.id;
        document.getElementById('scenarioId').value = data.id;
        prikaziStatus('Scenarij uspješno kreiran! ID: ' + data.id, 'success');
        ucitajScenarij(data.id);
    });
}

function ucitajScenarij(scenarioId) {
    if (!scenarioId) return;
    
    PoziviAjax.dajScenarije(scenarioId, function(status, data) {
        if (status !== 200) {
            prikaziStatus('Greška pri učitavanju scenarija: ' + (data.error || data.message), 'error');
            return;
        }
        
        trenutniScenarij = scenarioId;
        prikazScenarijaUEditoru(data);
        prikaziStatus('Scenarij uspješno učitan!', 'success');
    });
}

function zakljucajLiniju(scenarioId, lineId, userId) {
    PoziviAjax.zakljucajLiniju(scenarioId, lineId, userId, function(status, data) {
        if (status !== 200) {
            prikaziStatus('Greška: ' + data.message, 'error');
            return;
        }
        
        trenutnaLinija = lineId;
        trenutniKorisnik = userId;
        prikaziStatus(data.message, 'success');
    });
}

function azurirajLiniju(scenarioId, lineId, userId, newText) {
    PoziviAjax.azurirajLiniju(scenarioId, lineId, userId, newText, function(status, data) {
        if (status !== 200) {
            prikaziStatus('Greška: ' + data.message, 'error');
            return;
        }
        
        prikaziStatus(data.message, 'success');
        ucitajScenarij(scenarioId);
        document.getElementById('newLineText').value = '';
    });
}

function zakljucajKarakter(scenarioId, userId, karakterIme) {
    PoziviAjax.zakljucajKarakter(scenarioId, userId, karakterIme, function(status, data) {
        if (status !== 200) {
            prikaziStatus('Greška: ' + data.message, 'error');
            return;
        }
        
        prikaziStatus(data.message, 'success');
    });
}

function promijeniImeKaraktera(scenarioId, userId, staro, novo) {
    PoziviAjax.promijeniUlogu(scenarioId, userId, staro, novo, function(status, data) {
        if (status !== 200) {
            prikaziStatus('Greška: ' + data.message, 'error');
            return;
        }
        
        prikaziStatus(data.message, 'success');
        ucitajScenarij(scenarioId);
    });
}

function ucitajPromjene(scenarioId, since) {
    PoziviAjax.dajPromjene(scenarioId, since, function(status, data) {
        if (status !== 200) {
            prikaziStatus('Greška: ' + (data.error || data.message), 'error');
            return;
        }
        
        if (data.deltas && data.deltas.length > 0) {
            prikaziStatus('Učitano ' + data.deltas.length + ' promjena', 'success');
            console.log('Promjene:', data.deltas);
            primijeniPromjene(data.deltas);
            
            lastTimestamp = data.deltas[data.deltas.length - 1].timestamp;
        } else {
            console.log('Nema novih promjena');
        }
    });
}

function provijeriPromjene() {
    if (!trenutniScenarij) return;
    ucitajPromjene(trenutniScenarij, lastTimestamp);
}

// ===== POMOĆNE FUNKCIJE =====

function prikaziStatus(poruka, tip) {
    const statusDiv = document.getElementById('statusMessage');
    if (!statusDiv) return;
    
    statusDiv.textContent = poruka;
    statusDiv.className = 'status-message ' + tip;
    statusDiv.style.display = 'block';
    
    setTimeout(function() {
        statusDiv.style.display = 'none';
    }, 5000);
}

function prikazScenarijaUEditoru(scenario) {
    if (!scenario || !scenario.content) return;
    
    const editor = document.getElementById('divEditor');
    let html = '<h1 class="naslovScenarija">' + scenario.title + '</h1>';
    html += '<p class="tekstScenarija">';
    
    scenario.content.forEach(function(line) {
        if (line.character) {
            html += '<br>' + line.character + '<br>';
        }
        html += line.text + '<br>';
    });
    
    html += '</p>';
    editor.innerHTML = html;
}

function primijeniPromjene(deltas) {
    deltas.forEach(function(delta) {
        if (delta.type === 'line_update') {
            console.log('Ažurirana linija:', delta.lineId);
        } else if (delta.type === 'char_rename') {
            console.log('Promijenjeno ime lika:', delta.oldName, '->', delta.newName);
        }
    });
    
    if (trenutniScenarij) {
        ucitajScenarij(trenutniScenarij);
    }
}
function prikaziDeltas(deltas) {
    const deltasContainer = document.getElementById('deltasDisplay');
    if (!deltasContainer) {
        console.log('Nema elementa za prikaz deltas');
        return;
    }
    
    if (!deltas || deltas.length === 0) {
        deltasContainer.innerHTML = '<p class="no-changes">Nema promjena</p>';
        return;
    }
    
    let html = '<h3>Promjene (Deltas)</h3><div class="deltas-list">';
    
    deltas.forEach(function(delta) {
        const datum = new Date(delta.timestamp * 1000).toLocaleString('bs-BA');
        
        if (delta.type === 'line_update') {
            html += `
                <div class="delta-item line-update">
                    <div class="delta-header">
                        <span class="delta-type">Ažuriranje linije</span>
                        <span class="delta-time">${datum}</span>
                    </div>
                    <div class="delta-content">
                        <p><strong>Linija ID:</strong> ${delta.lineId}</p>
                        <p><strong>Sljedeća linija:</strong> ${delta.nextLineId || 'null'}</p>
                        <p><strong>Sadržaj:</strong> "${delta.content}"</p>
                    </div>
                </div>
            `;
        } else if (delta.type === 'char_rename') {
            html += `
                <div class="delta-item char-rename">
                    <div class="delta-header">
                        <span class="delta-type">Promjena imena lika</span>
                        <span class="delta-time">${datum}</span>
                    </div>
                    <div class="delta-content">
                        <p><strong>Staro ime:</strong> ${delta.oldName}</p>
                        <p><strong>Novo ime:</strong> ${delta.newName}</p>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    deltasContainer.innerHTML = html;
}

function prikaziDetaljeScenaria(scenario) {
    const detailsContainer = document.getElementById('scenarioDetails');
    if (!detailsContainer) {
        console.log('Nema elementa za prikaz detalja scenarija');
        return;
    }
    
    if (!scenario) {
        detailsContainer.innerHTML = '<p class="no-data">Nema podataka o scenariju</p>';
        return;
    }
    
    let html = `
        <div class="scenario-info">
            <h3>Detalji scenarija</h3>
            <div class="info-item">
                <strong>ID:</strong> ${scenario.id}
            </div>
            <div class="info-item">
                <strong>Naslov:</strong> ${scenario.title}
            </div>
            <div class="info-item">
                <strong>Broj linija:</strong> ${scenario.content ? scenario.content.length : 0}
            </div>
        </div>
        
        <div class="scenario-content">
            <h4>Sadržaj scenarija</h4>
            <div class="lines-list">
    `;
    
    if (scenario.content && scenario.content.length > 0) {
        scenario.content.forEach(function(line) {
            html += `
                <div class="line-item">
                    <div class="line-header">
                        <span class="line-id">Linija ${line.lineId}</span>
                        <span class="next-line">→ ${line.nextLineId || 'kraj'}</span>
                    </div>
                    <div class="line-text">${line.text || '<em>(prazno)</em>'}</div>
                </div>
            `;
        });
    } else {
        html += '<p class="no-lines">Nema linija</p>';
    }
    
    html += `</div></div>`;
    
    detailsContainer.innerHTML = html;
}
