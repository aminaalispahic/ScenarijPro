let EditorTeksta = function (divRef) {
   
  if (!divRef || divRef.tagName !== 'DIV') {
        throw new Error("Pogresan tip elementa!");
    }
    
    if (divRef.getAttribute('contenteditable') !== 'true') {
        throw new Error("Neispravan DIV, ne posjeduje contenteditable atribut!");
    }

 let editor = divRef;
 
   let izvuciRijeci = function(tekst) {
        
        let regex = /[a-zA-ZčćžšđČĆŽŠĐ]+(?:['-][a-zA-ZčćžšđČĆŽŠĐ]+)*/g;
        let pronadjeneRijeci = tekst.match(regex);
        
        return pronadjeneRijeci || [];
    };
  /*  
   
    
    let jeItalic = function(element) {
        if (!element || element === editor) return false;
        
        // Provjeri HTML tag
        let tagName = element.tagName;
        if (tagName === 'I' || tagName === 'EM') return true;
        
        // Provjeri CSS
        let style = window.getComputedStyle(element);
        if (style.fontStyle === 'italic') return true;
        
        
        return jeItalic(element.parentElement);
    };
    
    // Pomoćna funkcija - izvlači tekst iz elementa i vraća formatiranje
    let analizirajElement = function(elem, rezultat) {
        if (elem.nodeType === 3) {
            // Tekst node - izvuci rijeci
            let tekst = elem.textContent;
            if (!tekst || tekst.trim() === '') return;
            
      
            let rijeci = izvuciRijeci(tekst);  
            
            let roditelj = elem.parentElement;
            
            let bold = jeBold(roditelj);
            let italic = jeItalic(roditelj);
            
            for (let i = 0; i < rijeci.length; i++) {
                rezultat.ukupno++;
                if (bold) rezultat.boldiranih++;
                if (italic) rezultat.italic++;
            }
        } else if (elem.nodeType === 1) {
            let djeca = elem.childNodes;
            for (let i = 0; i < djeca.length; i++) {
                analizirajElement(djeca[i], rezultat);
            }
        }
    };
    
    // Javna metoda - dajBrojRijeci
    let dajBrojRijeci = function() {
        let rezultat = {
            ukupno: 0,
            boldiranih: 0,
            italic: 0
        };
        
        // Analiziraj sve child node-ove editora
        let djeca = editor.childNodes;
        for (let i = 0; i < djeca.length; i++) {
            analizirajElement(djeca[i], rezultat);
        }
        
        return rezultat;
    };

*/
let izvuciRijeciSaPozicijama = function(tekst) {
        let regex = /[a-zA-ZčćžšđČĆŽŠĐ]+(?:['-][a-zA-ZčćžšđČĆŽŠĐ]+)*/g;
        let rijeci = [];
        let match;
        
        while ((match = regex.exec(tekst)) !== null) {
            rijeci.push({
                tekst: match[0],
                start: match.index,
                end: match.index + match[0].length
            });
        }
        
        return rijeci;
    };
    
   
    let jeBold = function(element) {
        if (!element || element === editor) return false;
        
       
        let tagName = element.tagName;
        if (tagName === 'B' || tagName === 'STRONG') return true;
        
        
        let style = window.getComputedStyle(element);
        if (parseInt(style.fontWeight) >= 700) return true;
        
        
        return jeBold(element.parentElement);
    };
    
    
   let jeItalic = function(element) {
        if (!element || element === editor) return false;
        
       
        let tagName = element.tagName;
        if (tagName === 'I' || tagName === 'EM') return true;
        
       
        let style = window.getComputedStyle(element);
        if (style.fontStyle === 'italic') return true;
        
        
        return jeItalic(element.parentElement);
    };
    
   
    let sakupiTextNodeove = function(elem, nodeovi) {
        if (elem.nodeType === 3) {
            
            let tekst = elem.textContent;
            if (tekst && tekst !== '') {
                nodeovi.push({
                    node: elem,
                    tekst: tekst,
                    roditelj: elem.parentElement
                });
            }
        } else if (elem.nodeType === 1) {
           
            let djeca = elem.childNodes;
            for (let i = 0; i < djeca.length; i++) {
                sakupiTextNodeove(djeca[i], nodeovi);
            }
        }
    };
    
    
    let dajBrojRijeci = function() {
        let rezultat = {
            ukupno: 0,
            boldiranih: 0,
            italic: 0
        };
        
        
        let sviNodeovi = [];
        let djeca = editor.childNodes;
        for (let i = 0; i < djeca.length; i++) {
            sakupiTextNodeove(djeca[i], sviNodeovi);
        }
        
        
        let puniTekst = '';
        let mapa = [];
        
        for (let i = 0; i < sviNodeovi.length; i++) {
            let node = sviNodeovi[i];
            let start = puniTekst.length;
            puniTekst += node.tekst;
            let end = puniTekst.length;
            
            mapa.push({
                start: start,
                end: end,
                node: node.node,
                roditelj: node.roditelj
            });
        }
        
    
        let rijeci = izvuciRijeciSaPozicijama(puniTekst);
        
        
        for (let i = 0; i < rijeci.length; i++) {
            let rijec = rijeci[i];
            
            
            let nodeovi = [];
            for (let j = 0; j < mapa.length; j++) {
                let mapNode = mapa[j];
                
                
                if (rijec.start < mapNode.end && rijec.end > mapNode.start) {
                    nodeovi.push(mapNode);
                }
            }
            
           
            let sviBold = true;
            let sviItalic = true;
            
            for (let j = 0; j < nodeovi.length; j++) {
                let node = nodeovi[j];
                if (!jeBold(node.roditelj)) sviBold = false;
                if (!jeItalic(node.roditelj)) sviItalic = false;
            }
            
           
            rezultat.ukupno++;
            
            
            if (sviBold && nodeovi.length > 0) rezultat.boldiranih++;
            if (sviItalic && nodeovi.length > 0) rezultat.italic++;
        }
        
        return rezultat;
    };

let jeNaslovScene = function(linija) {
    let trimmed = linija.trim();
    if (!/^[A-ZČĆŽŠĐ\s\.,-]+$/.test(trimmed)) return false;
    
   
    if (!trimmed.startsWith('INT.') && !trimmed.startsWith('EXT.')) return false;
    
    
    if (!trimmed.includes('-')) return false;
    
    
    let poslijeCrtice = trimmed.split('-').slice(1).join('-').trim().split(/\s+/)[0];
    return ['DAY', 'NIGHT', 'AFTERNOON', 'MORNING', 'EVENING'].includes(poslijeCrtice);
};

let jeLinijaUSamoZagradama = function(linija) {
    let trimmed = linija.trim();
    return /^\(.*\)$/.test(trimmed);
};

let jeGovor = function(linija) {
    let trimmed = linija.trim();
    
    // Govor ne smije biti prazan
    if (trimmed === '') return false;
    
    // Govor ne smije biti linija samo u zagradama
    if (jeLinijaUSamoZagradama(trimmed)) return false;
    
    // Govor ne smije biti naslov scene
    if (jeNaslovScene(trimmed)) return false;
    
   
    if (/^[A-ZČĆŽŠĐ\s]+$/.test(trimmed) && /[A-ZČĆŽŠĐ]/.test(trimmed)) {
        return false;
    }
    
    return true;
};

let jeUloga = function(linija, sljedecaLinija) {
    let trimmed = linija.trim();
    
   
    if (trimmed === '') return false;
    
    
    if (jeNaslovScene(trimmed)) return false;
    
   
    if (!/^[A-ZČĆŽŠĐ\s]+$/.test(trimmed)) return false;
    
    
    if (!/[A-ZČĆŽŠĐ]/.test(trimmed)) return false;
    
    
    if (!sljedecaLinija) return false;
    
    return true; 
};

let dajUloge = function() {
    let uloge = [];
    let vidjeneUloge = {};
    
    let tekst = editor.innerText || editor.textContent || '';
    let linije = tekst.split('\n');
    
    for (let i = 0; i < linije.length; i++) {
        let trenutnaLinija = linije[i];
        
        
        if (jeUloga(trenutnaLinija, linije[i + 1])) {
            
            let imaGovor = false;
            
            for (let j = i + 1; j < linije.length; j++) {
                let sljedecaLinija = linije[j];
                
                
                if (sljedecaLinija.trim() === '' || jeLinijaUSamoZagradama(sljedecaLinija)) {
                    continue;
                }
                
                
                if (jeNaslovScene(sljedecaLinija)) {
                    break;
                }
                
                
                let sljedecaTrimmed = sljedecaLinija.trim();
                if (/^[A-ZČĆŽŠĐ\s]+$/.test(sljedecaTrimmed) && /[A-ZČĆŽŠĐ]/.test(sljedecaTrimmed)) {
                    break; 
                }
                
                
                if (jeGovor(sljedecaLinija)) {
                    imaGovor = true;
                    break;
                }
                
                
                break;
            }
            
            
            if (imaGovor) {
                let imeUloge = trenutnaLinija.trim().toUpperCase();
                
                if (!vidjeneUloge[imeUloge]) {
                    uloge.push(imeUloge);
                    vidjeneUloge[imeUloge] = true;
                }
            }
        }
    }
    
    return uloge;
};



let pogresnaUloga = function() {
    
    let tekst = editor.innerText || editor.textContent || '';
    let linije = tekst.split('\n');
    
    let ulogeMap = {}; 
    
    
    for (let i = 0; i < linije.length; i++) {
        let trenutnaLinija = linije[i];
        
        if (jeUloga(trenutnaLinija,linije[i + 1])) {
            
            let imaGovor = false;
            
            for (let j = i + 1; j < linije.length; j++) {
                let sljedecaLinija = linije[j];
                let trimmedSljedeca = sljedecaLinija.trim();
                
               
                if (trimmedSljedeca === '' || jeLinijaUSamoZagradama(sljedecaLinija)) {
                    continue;
                }
                
               
                if (jeGovor(sljedecaLinija)) {
                    imaGovor = true;
                    break;
                }
                
                
                if (jeUloga(sljedecaLinija,linije[i + 1]) || jeNaslovScene(sljedecaLinija)) {
                    break;
                }
                
               
                
                break;
            }
            
            if (imaGovor) {
                let imeUloge = trenutnaLinija.trim();
                
                if (ulogeMap[imeUloge]) {
                    ulogeMap[imeUloge]++;
                } else {
                    ulogeMap[imeUloge] = 1;
                }
            }
        }
    }
    
    
    let uloge = Object.keys(ulogeMap);
    
    
    let pogresne = [];
    
    for (let i = 0; i < uloge.length; i++) {
        let ulogaA = uloge[i];
        let brojA = ulogeMap[ulogaA];
        
    
        for (let j = 0; j < uloge.length; j++) {
            if (i === j) continue;
            
            let ulogaB = uloge[j];
            let brojB = ulogeMap[ulogaB];
            
         
            if (suVrloSlicne(ulogaA, ulogaB)) {
                if (brojB >= 4 && (brojB - brojA) >= 3) {
                    if (pogresne.indexOf(ulogaA) === -1) {
                        pogresne.push(ulogaA);
                    }
                    break;
                }
            }
        }
    }
    
    return pogresne;
};


let suVrloSlicne = function(uloga1, uloga2) {
    let duzina1 = uloga1.length;
    let duzina2 = uloga2.length;
    
    
    let maxRazlika;
    
    if (duzina1 > 5 && duzina2 > 5) {
        maxRazlika = 2;
    } else {
        maxRazlika = 1;
    }
    
    
    let distance = levenshteinDistance(uloga1, uloga2);
    
    return distance <= maxRazlika;
};


let levenshteinDistance = function(str1, str2) {
    let m = str1.length;
    let n = str2.length;
    
    let dp = [];
    for (let i = 0; i <= m; i++) {
        dp[i] = [];
        for (let j = 0; j <= n; j++) {
            dp[i][j] = 0;
        }
    }
    
    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1]
                );
            }
        }
    }
    
    return dp[m][n];
};

  let brojLinijaTeksta = function(uloga) {
    if (!uloga || typeof uloga !== 'string') {
        return 0;
    }
    
   
    let trazenaUloga = uloga.trim().toUpperCase();
    
    let tekst = divRef.innerText || divRef.textContent || '';
    let linije = tekst.split('\n');
    
    let ukupnoLinija = 0;
    let trenutnaUloga = null;
    let uBlokuGovora = false;
    
    for (let i = 0; i < linije.length; i++) {
        let linija = linije[i];
        let trimmed = linija.trim();
        
       
        if (i < linije.length - 1 && jeUloga(linija, linije[i + 1])) {
            trenutnaUloga = trimmed; 
            uBlokuGovora = true;
        }
       
        else if (trimmed === '') {
            trenutnaUloga = null;
            uBlokuGovora = false;
        }
       
        else if (jeNaslovScene(linija)) {
            trenutnaUloga = null;
            uBlokuGovora = false;
        }
        
        else if (jeLinijaUSamoZagradama(linija)) {
            if (!uBlokuGovora) {
                trenutnaUloga = null;
            }
        }
        
        else if (uBlokuGovora && trenutnaUloga !== null && jeGovor(linija)) {
          
            if (trenutnaUloga === trazenaUloga) {
                ukupnoLinija++;
            }
        }
        
        else {
            trenutnaUloga = null;
            uBlokuGovora = false;
        }
    }
    
    return ukupnoLinija;
};

function jeLinijUZagradama(linija) {
    let trimmed = linija.trim();
    
   
    if (trimmed.length === 0) return false;
    
    
    if (trimmed[0] !== '(' || trimmed[trimmed.length - 1] !== ')') {
        return false;
    }
    
    
    let otvorenih = 0;
    
    for (let i = 0; i < trimmed.length; i++) {
        if (trimmed[i] === '(') {
            otvorenih++;
        } else if (trimmed[i] === ')') {
            otvorenih--;
            
            if (otvorenih === 0 && i < trimmed.length - 1) {
                return false;
            }
        }
    }
    
    
    return otvorenih === 0 && trimmed[0] === '(' && trimmed[trimmed.length - 1] === ')';
}
/*
let scenarijUloge = function(uloga) {
    if (!uloga || typeof uloga !== 'string') {
        return [];
    }
    
    // Normalizuj ulogu na velika slova za poređenje
    let trazenaUloga = uloga.trim().toUpperCase();
    
    let tekst = editor.innerText || editor.textContent || '';
    let linije = tekst.split('\n');
    
    let rezultat = [];
    let trenutnaScena = ""; // Naslov trenutne scene
    let replike = []; // Niz replika u trenutnom dijalog-segmentu
    
    let i = 0;
    while (i < linije.length) {
        let linija = linije[i];
        let trimmed = linija.trim();
        
        // 1. Provjeri da li je ovo naslov scene
        if (jeNaslovScene(linija)) {
            // Obradi sakupljene replike prije nove scene
            obradiReplike(replike, trazenaUloga, trenutnaScena, rezultat);
            replike = [];
            
            trenutnaScena = trimmed;
            i++;
            continue;
        }
        
        // 2. Provjeri da li je ovo uloga sa validnim govorom
        if (jeUloga(linija,linije[i + 1]) && i < linije.length - 1 && jeGovor(linije[i + 1])) {
            let imeUloge = trimmed;
            let linijeGovora = [];
            i++; // Pređi na prvu liniju govora
            
            // Sakupi sve linije govora za ovaj blok
            while (i < linije.length) {
                let trenutnaLinija = linije[i];
                let trenutnaTrimmed = trenutnaLinija.trim();
                
                // Prekini blok ako:
                if (trenutnaTrimmed === '') {
                    // Prazna linija - prekida blok govora
                    i++; // Pređi preko prazne linije
                    break;
                } else if (jeNaslovScene(trenutnaLinija)) {
                    // Naslov scene - ne pomjeraj i, obradiće se u sljedećoj iteraciji
                    break;
                } else if (jeUloga(trenutnaLinija,linije[i + 1])) {
                    // Nova uloga - ne pomjeraj i
                    break;
                } else if (jeLinijaUSamoZagradama(trenutnaLinija)) {
                    // Linija u zagradama - preskočimo ali ne prekidamo blok
                    i++;
                    continue;
                } else if (jeGovor(trenutnaLinija)) {
                    // Linija govora - dodaj je
                    linijeGovora.push(trenutnaLinija);
                    i++;
                } else {
                    // Akcijski segment - ne pomjeraj i, ali prekini blok
                    break;
                }
            }
            
            // Dodaj repliku u niz
            if (linijeGovora.length > 0) {
                replike.push({
                    uloga: imeUloge,
                    linije: linijeGovora
                });
            }
            
            continue;
        }
        
        // 3. Provjeri da li je prazna linija
        if (trimmed === '') {
            // Prazna linija sama po sebi NE prekida dijalog-segment
            // Mora biti praćena akcijskim segmentom ili naslovom scene
            i++;
            continue;
        }
        
        // 4. Provjeri da li je linija u zagradama
        if (jeLinijaUSamoZagradama(linija)) {
            // Ne prekida dijalog-segment
            i++;
            continue;
        }
        
        // 5. Sve ostalo je akcijski segment
        // Akcijski segment PREKIDA dijalog-segment
        obradiReplike(replike, trazenaUloga, trenutnaScena, rezultat);
        replike = [];
        
        // Preskači sve uzastopne linije akcijskog segmenta
        while (i < linije.length) {
            let segmentLinija = linije[i];
            let segmentTrimmed = segmentLinija.trim();
            
            if (segmentTrimmed === '') {
                i++;
                continue;
            }
            if (jeNaslovScene(segmentLinija)) {
                break; // Ne pomjeraj i
            }
            if (jeUloga(segmentLinija,linije[i + 1])) {
                break; // Ne pomjeraj i
            }
            if (jeLinijaUSamoZagradama(segmentLinija)) {
                i++;
                continue;
            }
            
            // Dio akcijskog segmenta
            i++;
        }
    }
    
    // Obradi preostale replike na kraju
    obradiReplike(replike, trazenaUloga, trenutnaScena, rezultat);
    
    return rezultat;
};


// Pomoćna funkcija - obrađuje dijalog-segment
let obradiReplike = function(replike, trazenaUloga, scena, rezultat) {
    if (replike.length === 0) return;
    
    // Pronađi sve replike tražene uloge u ovom dijalog-segmentu
    for (let i = 0; i < replike.length; i++) {
        let replika = replike[i];
        
        if (replika.uloga.toUpperCase() === trazenaUloga) {
            let stavka = {
                scena: scena,
                pozicijaUTekstu: i + 1, // Indeksacija od 1
                prethodni: null,
                trenutni: {
                    uloga: replika.uloga,
                    linije: replika.linije
                },
                sljedeci: null
            };
            
            // Dodaj prethodnu repliku ako postoji
            if (i > 0) {
                stavka.prethodni = {
                    uloga: replike[i - 1].uloga,
                    linije: replike[i - 1].linije
                };
            }
            
            // Dodaj sljedeću repliku ako postoji
            if (i < replike.length - 1) {
                stavka.sljedeci = {
                    uloga: replike[i + 1].uloga,
                    linije: replike[i + 1].linije
                };
            }
            
            rezultat.push(stavka);
        }
    }
};
*/
 let scenarijUloge = function(uloga) {
        if (!uloga || typeof uloga !== 'string') {
            return [];
        }
        
        let trazenaUloga = uloga.trim().toUpperCase();
        
   
        let tekst = divRef.innerText || divRef.textContent || '';
        let linije = tekst.split('\n');
        
        let rezultat = [];
        let trenutnaScena = "";
        let replike = [];
        let brojacReplikaUSceni = 0; 
        
        let i = 0;
        while (i < linije.length) {
            let linija = linije[i];
            let trimmed = linija.trim();
            
            // 1. Provjeri da li je ovo naslov scene
            if (jeNaslovScene(linija)) {
                obradiReplike(replike, trazenaUloga, trenutnaScena, rezultat);
                replike = [];
                
                trenutnaScena = trimmed;
                brojacReplikaUSceni = 0; 
                i++;
                continue;
            }
            
           
            if (jeUloga(linija, linije[i + 1]) && i < linije.length - 1) {
                let imeUloge = trimmed;
                let linijeGovora = [];
                i++; 
                
                
                while (i < linije.length) {
                    let trenutnaLinija = linije[i];
                    let trenutnaTrimmed = trenutnaLinija.trim();
                    
                
                    if (trenutnaTrimmed === '') {
                        
                        i++; 
                        break;
                    } else if (jeNaslovScene(trenutnaLinija)) {
                        
                        break;
                    } else if (jeUloga(trenutnaLinija, linije[i + 1])) {
                       
                        let novaUloga = trenutnaTrimmed;
                        if (novaUloga !== imeUloge) {
                            
                            break;
                        }
                        
                        i++; 
                        continue;
                    } else if (jeLinijaUSamoZagradama(trenutnaLinija)) {
                        
                        i++;
                        continue;
                    } else if (jeGovor(trenutnaLinija)) {
                       
                        linijeGovora.push(trenutnaLinija);
                        i++;
                    } else {
                        
                        break;
                    }
                }
                
                // Dodaj repliku u niz
                if (linijeGovora.length > 0) {
                    brojacReplikaUSceni++; 
                    replike.push({
                        uloga: imeUloge,
                        linije: linijeGovora,
                        pozicijaUSceni: brojacReplikaUSceni 
                    });
                }
                
                continue;
            }
            
           
            if (trimmed === '') {
                i++;
                continue;
            }
            
           
            if (jeLinijaUSamoZagradama(linija)) {
                i++;
                continue;
            }
            
           
            obradiReplike(replike, trazenaUloga, trenutnaScena, rezultat);
            replike = [];
            
           
            while (i < linije.length) {
                let segmentLinija = linije[i];
                let segmentTrimmed = segmentLinija.trim();
                
                if (segmentTrimmed === '') {
                    i++;
                    continue;
                }
                if (jeNaslovScene(segmentLinija)) {
                    break;
                }
                if (jeUloga(segmentLinija, linije[i + 1])) {
                    break;
                }
                if (jeLinijaUSamoZagradama(segmentLinija)) {
                    i++;
                    continue;
                }
                
               
                i++;
            }
        }
        
        
        obradiReplike(replike, trazenaUloga, trenutnaScena, rezultat);
        
        return rezultat;
    };
    let obradiReplike = function(replike, trazenaUloga, scena, rezultat) {
        if (replike.length === 0) return;
        
        for (let i = 0; i < replike.length; i++) {
            let replika = replike[i];
            
            if (replika.uloga.toUpperCase() === trazenaUloga) {
                let stavka = {
                    scena: scena,
                    pozicijaUTekstu: replika.pozicijaUSceni, 
                    prethodni: null,
                    trenutni: {
                        uloga: replika.uloga,
                        linije: replika.linije
                    },
                    sljedeci: null
                };
                
                
                if (i > 0) {
                    stavka.prethodni = {
                        uloga: replike[i - 1].uloga,
                        linije: replike[i - 1].linije
                    };
                }
                
                
                if (i < replike.length - 1) {
                    stavka.sljedeci = {
                        uloga: replike[i + 1].uloga,
                        linije: replike[i + 1].linije
                    };
                }
                
                rezultat.push(stavka);
            }
        }
    };
let grupisiUloge = function() {
    let tekst = editor.innerText || editor.textContent || '';
    let linije = tekst.split('\n');
    
    let rezultat = [];           
    let trenutnaScena = "";      
    let segmentBroj = 0;        
    let replike = [];            
    
    let i = 0;
    while (i < linije.length) {
        let linija = linije[i];
        let trimmed = linija.trim();
        
        
        if (jeNaslovScene(linija)) {
           
            obradiSegment(replike, trenutnaScena, segmentBroj, rezultat);
            
           
            trenutnaScena = trimmed;
            segmentBroj = 0;
            replike = [];
            i++;
            continue;
        }
        
      
        if (trimmed === '') {
            i++;
            continue;
        }
        
        if (jeLinijaUSamoZagradama(linija)) {
            i++;
            continue;
        }
        
   
        if (jeUloga(linija, linije[i + 1])) {
           
            let imaGovor = false;
            let indexGovora = -1;
            
            for (let j = i + 1; j < linije.length; j++) {
                let sljedecaLinija = linije[j];
                let sljedecaTrimmed = sljedecaLinija.trim();
                
                
                if (sljedecaTrimmed === '' || jeLinijaUSamoZagradama(sljedecaLinija)) {
                    continue;
                }
                
              
                if (jeGovor(sljedecaLinija)) {
                    imaGovor = true;
                    indexGovora = j;
                    break;
                }
                
                
                break;
            }
            
            if (imaGovor) {
                let imeUloge = trimmed;
                replike.push(imeUloge);  
                
                
                i = indexGovora;
                while (i < linije.length) {
                    let govLinija = linije[i];
                    let govTrimmed = govLinija.trim();
                    
                    
                    if (govTrimmed === '') break;
                    
                   
                    if (jeNaslovScene(govLinija)) break;
                    
                    
                    if (jeUloga(govLinija, linije[i + 1])) break;
                    
                    
                    if (jeLinijaUSamoZagradama(govLinija)) {
                        i++;
                        continue;
                    }
                    
                    
                    if (!jeGovor(govLinija)) break;
                    
                    i++; 
                }
                continue;
            } else {
               
                i++;
                continue;
            }
        }
        
        
       
        if (!jeNaslovScene(linija) && !jeLinijaUSamoZagradama(linija) && trimmed !== '') {
            
            if (replike.length > 0) {
                obradiSegment(replike, trenutnaScena, segmentBroj, rezultat);
                segmentBroj++;  
                replike = [];
            }
            
            
            while (i < linije.length) {
                let akcLinija = linije[i];
                let akcTrimmed = akcLinija.trim();
                
               
                if (akcTrimmed === '') {
                    i++;
                    continue;
                }
                
             
                if (jeLinijaUSamoZagradama(akcLinija)) {
                    i++;
                    continue;
                }
                
                
                if (jeNaslovScene(akcLinija)) break;
                
                
                if (jeUloga(akcLinija, linije[i + 1])) break;
                
                i++; 
            }
            continue;
        }
        
       
        i++;
    }
    
  
    obradiSegment(replike, trenutnaScena, segmentBroj, rezultat);
    
    return rezultat;
};


let obradiSegment = function(replike, scena, segmentBroj, rezultat) {
    if (replike.length === 0) return;  
    
   
    let jedinstveneUloge = [];
    let vidjene = {};
    
    for (let i = 0; i < replike.length; i++) {
        let uloga = replike[i];
        if (!vidjene[uloga]) {
            jedinstveneUloge.push(uloga);
            vidjene[uloga] = true;
        }
    }
    
    
    rezultat.push({
        scena: scena,
        segment: segmentBroj + 1,  
        uloge: jedinstveneUloge
    });
};
let formatirajTekst = function(komanda) {
   
    if (komanda !== "bold" && komanda !== "italic" && komanda !== "underline") {
        return false;
    }

    let izbor = window.getSelection();


    if (!izbor || izbor.rangeCount === 0) {
        return false;
    }

   
    if (izbor.isCollapsed) {
        return false;
    }

    let opseg = izbor.getRangeAt(0);

  
    if (!editor.contains(opseg.commonAncestorContainer)) {
        return false;
    }

    
    if (!editor.contains(opseg.startContainer) || !editor.contains(opseg.endContainer)) {
        return false;
    }

   
    let uspesno = false;
    
    try {
        if (komanda === "bold") {
            uspesno = document.execCommand('bold', false, null);
        } else if (komanda === "italic") {
            uspesno = document.execCommand('italic', false, null);
        } else if (komanda === "underline") {
            uspesno = document.execCommand('underline', false, null);
        }
    } catch (e) {
        return false;
    }

    return uspesno;
};
   
    return {
        dajBrojRijeci: dajBrojRijeci,
    dajUloge: dajUloge,
    pogresnaUloga: pogresnaUloga,          
    brojLinijaTeksta: brojLinijaTeksta,    
    scenarijUloge: scenarijUloge,          
    grupisiUloge: grupisiUloge,            
    formatirajTekst: formatirajTekst 
    }
};
