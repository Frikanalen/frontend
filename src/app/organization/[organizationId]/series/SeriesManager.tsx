"use client";

import { NewSeriesModal } from "@/app/organization/[organizationId]/create/NewSeriesModal";
import { useSeriesList } from "@/generated/series/series";
import { Button, Table } from "@heroui/react";
import Link from "next/link";
import { StudioHeader } from "@/app/organization/[organizationId]/StudioHeader";
import { useState } from "react";

export const SeriesManager = ({ organizationId }: { organizationId: number }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const list = useSeriesList({ organization: organizationId, limit: 100 });

  const series = list.data?.data.results ?? [];

  return (
    <section>
      <StudioHeader
        title="Serier"
        intro="Samle videoer som hører sammen, så seerne finner dem i rekkefølge."
        action={
          <Button onPress={() => setModalOpen(true)} variant="primary">
            Ny serie
          </Button>
        }
      />
      {list.isError ? (
        <p role="alert">Seriene kunne ikke hentes. Prøv igjen om litt.</p>
      ) : (
        <Table aria-label="Serier">
          <Table.Content>
            <Table.Header>
              <Table.Column isRowHeader>Navn</Table.Column>
              <Table.Column>Episoder</Table.Column>
            </Table.Header>
            <Table.Body
              renderEmptyState={() => (
                <div className="py-6 text-center">Organisasjonen har ingen serier ennå.</div>
              )}
            >
              {series.map((item) => (
                <Table.Row key={item.id} id={item.id}>
                  <Table.Cell>
                    <Link
                      className="font-semibold text-link hover:underline"
                      href={`/organization/${organizationId}/series/${item.id}`}
                    >
                      {item.name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{item.episodeCount}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table>
      )}
      <NewSeriesModal
        organizationId={organizationId}
        isOpen={isModalOpen}
        onOpenChange={setModalOpen}
        onCreated={() => void list.refetch()}
      />
    </section>
  );
};
