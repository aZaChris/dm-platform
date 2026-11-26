-- Righello (feature 005): la misura viaggia in Realtime Broadcast sul canale privato ruler:<campagna>,
-- senza tabelle (le misure non si salvano). Queste policy fanno valere is_member anche sul canale:
-- chi non è membro della campagna non riceve e non manda misure.

create policy ruler_select on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) like 'ruler:%'
    and public.is_member(split_part((select realtime.topic()), ':', 2)::uuid)
  );

create policy ruler_insert on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) like 'ruler:%'
    and public.is_member(split_part((select realtime.topic()), ':', 2)::uuid)
  );
