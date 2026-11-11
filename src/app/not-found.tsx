import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";

// Shown for unknown URLs and whenever a page calls notFound().
export default function NotFound() {
  return (
    <>
      <PageHeader
        title="Not found"
        description="This page or message does not exist."
      />
      <div>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go to inbox
        </Link>
      </div>
    </>
  );
}
