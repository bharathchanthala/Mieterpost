"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

// Shown instead of a crashed page, e.g. when PostgreSQL is not running.
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageHeader
        title="Something went wrong"
        description="The data could not be loaded. Is the database running?"
      />
      <div>
        <Button variant="outline" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </>
  );
}
