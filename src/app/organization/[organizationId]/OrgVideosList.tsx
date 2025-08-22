import { OrgVideoListTable } from "@/app/organization/[organizationId]/OrgVideoListTable";
import { useVideosList } from "@/generated/videos/videos";

export const OrgVideosList = ({ organizationId }: { organizationId: number }) => {
  const { data: videos } = useVideosList({ organization: organizationId });

  return (
    <div>
      <h2>Videoer</h2>
      <OrgVideoListTable videos={videos?.data.results} />
    </div>
  );
};
