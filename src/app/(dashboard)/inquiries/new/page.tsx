import { PageHeader, Card } from "@/components/ui";
import { InquiryForm } from "../InquiryForm";
import { createInquiry } from "../actions";

export default function NewInquiryPage() {
  return (
    <div>
      <PageHeader title="Bagong Tanong / Lead" subtitle="Log an inquiry from Facebook, TikTok, or a direct message" />
      <Card className="p-5 sm:p-6">
        <InquiryForm action={createInquiry} />
      </Card>
    </div>
  );
}
