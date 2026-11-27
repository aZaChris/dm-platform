# Feature Specification: Recupero password

**Feature Branch**: `009-recupero-password` | **Created**: 2026-11-26 | **Status**: Draft

## User Story 1 - Rientrare senza ricordare la password (P1)

Dalla pagina di accesso un membro chiede il link via email, lo apre, sceglie una nuova password ed entra.

**Acceptance Scenarios**:

1. **Given** la pagina di accesso, **When** chiede il recupero per la sua email, **Then** legge che, se l'account esiste, arriverà un link.
2. **Given** il link ricevuto, **When** lo apre e salva una nuova password, **Then** è dentro l'app e la vecchia password non vale più.
3. **Given** un link scaduto o già usato, **When** lo apre, **Then** legge che non vale più e può chiederne un altro.

## Requirements

- **FR-001**: La pagina di accesso MUST permettere di chiedere il link di recupero.
- **FR-002**: Il messaggio dopo la richiesta MUST NOT rivelare se l'email è registrata.
- **FR-003**: Dal link il membro MUST poter impostare una nuova password (minimo 6 caratteri, come in registrazione).
- **FR-004**: Un link non valido MUST produrre un messaggio comprensibile.

## Success Criteria

- **SC-001**: Un membro rientra in meno di 3 minuti dalla richiesta, email permettendo.

## Assumptions

- Le email le manda Supabase con il suo servizio predefinito, che ha un limite orario basso; un servizio di invio
  proprio è rimandato.
