import { Suspense } from "react";
import { LoadingText, PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProperties } from "@/db/queries";
import { formatEuro, formatNumber } from "@/lib/format";

async function PropertyList() {
  const properties = await getProperties();

  return (
    <div className="flex flex-col gap-6">
      {properties.map((property) => (
        <Card key={property.id}>
          <CardHeader>
            <CardTitle>{property.name}</CardTitle>
            <CardDescription>
              {property.street}, {property.postalCode} {property.city}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Rooms</TableHead>
                  <TableHead className="text-right">Area</TableHead>
                  <TableHead className="text-right">Base rent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {property.units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.label}</TableCell>
                    <TableCell>
                      {unit.tenants.length > 0
                        ? unit.tenants
                            .map((t) => `${t.firstName} ${t.lastName}`)
                            .join(", ")
                        : "Vacant"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(unit.rooms)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(unit.areaSqm)} m²
                    </TableCell>
                    <TableCell className="text-right">
                      {formatEuro(unit.coldRentCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <>
      <PageHeader title="Properties" description="Buildings and their units" />
      <Suspense fallback={<LoadingText>Loading properties…</LoadingText>}>
        <PropertyList />
      </Suspense>
    </>
  );
}
