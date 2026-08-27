import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVideosDestroy, useVideosList } from "@/generated/videos/videos";
import { VideosListParams } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatApiError } from "@/lib/formatApiError";
import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import Link from "next/link";
import { Alert } from "@heroui/alert";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale/nb";

export const OutstandingVideosList = ({ organizationId }: { organizationId: number }) => {
  const queryClient = useQueryClient();
  const destroy = useVideosDestroy();
  const [error, setError] = useState<string>();
  const { data } = useVideosList({
    organization: organizationId,
    // Snake_case, like every other video filter: query parameters are not
    // camelized on the wire, only request bodies are. `false` now selects
    // the unfinished videos rather than lifting the filter, so the server
    // returns exactly this list. The cast goes away once the schema is
    // regenerated -- until then VideosListParams has no such field.
    proper_import: false,
  } as unknown as VideosListParams);
  // Redundant while the parameter above lands, but it is behind a cast and
  // therefore not type-checked; a silently ignored filter would otherwise
  // show every video under a "you have unimported videos" warning.
  const videos = data?.data.results.filter((v) => !v.properImport) ?? [];

  const remove = async (id: number, name: string) => {
    if (!window.confirm(`Slett den uimporterte videoen «${name}»?`)) return;

    setError(undefined);
    try {
      await destroy.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    } catch (cause) {
      setError(formatApiError(cause));
    }
  };

  return (
    <div className={"space-y-4"}>
      {!!videos.length && (
        <>
          <Alert color="warning">
            <h2 className={"font-bold"}>Du har uimporterte videoer</h2>
            <p>Du har opprettet de følgende videoene uten at en import er blitt ferdigstilt.</p>
            <p>
              Om du ønsker å prøve på nytt å laste opp en original, trykk &laquo;last opp&raquo;.
            </p>
            <p>Om videoen er blitt igjen ved en feil, slett den gjerne.</p>
          </Alert>

          <Table aria-label="Ufullstendige videoer">
            <TableHeader>
              <TableColumn>Navn</TableColumn>
              <TableColumn>Dato</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Handlinger</TableColumn>
            </TableHeader>
            <TableBody>
              {videos.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    {r.createdTime
                      ? format(parseISO(r.createdTime), "PPPPpp", { locale: nb })
                      : "unknown"}
                  </TableCell>
                  <TableCell>
                    <Chip>feil eller ikke importert</Chip>
                  </TableCell>
                  <TableCell className={"space-x-2"}>
                    <Button
                      color="danger"
                      size="sm"
                      isLoading={destroy.isPending && destroy.variables?.id === r.id}
                      onPress={() => remove(r.id, r.name)}
                    >
                      Slett
                    </Button>
                    <Button as={Link} href={`/video/${r.id}/upload`} color="primary" size="sm">
                      Last opp
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {error && (
            <p role="alert" className="text-danger-700 text-sm">
              Videoen kunne ikke slettes: {error}
            </p>
          )}
        </>
      )}
    </div>
  );
};
