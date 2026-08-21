"use client";

import { Series, SeriesWriteRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { useSeriesCreate, useSeriesList, useSeriesPartialUpdate } from "@/generated/series/series";
import { FormError } from "@/components/form/FormError";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import {
  Button,
  Form,
  Input,
  Link,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
} from "@heroui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

const emptyValues = (organization: number): SeriesWriteRequest => ({
  name: "",
  synopsis: "",
  organization,
});

export const SeriesManager = ({ organizationId }: { organizationId: number }) => {
  const [editing, setEditing] = useState<Series | null>(null);
  const list = useSeriesList({ organization: organizationId, limit: 100 });
  const create = useSeriesCreate();
  const update = useSeriesPartialUpdate();
  const form = useForm<SeriesWriteRequest>({ defaultValues: emptyValues(organizationId) });

  const { onSubmit, error, isSubmitting, clearError } = useApiFormSubmit(form, async (data) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id.toString(), data });
    } else {
      await create.mutateAsync({ data });
    }
    await list.refetch();
    setEditing(null);
    form.reset(emptyValues(organizationId));
  });

  const edit = (series: Series) => {
    clearError();
    setEditing(series);
    form.reset({
      name: series.name,
      synopsis: series.synopsis ?? "",
      organization: organizationId,
    });
  };

  const cancelEditing = () => {
    clearError();
    setEditing(null);
    form.reset(emptyValues(organizationId));
  };

  const series = list.data?.data.results ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(18rem,2fr)_minmax(18rem,1fr)]">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Registrerte serier</h2>
        {list.isError ? (
          <p role="alert">Seriene kunne ikke hentes. Prøv igjen om litt.</p>
        ) : (
          <Table aria-label="Registrerte serier">
            <TableHeader>
              <TableColumn>Navn</TableColumn>
              <TableColumn>Episoder</TableColumn>
              <TableColumn>Handlinger</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Organisasjonen har ingen serier ennå.">
              {series.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.episodeCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="flat" onPress={() => edit(item)}>
                        Rediger
                      </Button>
                      <Button as={Link} size="sm" variant="light" href={`/series/${item.id}`}>
                        Offentlig side
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">{editing ? `Rediger ${editing.name}` : "Ny serie"}</h2>
        <Form onSubmit={onSubmit} className="space-y-4">
          <FormError error={error} />
          <Input label="Navn" labelPlacement="outside-top" isRequired {...form.register("name")} />
          <Textarea
            label="Beskrivelse"
            labelPlacement="outside-top"
            maxLength={2048}
            {...form.register("synopsis")}
          />
          <div className="flex justify-end gap-2">
            {editing && (
              <Button type="button" variant="light" onPress={cancelEditing}>
                Avbryt
              </Button>
            )}
            <Button type="submit" color="primary" isLoading={isSubmitting}>
              {editing ? "Lagre" : "Opprett serie"}
            </Button>
          </div>
        </Form>
      </section>
    </div>
  );
};
