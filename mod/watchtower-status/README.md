# Watchtower Status MOD

Una mod che mostra una card in CasaOS/CasaMOD con lo stato degli aggiornamenti Watchtower.

## Cosa fa
- Legge lo stato da `/mod/watchtower-status/status.json`
- Mostra badge OK/Warning/Error
- Mostra l'ultimo controllo, il numero di container aggiornati, in attesa e falliti
- Mostra un estratto degli ultimi log Watchtower

## File
- `mod.js` — script principale che disegna la card nella dashboard
- `mod.css` — stile della card
- `generate-watchtower-status.sh` — script bash che legge i log di Watchtower e genera `status.json`
- `status.json` — file di stato generato da `generate-watchtower-status.sh`

## Come installare
1. Copia la cartella `watchtower-status` in `mod/` della tua installazione CasaMOD.
2. Assicurati che `mod.js`, `mod.css` e `status.json` siano accessibili dal browser.
3. Ricarica CasaMOD / la dashboard.
4. Cerca la card "Aggiornamenti Container".

## Come generare `status.json`
Lo script bash legge il file `watchtower.log` se presente. In alternativa prova a leggere i log del container Watchtower, cercando automaticamente un container con nome o immagine contenente `watchtower`.

### Esempio d'uso
```bash
cd /DATA/AppData/casamod/mod/watchtower-status
bash ./generate-watchtower-status.sh
```

### Cron consigliato
```cron
*/5 * * * * root cd /DATA/AppData/casamod/mod/watchtower-status && bash ./generate-watchtower-status.sh > /dev/null 2>&1
```

## Come funziona
- Se trova un log di Watchtower, analizza gli aggiornamenti recenti e genera un JSON di stato.
- La card legge il JSON e mostra badge e log.
- Se i log non sono disponibili, la card mostrerà uno stato "unknown".

## Nota
Questa versione è una dashboard read-only. Il pulsante di aggiornamento ricarica il contenuto della card, ma non esegue ancora `watchtower --run-once` direttamente.
