"use client";

import { NewSeriesModal } from "@/app/organization/[organizationId]/create/NewSeriesModal";
import { useSeriesList } from "@/generated/series/series";
import { Button, Table } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";

export const SeriesManager = ({ organizationId }: { organizationId: number }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const list = useSeriesList({ organization: organizationId, limit: 100 });

  const series = list.data?.data.results ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Registrerte serier</h2>
        <Button onPress={() => setModalOpen(true)} variant="primary">
          Ny serie
        </Button>
      </div>
      {list.isError ? (
        <p role="alert">Seriene kunne ikke hentes. Prøv igjen om litt.</p>
      ) : (
        <Table aria-label="Registrerte serier">
          <Table.Content>
            <Table.Header>
              <Table.Column isRowHeader>Navn</Table.Column>
              <Table.Column>Episoder</Table.Column>
              <Table.Column>Handlinger</Table.Column>
            </Table.Header>
            <Table.Body
              renderEmptyState={() => (
                <div className="py-6 text-center">Organisasjonen har ingen serier ennå.</div>
              )}
            >
              {series.map((item) => (
                <Table.Row key={item.id} id={item.id}>
                  <Table.Cell>{item.name}</Table.Cell>
                  <Table.Cell>{item.episodeCount}</Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="inline-flex h-8 items-center rounded-medium bg-default-100 px-3 text-sm font-medium transition-colors hover:bg-default-200"
                        href={`/organization/${organizationId}/series/${item.id}`}
                      >
                        Rediger
                      </Link>
                      <Link
                        className="inline-flex h-8 items-center rounded-medium px-3 text-sm font-medium transition-colors hover:bg-default-100"
                        href={`/series/${item.id}`}
                      >
                        Offentlig side
                      </Link>
                    </div>
                  </Table.Cell>
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
