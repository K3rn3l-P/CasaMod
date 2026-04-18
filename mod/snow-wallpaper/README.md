# Snow Wallpaper MOD

Una mod che aggiunge un effetto neve animato sul frontend di CasaMOD.

## Cosa fa
- Disegna neve in caduta libera con canvas HTML5.
- Usa un effetto leggero e ottimizzato per ridurre l'impatto sulle prestazioni.
- Si attiva automaticamente solo nei mesi autunno/inverno.

## Quando si attiva
La mod è abilitata di default solo nei mesi:
- ottobre
- novembre
- dicembre
- gennaio
- febbraio
- marzo

Questo evita l'effetto neve in primavera/estate.

## Come installare
1. Copia la cartella `snow-wallpaper` in `/mod/` della tua installazione CasaMOD.
2. Assicurati che `mod.js` sia accessibile dal browser.
3. Ricarica CasaMOD / la dashboard.
4. La neve si attiverà automaticamente se il mese corrente è autunno/inverno.

## Configurazione opzionale
Puoi forzare l'attivazione o personalizzare i mesi usando una variabile globale nel browser.

### Forzare attivazione
Apri la console del browser e inserisci:

```js
window.SNOW_WALLPAPER_CONFIG = { enabled: true };
```

### Disattivare completamente
```js
window.SNOW_WALLPAPER_CONFIG = { enabled: false };
```

### Personalizzare i mesi
Usa l'array `months` con valori da `0` a `11` (gennaio = `0`, dicembre = `11`).

Esempio: attivare solo dicembre, gennaio e febbraio:

```js
window.SNOW_WALLPAPER_CONFIG = {
  months: [11, 0, 1]
};
```

## Come funziona
- Il codice controlla la data del browser con `new Date().getMonth()`.
- Se il mese è tra i valori abilitati, viene creato il canvas e parte l'animazione della neve.
- Se il mese non è abilitato, non viene creato alcun canvas e la mod resta inattiva.

## Note
- Questa mod usa il clock del client/browser, quindi non dipende dalla data del container Docker.
- Se hai un ambiente con orologio errato, valuta la configurazione del sistema o l'uso di `window.SNOW_WALLPAPER_CONFIG` per forzare il comportamento.
