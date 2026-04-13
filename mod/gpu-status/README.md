# GPU Status MOD

Questa mod aggiunge una card per visualizzare lo stato della GPU NVIDIA come widget nella dashboard di CasaMOD.

## Dove mettere la mod
- Installa localmente in `mod/gpu-status/`.
- Questa repository usa la cartella `mod/` per i mod installati.

## File
- `mod.js` — script principale: inietta il widget nella dashboard.
- `mod.css` — stile della card.
- `nvidia-smi` — script che esegue `nvidia-smi` e genera un CSV con modello GPU, driver, CUDA e wattaggio.
- `nvidia-smi.txt` — file che contiene l'output di `nvidia-smi`.
- `nvidia-smi-processes` — script che genera `gpu-processes.txt`.
- `gpu-processes.txt` — file che contiene la lista compatta dei processi GPU in formato CSV (Processo, VRAM (MB), Container), necessario per la tendina processi.

## Come funziona
Il widget viene inserito nell'area `.ps-container` della dashboard, come fanno gli altri mod tipo `notes`.

`mod.js` carica il file `/mod/gpu-status/nvidia-smi.txt` e mostra il suo contenuto nella card.

### Note importanti
- Il browser non esegue `nvidia-smi` direttamente.
- Lo script `nvidia-smi` deve essere eseguito dal sistema e aggiornare `nvidia-smi.txt`.
- Per la tendina processi GPU, il file `gpu-processes.txt` deve essere aggiornato insieme a `nvidia-smi.txt`.
- Lo script `nvidia-smi-processes` ora mappa i container dal cgroup al nome reale mostrato da `docker ps`, evitando `docker-xxxxxx` troncati.

## Esempio di aggiornamento automatico
Usa cron o uno script periodico per ricreare `nvidia-smi.txt` e `gpu-processes.txt`:

```bash
*/1 * * * * root /DATA/AppData/casamod/mod/gpu-status/nvidia-smi > /DATA/AppData/casamod/mod/gpu-status/nvidia-smi.txt 2>&1
*/1 * * * * root /DATA/AppData/casamod/mod/gpu-status/nvidia-smi-processes > /DATA/AppData/casamod/mod/gpu-status/gpu-processes.txt 2>&1
```

> Se lo script `nvidia-smi-processes` è stato salvato/copincollato da Windows, esegui una sola volta:
>
> ```bash
> sed -i 's/\r$//' /DATA/AppData/casamod/mod/gpu-status/nvidia-smi-processes
> ```
>
> Questo comando serve solo una tantum per rimuovere i fine riga Windows (CRLF).
> NON va inserito nel cron.

Assicurati che lo script sia eseguibile:

```bash
chmod +x /DATA/AppData/casamod/mod/gpu-status/nvidia-smi-processes
```

## Come testare
1. Copia la cartella `gpu-status` in `mod/` della tua installazione CasaMOD.
2. Ricarica CasaMOD o la pagina della dashboard.
3. Cerca il widget "GPU NVIDIA" nella dashboard.
4. Espandi la sezione "Processi GPU" per vedere i processi attivi.
5. Il widget e la tendina processi verranno aggiornati automaticamente ogni 10 secondi.
6. Se non vedi nulla, prova a riavviare CasaMOD e verifica che i file `nvidia-smi.txt` e `gpu-processes.txt` siano accessibili.
