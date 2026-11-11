import { Suspense } from "react";
import Link from "next/link";
import { LoadingText, PageHeader } from "@/components/page-header";
import {
  CategoryBadge,
  StatusBadge,
  UrgencyBadge,
} from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { getInbox } from "@/db/queries";
import { formatDateTime } from "@/lib/format";

async function Inbox() {
  const inbox = await getInbox();

  if (inbox.length === 0) {
    return (
      <LoadingText>
        No messages yet. Run <code>npm run db:seed</code>.
      </LoadingText>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <ul className="divide-y">
        {inbox.map((message) => (
          <li key={message.id}>
            {/* The whole row is a link to /messages/<id>. */}
            <Link
              href={`/messages/${message.id}`}
              className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">
                  {message.tenant.firstName} {message.tenant.lastName}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(message.receivedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="truncate">{message.subject}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <UrgencyBadge urgency={message.urgency} />
                  <CategoryBadge category={message.category} />
                  <StatusBadge status={message.status} />
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {message.tenant.unit.property.name} · {message.tenant.unit.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function InboxPage() {
  return (
    <>
      <PageHeader
        title="Inbox"
        description="Messages from your tenants"
      />
      <Suspense fallback={<LoadingText>Loading messages…</LoadingText>}>
        <Inbox />
      </Suspense>
    </>
  );
}
