create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  title text not null,
  completed boolean default false,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  created_at timestamptz default now()
);

alter table tasks enable row level security;

create or replace function toggle_task(p_task_id uuid, p_user_id text)
returns void as $$
begin
  update tasks
  set completed = not completed
  where id = p_task_id and user_id = p_user_id;
end;
$$ language plpgsql security definer;
