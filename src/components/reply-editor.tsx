"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateReply, type ActionState } from "@/app/messages/[id]/actions";

const initialState: ActionState = { error: null };

export function ReplyEditor({
  messageId,
  body,
  lastSaved,
}: {
  messageId: number;
  body: string;
  lastSaved: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateReply.bind(null, messageId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="reply-body" className="sr-only">
        Reply text
      </label>
      <textarea
        id="reply-body"
        name="body"
        defaultValue={body}
        rows={12}
        required
        maxLength={5000}
        disabled={pending}
        className="w-full rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      />

      <div className="flex flex-wrap items-center gap-2">
        {/* Both buttons submit the same form. The server reads "intent"
            to know which one was pressed. */}
        <Button type="submit" name="intent" value="approve" disabled={pending}>
          <Check />
          {pending ? "Saving…" : "Approve reply"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="save"
          variant="outline"
          disabled={pending}
        >
          Save changes
        </Button>
        <span className="text-xs text-muted-foreground">
          Last saved {lastSaved}
        </span>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
