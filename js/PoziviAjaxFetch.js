const PoziviAjax = (function() {
    return {
        // Funkcija za POST zahtjev (kreiranje scenarija)
        dodajScenario: function(title, callback) {
            fetch('/api/scenarios', {  
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: title })
            })
            .then(response => {
                const status = response.status;
                return response.json().then(data => ({ status, data }));
            })
            .then(({ status, data }) => {
                callback(status, data);
            })
            .catch(error => {
                callback(500, { error: error.message });
            });
        },

        // Funkcija za zaključavanje linije
        zakljucajLiniju: function(scenarioId, lineId, userId, callback) {
            fetch(`/api/scenarios/${scenarioId}/lines/${lineId}/lock`, {  
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userId })
            })
            .then(response => {
                const status = response.status;
                return response.json().then(data => ({ status, data }));
            })
            .then(({ status, data }) => {
                callback(status, data);
            })
            .catch(error => {
                callback(500, { error: error.message });
            });
        },

        // Funkcija za ažuriranje linije
        azurirajLiniju: function(scenarioId, lineId, userId, newText, callback) {
            fetch(`/api/scenarios/${scenarioId}/lines/${lineId}`, {  
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userId, newText: newText })
            })
            .then(response => {
                const status = response.status;
                return response.json().then(data => ({ status, data }));
            })
            .then(({ status, data }) => {
                callback(status, data);
            })
            .catch(error => {
                callback(500, { error: error.message });
            });
        },

        // Funkcija za zaključavanje karaktera
        zakljucajKarakter: function(scenarioId, userId, karakter, callback) {
            fetch(`/api/scenarios/${scenarioId}/characters/lock`, {  
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userId, characterName: karakter })
            })
            .then(response => {
                const status = response.status;
                return response.json().then(data => ({ status, data }));
            })
            .then(({ status, data }) => {
                callback(status, data);
            })
            .catch(error => {
                callback(500, { error: error.message });
            });
        },

        // Funkcija za promjenu imena karaktera
        promijeniUlogu: function(scenarioId, userId, karakterStari, novi, callback) {
            fetch(`/api/scenarios/${scenarioId}/characters/update`, {  
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userId, oldName: karakterStari, newName: novi })
            })
            .then(response => {
                const status = response.status;
                return response.json().then(data => ({ status, data }));
            })
            .then(({ status, data }) => {
                callback(status, data);
            })
            .catch(error => {
                callback(500, { error: error.message });
            });
        },

        // Funkcija za dohvat promjena (deltas)
        dajPromjene: function(scenarioId, vrijeme, callback) {
            fetch(`/api/scenarios/${scenarioId}/deltas?since=${vrijeme}`, {  
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                const status = response.status;
                return response.json().then(data => ({ status, data }));
            })
            .then(({ status, data }) => {
                callback(status, data);
            })
            .catch(error => {
                callback(500, { error: error.message });
            });
        },

        // Funkcija za dohvat scenarija
        dajScenarije: function(scenarioId, callback) {
            fetch(`/api/scenarios/${scenarioId}`, {  
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                const status = response.status;
                return response.json().then(data => ({ status, data }));
            })
            .then(({ status, data }) => {
                callback(status, data);
            })
            .catch(error => {
                callback(500, { error: error.message });
            });
        }
    };
})();