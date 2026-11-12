"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { retrySending, type ActionState } from "@/app/messages/[id]/actions";

const initialState: ActionState = { error: null };

// Shown while a reply is approved but not sent yet. Normally the workflow
// sends it within a moment; this is the manual fallback.
export function RetrySendingButton({ messageId }: { messageId: number }) {
  const [state, formAction, pending] = useActionState(
    retrySending.bind(null, messageId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          <Send />
          {pending ? "Starting…" : "Retry sending"}
        </Button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
