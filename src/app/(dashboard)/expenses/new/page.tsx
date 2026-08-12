import { PageHeader, Card } from "@/components/ui";
import { ExpenseForm } from "../ExpenseForm";
import { createExpense } from "../actions";

export default function NewExpensePage() {
  return (
    <div>
      <PageHeader title="Bagong Gastos" subtitle="Log a new business expense" />
      <Card className="p-5 sm:p-6">
        <ExpenseForm action={createExpense} />
      </Card>
    </div>
  );
}
