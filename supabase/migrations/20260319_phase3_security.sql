-- Phase 3 - SQL Security Hardening
-- Idempotent migration for Supabase Postgres.
-- Focus:
-- 1) RLS hardening for user/admin separation
-- 2) Storage policies for documents-licences
-- 3) Data-integrity constraints and guard triggers

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helper functions for role checks used by policies
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
	select coalesce((select p.role from public.profiles p where p.id = auth.uid()), 'user');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select public.current_user_role() = 'admin';
$$;

create or replace function public.storage_object_registration_id(object_name text)
returns uuid
language plpgsql
stable
as $$
declare
	first_segment text;
begin
	first_segment := split_part(object_name, '/', 1);
	if first_segment is null or first_segment = '' then
		return null;
	end if;

	begin
		return first_segment::uuid;
	exception
		when others then
			return null;
	end;
end;
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.storage_object_registration_id(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Business integrity
-- ---------------------------------------------------------------------------
create unique index if not exists registrations_user_season_unique_idx
	on public.registrations (user_id, season)
	where user_id is not null;

-- Guard admin-managed columns + lock submitted registration writes for non-admin.
create or replace function public.guard_registration_writes()
returns trigger
language plpgsql
as $$
begin
	if public.is_admin() then
		return new;
	end if;

	if tg_op = 'INSERT' then
		new.status_id := null;
		new.ffbb_link_sent := false;
		new.ffbb_link_sent_at := null;
		new.ffbb_link_sent_by := null;
		new.ffbb_registration_completed := false;
		new.ffbb_registration_completed_at := null;
		new.ffbb_payment_confirmed := false;
		new.ffbb_payment_confirmed_at := null;
		new.admin_notes := null;
		return new;
	end if;

	if tg_op = 'UPDATE' then
		if old.registration_submitted_at is not null then
			raise exception 'Submitted registrations are read-only for members.';
		end if;

		new.status_id := old.status_id;
		new.ffbb_link_sent := old.ffbb_link_sent;
		new.ffbb_link_sent_at := old.ffbb_link_sent_at;
		new.ffbb_link_sent_by := old.ffbb_link_sent_by;
		new.ffbb_registration_completed := old.ffbb_registration_completed;
		new.ffbb_registration_completed_at := old.ffbb_registration_completed_at;
		new.ffbb_payment_confirmed := old.ffbb_payment_confirmed;
		new.ffbb_payment_confirmed_at := old.ffbb_payment_confirmed_at;
		new.admin_notes := old.admin_notes;
		return new;
	end if;

	return new;
end;
$$;

drop trigger if exists guard_registration_writes_trg on public.registrations;
create trigger guard_registration_writes_trg
before insert or update on public.registrations
for each row
execute function public.guard_registration_writes();

-- Prevent members from changing admin-controlled payment accounting columns.
create or replace function public.guard_registration_payment_writes()
returns trigger
language plpgsql
as $$
begin
	if public.is_admin() then
		return new;
	end if;

	if tg_op = 'INSERT' then
		new.total_amount_eur := coalesce(new.total_amount_eur, 150.00);
		new.amount_paid_eur := coalesce(new.amount_paid_eur, 0.00);
		new.amount_remaining_eur := coalesce(new.total_amount_eur - new.amount_paid_eur, new.total_amount_eur);
		new.payment_status_id := null;
		new.notes := null;
		return new;
	end if;

	if tg_op = 'UPDATE' then
		new.total_amount_eur := old.total_amount_eur;
		new.amount_paid_eur := old.amount_paid_eur;
		new.amount_remaining_eur := old.amount_remaining_eur;
		new.payment_status_id := old.payment_status_id;
		new.notes := old.notes;
		return new;
	end if;

	return new;
end;
$$;

drop trigger if exists guard_registration_payment_writes_trg on public.registration_payments;
create trigger guard_registration_payment_writes_trg
before insert or update on public.registration_payments
for each row
execute function public.guard_registration_payment_writes();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.registrations enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.legal_guardians enable row level security;
alter table public.registration_documents enable row level security;
alter table public.registration_threads enable row level security;
alter table public.registration_messages enable row level security;
alter table public.registration_payments enable row level security;
alter table public.payment_installments enable row level security;
alter table public.registration_timeline enable row level security;

alter table public.countries enable row level security;
alter table public.document_statuses enable row level security;
alter table public.document_types enable row level security;
alter table public.license_type_required_documents enable row level security;
alter table public.license_types enable row level security;
alter table public.message_statuses enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payment_statuses enable row level security;
alter table public.registration_statuses enable row level security;
alter table public.sections enable row level security;
alter table public.user_roles enable row level security;

alter table storage.objects enable row level security;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
	on public.profiles
	for select
	to authenticated
	using (id = auth.uid());

drop policy if exists profiles_insert_own_user on public.profiles;
create policy profiles_insert_own_user
	on public.profiles
	for insert
	to authenticated
	with check (id = auth.uid() and coalesce(role, 'user') = 'user');

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all
	on public.profiles
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------
do $$
declare
	t text;
begin
	foreach t in array array[
		'countries',
		'document_statuses',
		'document_types',
		'license_type_required_documents',
		'license_types',
		'message_statuses',
		'payment_methods',
		'payment_statuses',
		'registration_statuses',
		'sections',
		'user_roles'
	]
	loop
		execute format('drop policy if exists %I on public.%I', t || '_select_authenticated', t);
		execute format(
			'create policy %I on public.%I for select to authenticated using (true)',
			t || '_select_authenticated',
			t
		);

		execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
		execute format(
			'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
			t || '_admin_write',
			t
		);
	end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Registrations
-- ---------------------------------------------------------------------------
drop policy if exists registrations_select_own on public.registrations;
create policy registrations_select_own
	on public.registrations
	for select
	to authenticated
	using (user_id = auth.uid());

drop policy if exists registrations_insert_own on public.registrations;
create policy registrations_insert_own
	on public.registrations
	for insert
	to authenticated
	with check (user_id = auth.uid());

drop policy if exists registrations_update_own_draft on public.registrations;
create policy registrations_update_own_draft
	on public.registrations
	for update
	to authenticated
	using (user_id = auth.uid() and registration_submitted_at is null)
	with check (user_id = auth.uid());

drop policy if exists registrations_delete_own_draft on public.registrations;
create policy registrations_delete_own_draft
	on public.registrations
	for delete
	to authenticated
	using (user_id = auth.uid() and registration_submitted_at is null);

drop policy if exists registrations_admin_all on public.registrations;
create policy registrations_admin_all
	on public.registrations
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Emergency contacts / legal guardians
-- ---------------------------------------------------------------------------
drop policy if exists emergency_contacts_select_own on public.emergency_contacts;
create policy emergency_contacts_select_own
	on public.emergency_contacts
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = emergency_contacts.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists emergency_contacts_write_own_draft on public.emergency_contacts;
create policy emergency_contacts_write_own_draft
	on public.emergency_contacts
	for all
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = emergency_contacts.registration_id
			  and r.user_id = auth.uid()
			  and r.registration_submitted_at is null
		)
	)
	with check (
		exists (
			select 1
			from public.registrations r
			where r.id = emergency_contacts.registration_id
			  and r.user_id = auth.uid()
			  and r.registration_submitted_at is null
		)
	);

drop policy if exists emergency_contacts_admin_all on public.emergency_contacts;
create policy emergency_contacts_admin_all
	on public.emergency_contacts
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists legal_guardians_select_own on public.legal_guardians;
create policy legal_guardians_select_own
	on public.legal_guardians
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = legal_guardians.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists legal_guardians_write_own_draft on public.legal_guardians;
create policy legal_guardians_write_own_draft
	on public.legal_guardians
	for all
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = legal_guardians.registration_id
			  and r.user_id = auth.uid()
			  and r.registration_submitted_at is null
		)
	)
	with check (
		exists (
			select 1
			from public.registrations r
			where r.id = legal_guardians.registration_id
			  and r.user_id = auth.uid()
			  and r.registration_submitted_at is null
		)
	);

drop policy if exists legal_guardians_admin_all on public.legal_guardians;
create policy legal_guardians_admin_all
	on public.legal_guardians
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Registration documents
-- ---------------------------------------------------------------------------
drop policy if exists registration_documents_select_own on public.registration_documents;
create policy registration_documents_select_own
	on public.registration_documents
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = registration_documents.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_documents_insert_own_draft on public.registration_documents;
create policy registration_documents_insert_own_draft
	on public.registration_documents
	for insert
	to authenticated
	with check (
		uploaded_by = auth.uid()
		and exists (
			select 1
			from public.registrations r
			where r.id = registration_documents.registration_id
			  and r.user_id = auth.uid()
			  and r.registration_submitted_at is null
		)
	);

drop policy if exists registration_documents_delete_own_draft on public.registration_documents;
create policy registration_documents_delete_own_draft
	on public.registration_documents
	for delete
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = registration_documents.registration_id
			  and r.user_id = auth.uid()
			  and r.registration_submitted_at is null
		)
	);

drop policy if exists registration_documents_admin_all on public.registration_documents;
create policy registration_documents_admin_all
	on public.registration_documents
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Registration threads
-- ---------------------------------------------------------------------------
drop policy if exists registration_threads_select_own on public.registration_threads;
create policy registration_threads_select_own
	on public.registration_threads
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = registration_threads.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_threads_insert_own on public.registration_threads;
create policy registration_threads_insert_own
	on public.registration_threads
	for insert
	to authenticated
	with check (
		exists (
			select 1
			from public.registrations r
			where r.id = registration_threads.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_threads_admin_all on public.registration_threads;
create policy registration_threads_admin_all
	on public.registration_threads
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Registration messages
-- ---------------------------------------------------------------------------
drop policy if exists registration_messages_select_own on public.registration_messages;
create policy registration_messages_select_own
	on public.registration_messages
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.registration_threads t
			join public.registrations r on r.id = t.registration_id
			where t.id = registration_messages.thread_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_messages_insert_own on public.registration_messages;
create policy registration_messages_insert_own
	on public.registration_messages
	for insert
	to authenticated
	with check (
		sender_profile_id = auth.uid()
		and is_admin_message = false
		and exists (
			select 1
			from public.registration_threads t
			join public.registrations r on r.id = t.registration_id
			where t.id = registration_messages.thread_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_messages_admin_all on public.registration_messages;
create policy registration_messages_admin_all
	on public.registration_messages
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Registration payments
-- ---------------------------------------------------------------------------
drop policy if exists registration_payments_select_own on public.registration_payments;
create policy registration_payments_select_own
	on public.registration_payments
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = registration_payments.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_payments_insert_own on public.registration_payments;
create policy registration_payments_insert_own
	on public.registration_payments
	for insert
	to authenticated
	with check (
		exists (
			select 1
			from public.registrations r
			where r.id = registration_payments.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_payments_update_own on public.registration_payments;
create policy registration_payments_update_own
	on public.registration_payments
	for update
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = registration_payments.registration_id
			  and r.user_id = auth.uid()
		)
	)
	with check (
		exists (
			select 1
			from public.registrations r
			where r.id = registration_payments.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_payments_admin_all on public.registration_payments;
create policy registration_payments_admin_all
	on public.registration_payments
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Payment installments
-- ---------------------------------------------------------------------------
drop policy if exists payment_installments_select_own on public.payment_installments;
create policy payment_installments_select_own
	on public.payment_installments
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.registration_payments rp
			join public.registrations r on r.id = rp.registration_id
			where rp.id = payment_installments.registration_payment_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists payment_installments_admin_all on public.payment_installments;
create policy payment_installments_admin_all
	on public.payment_installments
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Registration timeline
-- ---------------------------------------------------------------------------
drop policy if exists registration_timeline_select_own on public.registration_timeline;
create policy registration_timeline_select_own
	on public.registration_timeline
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.registrations r
			where r.id = registration_timeline.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_timeline_insert_own on public.registration_timeline;
create policy registration_timeline_insert_own
	on public.registration_timeline
	for insert
	to authenticated
	with check (
		actor_profile_id = auth.uid()
		and exists (
			select 1
			from public.registrations r
			where r.id = registration_timeline.registration_id
			  and r.user_id = auth.uid()
		)
	);

drop policy if exists registration_timeline_admin_all on public.registration_timeline;
create policy registration_timeline_admin_all
	on public.registration_timeline
	for all
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'documents-licences',
	'documents-licences',
	false,
	4194304,
	array['application/pdf', 'image/jpeg']
)
on conflict (id) do update
set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_documents_select on storage.objects;
create policy storage_documents_select
	on storage.objects
	for select
	to authenticated
	using (
		bucket_id = 'documents-licences'
		and (
			public.is_admin()
			or exists (
				select 1
				from public.registrations r
				where r.id = public.storage_object_registration_id(name)
				  and r.user_id = auth.uid()
			)
		)
	);

drop policy if exists storage_documents_insert on storage.objects;
create policy storage_documents_insert
	on storage.objects
	for insert
	to authenticated
	with check (
		bucket_id = 'documents-licences'
		and (
			public.is_admin()
			or exists (
				select 1
				from public.registrations r
				where r.id = public.storage_object_registration_id(name)
				  and r.user_id = auth.uid()
				  and r.registration_submitted_at is null
			)
		)
	);

drop policy if exists storage_documents_update on storage.objects;
create policy storage_documents_update
	on storage.objects
	for update
	to authenticated
	using (
		bucket_id = 'documents-licences'
		and (
			public.is_admin()
			or exists (
				select 1
				from public.registrations r
				where r.id = public.storage_object_registration_id(name)
				  and r.user_id = auth.uid()
				  and r.registration_submitted_at is null
			)
		)
	)
	with check (
		bucket_id = 'documents-licences'
		and (
			public.is_admin()
			or exists (
				select 1
				from public.registrations r
				where r.id = public.storage_object_registration_id(name)
				  and r.user_id = auth.uid()
				  and r.registration_submitted_at is null
			)
		)
	);

drop policy if exists storage_documents_delete on storage.objects;
create policy storage_documents_delete
	on storage.objects
	for delete
	to authenticated
	using (
		bucket_id = 'documents-licences'
		and (
			public.is_admin()
			or exists (
				select 1
				from public.registrations r
				where r.id = public.storage_object_registration_id(name)
				  and r.user_id = auth.uid()
				  and r.registration_submitted_at is null
			)
		)
	);

-- ---------------------------------------------------------------------------
-- RPC privilege tightening (all overloads)
-- ---------------------------------------------------------------------------
do $$
declare
	fn record;
begin
	for fn in
		select
			n.nspname as schema_name,
			p.proname as function_name,
			pg_get_function_identity_arguments(p.oid) as identity_args
		from pg_proc p
		join pg_namespace n on n.oid = p.pronamespace
		where n.nspname = 'public'
		  and p.proname in (
			'send_ffbb_link',
			'validate_document',
			'reject_document',
			'mark_ffbb_payment_confirmed',
			'mark_ffbb_registration_completed',
			'record_manual_payment'
		  )
	loop
		execute format(
			'revoke all on function %I.%I(%s) from public, anon',
			fn.schema_name,
			fn.function_name,
			fn.identity_args
		);
		execute format(
			'grant execute on function %I.%I(%s) to authenticated',
			fn.schema_name,
			fn.function_name,
			fn.identity_args
		);
	end loop;
end;
$$;

commit;
