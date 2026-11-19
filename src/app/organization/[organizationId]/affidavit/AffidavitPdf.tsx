import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { AFFIDAVIT_CLAUSES, AFFIDAVIT_INTRO } from "@/app/about/join/affidavit/clauses";

/** What the organization has told us, as it goes on the paper. Null: a blank. */
export type AffidavitDetails = {
  organization: string;
  orgnr: string | null;
  address: string | null;
  email: string | null;
  editorName: string | null;
};

// Its default hyphenation is English and splits Norwegian words badly.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.4,
  },
  title: { fontFamily: "Helvetica-Bold", fontSize: 18, marginBottom: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  cell: { width: "50%", marginBottom: 10, paddingRight: 12 },
  wide: { width: "100%", marginBottom: 10 },
  label: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 2 },
  blank: { borderBottomWidth: 0.75, borderBottomColor: "#000", height: 14 },
  intro: { marginBottom: 8 },
  clause: { flexDirection: "row", marginBottom: 6 },
  number: { width: 20 },
  clauseText: { flex: 1 },
  link: { color: "#000" },
  signing: { marginTop: 24, flexDirection: "row", gap: 18 },
  line: { flex: 1 },
  signature: { flex: 2 },
  footer: { position: "absolute", bottom: 32, left: 56, right: 56, fontSize: 8, color: "#555" },
});

const Field = ({ label, value, wide }: { label: string; value: string | null; wide?: boolean }) => (
  <View style={wide ? styles.wide : styles.cell}>
    <Text style={styles.label}>{label}</Text>
    {value ? <Text>{value}</Text> : <View style={styles.blank} />}
  </View>
);

const Line = ({ label, wide }: { label: string; wide?: boolean }) => (
  <View style={wide ? styles.signature : styles.line}>
    <View style={[styles.blank, { height: 28 }]} />
    <Text style={styles.label}>{label}</Text>
  </View>
);

/**
 * The editor's declaration, filled in with the organization's details, as an
 * A4 page to print, sign, scan and upload. The clauses are the published text.
 */
export const AffidavitPdf = ({ details }: { details: AffidavitDetails }) => (
  <Document title={`Redaktøransvar – ${details.organization}`} author="Frikanalen" language="no">
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Redaktøransvar – Frikanalen</Text>
      <View style={styles.grid}>
        <Field label="Organisasjon" value={details.organization} />
        <Field label="Org.nr." value={details.orgnr} />
        <Field label="Adresse" value={details.address} />
        <Field label="E-post" value={details.email} />
        <Field label="Redaktørens navn i blokkbokstaver" value={details.editorName} wide />
      </View>
      <Text style={styles.intro}>{AFFIDAVIT_INTRO}</Text>
      {AFFIDAVIT_CLAUSES.map((clause, index) => (
        <View key={index} style={styles.clause} wrap={false}>
          <Text style={styles.number}>{index + 1}.</Text>
          <Text style={styles.clauseText}>
            {typeof clause === "string" ? (
              clause
            ) : (
              <>
                {clause.before}
                <Link src={clause.link.href} style={styles.link}>
                  {clause.link.text}
                </Link>
                {clause.after}
              </>
            )}
          </Text>
        </View>
      ))}
      <View style={styles.signing} wrap={false}>
        <Line label="Sted" />
        <Line label="Dato" />
        <Line label="Redaktørens signatur" wide />
      </View>
      <Text style={styles.footer} fixed>
        Skann den signerte erklæringen og last den opp på Frikanalen under Kom i gang.
      </Text>
    </Page>
  </Document>
);
