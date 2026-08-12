import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { ExpenseForm } from "../../ExpenseForm";
import { updateExpense } from "../../actions";

export default async function EditExpensePage(props: PageProps<"/expenses/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: expense } = await supabase.from("expenses").select("*").eq("id", id).single();

  if (!expense) notFound();

  return (
    <div>
      <PageHeader title="I-edit ang Gastos" />
      <Card className="p-5 sm:p-6">
        <ExpenseForm expense={expense} action={updateExpense.bind(null, id)} />
      </Card>
    </div>
  );
}
