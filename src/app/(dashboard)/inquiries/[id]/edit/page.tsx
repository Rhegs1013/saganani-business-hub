import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { InquiryForm } from "../../InquiryForm";
import { updateInquiry } from "../../actions";

export default async function EditInquiryPage(props: PageProps<"/inquiries/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: inquiry } = await supabase.from("inquiries").select("*").eq("id", id).single();

  if (!inquiry) notFound();

  return (
    <div>
      <PageHeader title="I-edit ang Tanong" />
      <Card className="p-5 sm:p-6">
        <InquiryForm inquiry={inquiry} action={updateInquiry.bind(null, id)} />
      </Card>
    </div>
  );
}
