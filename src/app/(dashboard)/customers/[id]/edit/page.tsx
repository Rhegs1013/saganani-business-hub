import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { CustomerForm } from "../../CustomerForm";
import { updateCustomer } from "../../actions";

export default async function EditCustomerPage(props: PageProps<"/customers/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single();

  if (!customer) notFound();

  return (
    <div>
      <PageHeader title="I-edit ang Customer" subtitle={customer.name} />
      <Card className="p-5 sm:p-6">
        <CustomerForm customer={customer} action={updateCustomer.bind(null, id)} />
      </Card>
    </div>
  );
}
