import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GenerateDraftButton } from "@/components/generate-draft-button";
import { LoadingText } from "@/components/page-header";
import { ReplyEditor } from "@/components/reply-editor";
import {
  CategoryBadge,
  StatusBadge,
  UrgencyBadge,
} from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getMessage } from "@/db/queries";
import {
  formatDate,
  formatDateTime,
  formatEuro,
  formatNumber,
  replyStatusLabels,
} from "@/lib/format";

// One label/value line in the side cards.
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

async function MessageDetail({ params }: PageProps<"/messages/[id]">) {
  // The [id] folder name becomes params.id. URL values are always strings.
  const { id } = await params;
  const messageId = Number(id);
  // Anything that is not a positive whole number cannot be a valid id.
  if (!Number.isInteger(messageId) || messageId < 1) notFound();

  const message = await getMessage(messageId);
  if (!message) notFound();

  const { tenant, reply } = message;
  // Once approved (or sent), the reply can no longer be edited or regenerated.
  const isLocked = reply ? reply.status !== "draft" : false;
  const { unit } = tenant;
  const { property } = unit;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{message.subject}</CardTitle>
            <CardDescription>
              From {tenant.firstName} {tenant.lastName} ·{" "}
              {formatDateTime(message.receivedAt)}
            </CardDescription>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <StatusBadge status={message.status} />
              <CategoryBadge category={message.category} />
              <UrgencyBadge urgency={message.urgency} />
            </div>
          </CardHeader>
          <Separator />
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.body}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {isLocked ? "Reply" : "AI draft reply"}
            </CardTitle>
            <CardDescription>
              {message.summary ??
                "Let the agent classify this message and draft a reply in German."}
            </CardDescription>
            {reply ? (
              <CardAction>
                <Badge variant={isLocked ? "default" : "secondary"}>
                  {replyStatusLabels[reply.status]}
                </Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {reply && isLocked ? (
              // Approved replies are final: plain text, no form.
              <>
                <p className="whitespace-pre-wrap rounded-lg bg-muted/60 p-4 leading-relaxed">
                  {reply.body}
                </p>
                <p className="text-xs text-muted-foreground">
                  Approved on {formatDateTime(reply.updatedAt)}
                </p>
              </>
            ) : null}

            {reply && !isLocked ? (
              // The key changes whenever the reply is saved or regenerated,
              // which makes React rebuild the form with the latest text.
              <ReplyEditor
                key={reply.updatedAt.toISOString()}
                messageId={message.id}
                body={reply.body}
                lastSaved={formatDateTime(reply.updatedAt)}
              />
            ) : null}

            {!isLocked ? (
              <GenerateDraftButton
                messageId={message.id}
                hasDraft={Boolean(reply)}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2">
              <Detail
                label="Name"
                value={`${tenant.firstName} ${tenant.lastName}`}
              />
              <Detail label="Email" value={tenant.email} />
              <Detail label="Phone" value={tenant.phone ?? "–"} />
              <Detail label="Move-in" value={formatDate(tenant.moveInDate)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unit</CardTitle>
            <CardDescription>
              {property.street}, {property.postalCode} {property.city}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2">
              <Detail label="Property" value={property.name} />
              <Detail label="Unit" value={unit.label} />
              <Detail label="Rooms" value={formatNumber(unit.rooms)} />
              <Detail
                label="Area"
                value={`${formatNumber(unit.areaSqm)} m²`}
              />
              <Detail
                label="Base rent"
                value={formatEuro(unit.coldRentCents)}
              />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MessagePage(props: PageProps<"/messages/[id]">) {
  return (
    <>
      <div>
        <Link
          href="/"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft />
          Back to inbox
        </Link>
      </div>
      <Suspense fallback={<LoadingText>Loading message…</LoadingText>}>
        <MessageDetail {...props} />
      </Suspense>
    </>
  );
}
