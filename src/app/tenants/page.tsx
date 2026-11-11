import { Suspense } from "react";
import { LoadingText, PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTenants } from "@/db/queries";
import { formatDate } from "@/lib/format";

async function TenantTable() {
  const tenants = await getTenants();

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="pr-4 text-right">Move-in</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="pl-4 font-medium">
                {tenant.firstName} {tenant.lastName}
              </TableCell>
              <TableCell>{tenant.email}</TableCell>
              <TableCell>{tenant.phone ?? "–"}</TableCell>
              <TableCell>
                {tenant.unit.property.name} · {tenant.unit.label}
              </TableCell>
              <TableCell className="pr-4 text-right">
                {formatDate(tenant.moveInDate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default function TenantsPage() {
  return (
    <>
      <PageHeader title="Tenants" description="All current tenancies" />
      <Suspense fallback={<LoadingText>Loading tenants…</LoadingText>}>
        <TenantTable />
      </Suspense>
    </>
  );
}
