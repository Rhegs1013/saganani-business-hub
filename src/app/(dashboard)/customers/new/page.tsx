import { PageHeader, Card } from "@/components/ui";
import { CustomerForm } from "../CustomerForm";
import { createCustomer } from "../actions";

export default function NewCustomerPage() {
  return (
    <div>
      <PageHeader title="Bagong Customer" subtitle="Add a customer profile, with delivery location if applicable" />
      <Card className="p-5 sm:p-6">
        <CustomerForm action={createCustomer} />
      </Card>
    </div>
  );
}
