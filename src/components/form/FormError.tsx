/**
 * Submission errors are announced rather than merely drawn, so screen reader
 * users learn that e.g. a password was rejected.
 */
export const FormError = ({ error }: { error: string | null }) => {
  if (!error) return null;

  return (
    <div
      role="alert"
      className={
        "rounded-medium border border-danger-200 bg-danger-50 px-3 py-2 text-small text-danger-700"
      }
    >
      {error}
    </div>
  );
};
