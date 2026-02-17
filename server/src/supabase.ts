import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

interface Action {
  type: "add" | "delete" | "toggle" | "move";
  title?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  taskId?: string;
  status?: "todo" | "in_progress" | "done";
}

export async function executeActions(userId: string, actions: Action[]) {
  await Promise.all(
    actions.map((action) => {
      switch (action.type) {
        case "add": {
          if (!action.title) return;
          return supabase.from("tasks").insert({
            user_id: userId,
            title: action.title,
            priority: action.priority || "medium",
            due_date: action.dueDate || null,
            completed: false,
          });
        }
        case "toggle": {
          if (!action.taskId) return;
          return supabase.rpc("toggle_task", {
            p_task_id: action.taskId,
            p_user_id: userId,
          });
        }
        case "move": {
          if (!action.taskId || !action.status) return;
          return supabase
            .from("tasks")
            .update({
              status: action.status,
              completed: action.status === "done",
            })
            .eq("id", action.taskId)
            .eq("user_id", userId);
        }
        case "delete": {
          if (!action.taskId) return;
          return supabase
            .from("tasks")
            .delete()
            .eq("id", action.taskId)
            .eq("user_id", userId);
        }
      }
    }),
  );
}

export async function fetchTasks(userId: string) {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, completed, priority, due_date, created_at, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { tasks: [], error };
  }

  const formattedTasks = (tasks || []).map((t) => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    priority: t.priority,
    dueDate: t.due_date,
    createdAt: t.created_at,
    status: t.status || "todo",
  }));

  return { tasks: formattedTasks, error: null };
}
