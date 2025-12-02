let divEditor = document.getElementById("divEditor");
let editor = EditorTeksta(divEditor);
let porukeDiv = document.getElementById("poruke");


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