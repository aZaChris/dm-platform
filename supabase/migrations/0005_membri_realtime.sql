-- Gestione membri (T024): il giocatore rimosso deve saperlo subito.
-- La chiave primaria (campaign_id, user_id) basta: l'evento DELETE la porta nel vecchio record.
alter publication supabase_realtime add table public.campaign_members;
