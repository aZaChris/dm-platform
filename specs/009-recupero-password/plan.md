# Implementation Plan: Recupero password

**Spec**: [spec.md](spec.md)

## Summary

`resetPasswordForEmail` per il link, `updateUser` per la nuova password: tutto Supabase Auth. Nessuna dipendenza,
nessuna migrazione.

## Scelte

- Il link torna sulla radice del sito con `#…type=recovery`. Il router a hash lo leggerebbe come pagina, e l'evento
  `PASSWORD_RECOVERY` arriva in asincrono: `lib/supabase.ts` legge l'indirizzo **prima** di creare il client.
- **Limite noto**: ricaricando la pagina durante la scelta si entra nell'app senza cambiare password; basta chiedere
  un altro link.
- Modulo dentro `pages/Login.tsx`: stessa grafica.

## Constitution Check

I ✅ zero dipendenze · II ✅ · III ✅ Supabase Auth · IV ✅ · V ✅ accesso al tavolo, nessuna funzione nuova di gioco.

## Configurazione

In Supabase, Authentication → URL Configuration, devono esserci gli indirizzi di ritorno: il dominio pubblico e
`http://localhost:5173/`.
