/** The query parameter that opens the declaration dialog on Kom i gang. */
export const AFFIDAVIT_PARAM = "erklaering";

/** Where to send someone to fill in and upload the declaration. */
export const affidavitHref = (organizationId: number) =>
  `/organization/${organizationId}/start?${AFFIDAVIT_PARAM}`;
