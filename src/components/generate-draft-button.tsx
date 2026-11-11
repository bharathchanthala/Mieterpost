"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateDraft,
  type DraftState,
} from "@/app/messages/[id]/actions";

const initialState: DraftState = { error: null };

export function GenerateDraftButton({
  messageId,
  hasDraft,
}: {
  messageId: number;
  hasDraft: boolean;
}) {
  // useActionState runs the Server Action and tracks its result and whether
  // it is still running (pending), which takes a few seconds for an LLM call.
  const [state, formAction, pending] = useActionState(
    generateDraft.bind(null, messageId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div>
        <Button
          type="submit"
          variant={hasDraft ? "outline" : "default"}
          disabled={pending}
        >
          <Sparkles />
          {pending
            ? "Generating…"
            : hasDraft
              ? "Regenerate draft"
              : "Generate AI draft"}
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
