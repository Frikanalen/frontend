import { SimpleOrg } from "@/generated/frikanalenDjangoAPI.schemas";
import cx from "classnames";
import { GoCalendar, GoGear, GoGlobe, GoPlus } from "react-icons/go";
import { ActionLink } from "@/app/profile/ActionLink";

export type Membership = SimpleOrg & { isEditor: boolean };

/**
 * The role as a badge rather than a sentence. "Du er medlem av denne
 * organisasjonen", repeated once per row, is a lot of words carrying one bit
 * of information — and that bit, which of the two roles you hold, was the
 * part buried mid-sentence.
 */
const RoleBadge = ({ isEditor }: { isEditor: boolean }) => (
  <span
    className={cx(
      "rounded-full px-2.5 py-0.5 text-xs font-medium",
      isEditor ? "bg-primary-100 text-primary-800" : "bg-default-100 text-default-800",
    )}
  >
    {isEditor ? "Redaktør" : "Medlem"}
  </span>
);

/**
 * One organization and the four things you can do with it.
 *
 * Only "Ny video" is solid. All four used to be the same green pill, which on
 * an account with three organizations put twelve identically weighted buttons
 * on one screen and left nothing for the eye to land on — so the action the
 * platform exists for leads, and the rest stay quiet but legible.
 */
export const OrganizationCard = ({ organization }: { organization: Membership }) => {
  const { id, name, isEditor } = organization;

  return (
    <li className="border-default-200 bg-content1/40 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-lg leading-tight font-semibold">{name}</h3>
        <RoleBadge isEditor={isEditor} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1">
        <ActionLink href={`/organization/${id}/create`} variant="solid" icon={<GoPlus />}>
          Ny video
        </ActionLink>
        <ActionLink href={`/organization/${id}/schedule`} icon={<GoCalendar />}>
          Programmer sendeplan
        </ActionLink>
        <ActionLink href={`/organization/${id}/admin`} icon={<GoGear />}>
          Administrasjon
        </ActionLink>
        <ActionLink href={`/organization/${id}`} icon={<GoGlobe />}>
          Offentlig side
        </ActionLink>
      </div>
    </li>
  );
};
