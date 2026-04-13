# Docker Compose Quick Controls

Una mod che mostra una card in CasaOS/CasaMOD con lo stato rapido dei container Docker Compose e copia comandi `restart`/`stop`.

## Cosa fa
- Legge lo stato dai container in `/mod/docker-compose-quick-controls/containers.json`
- Mostra nome servizio, immagine, stato, CPU e RAM
- Offre pulsanti per copiare comandi `docker compose restart` e `docker compose stop`
- Aggiorna automaticamente ogni 10 secondi

## Come installare
1. Copia la cartella `docker-compose-quick-controls` in `mod/` della tua installazione CasaMOD.
2. Assicurati che `mod.js`, `mod.css` e `containers.json` siano accessibili dal browser.
3. Ricarica CasaMOD / la dashboard.
4. Cerca la card "Docker Compose Quick Controls".

## Come generare `containers.json`
CasaMOD non può eseguire direttamente i comandi Docker dal browser, quindi questo widget legge un file JSON aggiornato da uno script esterno.

### Esempio di script Python
Salva `generate-containers-json.py` nella stessa cartella del mod e lancialo periodicamente con cron.

```bash
cd /DATA/AppData/casamod/mod/docker-compose-quick-controls
/usr/bin/python3 generate-containers-json.py > containers.json
```

### Cron consigliato
```cron
*/1 * * * * root cd /DATA/AppData/casamod/mod/docker-compose-quick-controls && /usr/bin/python3 generate-containers-json.py > containers.json 2>/dev/null
```

## Uso
- Premi il pulsante `Copia Restart` per copiare il comando di riavvio del servizio.
- Premi il pulsante `Copia Stop` per copiare il comando di stop.
- Incolla ed esegui il comando nella shell del tuo host/VM Docker Compose.

## Limitazioni
- Questa card non esegue direttamente i comandi Docker.
- È un pannello di controllo rapido con copie comandi; l'esecuzione resta a shell/host.

## Nota
Se vuoi, posso aggiungere in seguito anche un helper che esegue i comandi da un file di richiesta, ma il primo passo più affidabile è sempre questo: visualizzare lo stato e copiare il comando pronto.
