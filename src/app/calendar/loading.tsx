import { PageSpinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="p-6 lg:p-8">
      <PageSpinner />
    </div>
  );
}
