# `supabase db query` rifiuta le query in modalità agente

## Sintomo

`npx supabase db query --linked "select ..."` termina con `HostedMutationConsentRequiredError`:
«Confirmation required: Run a SQL statement ... This run can't ask because it is running in agent mode.
Nothing was changed.» anche se la query è solo una `select`.

## Causa radice

Dalla CLI 3.x ogni `db query` sul progetto remoto è trattata come possibile modifica e chiede conferma.
Quando la CLI capisce di essere lanciata da un agente non può chiedere, quindi si ferma.
In più `--linked` è deprecato a favore di `--remote`.

## Come l'abbiamo confermata

Il messaggio d'errore stesso suggerisce `--read-only` per le query di sola lettura; rilanciata così,
la stessa `select` è passata (verifica della T002 della feature 003, 2026-11-25).

## Risoluzione

Per controllare il database di produzione usare sempre:

```bash
npx supabase db query --remote --read-only "select ..."
```

## Lezione per il futuro

Le verifiche dopo una migrazione si fanno con `--read-only`: oltre a passare il controllo della CLI,
garantisce che la verifica non modifichi nulla. `--yes` serve solo per scritture volute.

## Riferimenti

- `specs/003-chat-tavolo/tasks.md`, T002
- `supabase/migrations/0009_chat.sql`
