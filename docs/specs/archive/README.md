# docs/specs/archive/

Versioni storiche dei documenti di specifica. Ogni volta che esce una nuova
revisione di `01_analisi_funzionale.md` o `02_specifiche_sviluppo.md`:

1. Sposta qui la versione precedente, rinominandola con il suffisso di versione:
   ```
   01_analisi_funzionale_v2.0.md
   02_specifiche_sviluppo_v2.0.md
   ```
2. Conserva anche il `.docx` originale della nuova revisione, se fornito
   (usando la stessa convenzione di nome).
3. Aggiungi una voce in `../CHANGELOG_SPECS.md` con il diff concettuale.

> **Non modificare** file in questa directory: sono storia immutabile.
