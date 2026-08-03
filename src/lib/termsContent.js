/**
 * Single source of truth for the in-app Terms and Conditions.
 *
 * Adapted from the Terms and Conditions draft (v1.0, June 2026) with
 * CATTAC branding and an explicit account-deletion clause (§8.4). Plain
 * data only — components render it; wording is never duplicated in JSX.
 *
 * The DELETION_CLAUSE is surfaced prominently at sign-up and again in the
 * Settings delete-account panel; the full sections are optional reading.
 */

export const TERMS_VERSION = "1.1 (Draft)";

export const DELETION_CLAUSE =
    "If you delete your account, your profile and sign-in are permanently removed, " +
    "but classroom recordings, transcripts, and talk analytics you produced are " +
    "program records: they are preserved on the platform, remain attributed to " +
    "your name, and are not deleted with your account.";

export const TERMS_SECTIONS = Object.freeze([
    {
        heading: "Draft status",
        body: "This document is an engineering draft for stakeholder and legal review. It is not binding and must not be used for external distribution until qualified counsel and institutional approvers sign off.",
    },
    {
        heading: "1. Acceptance of terms",
        body: 'By creating an account, signing in, or using the CATTAC platform ("Platform"), you agree to these Terms and Conditions ("Terms"). If you do not agree, do not use the Platform.',
    },
    {
        heading: "2. Eligibility and accounts",
        body: "Accounts are issued to program administrators, teachers, coaches, and parents participating in authorized early childhood programs. You must provide accurate registration information and keep credentials confidential; you are responsible for activity under your account. Parents may register only through valid invitation links issued by the program.",
    },
    {
        heading: "3. Permitted use",
        body: "Use the Platform only for legitimate educational assessment, recording, and collaboration related to enrolled children. Administrators and teachers may manage schools, classrooms, and recordings according to their assigned roles. Coaches may view classroom data only under grants approved by teachers or administrators. Parents may view and contribute data only for their own linked children.",
    },
    {
        heading: "4. Prohibited conduct",
        body: "You must not: access or attempt to access another user's data without authorization; upload unlawful, abusive, or unrelated content; interfere with Platform security or availability; reverse engineer or scrape the service except as permitted by law; or share login credentials or invitation links publicly.",
    },
    {
        heading: "5. Child data privacy and confidentiality",
        body: "The Platform processes sensitive information about children, including audio recordings, transcripts, and developmental analytics. Users must treat all child data as confidential and use it only for educational purposes within the program. Parents may access full assessment data only for their own children; teachers may access child data only for children they supervise or for whom an active access grant exists; administrators may access data as required for program operation. Classroom rosters may display children's names to enrolled parents and staff; full records remain role-scoped.",
    },
    {
        heading: "6. Data collection and use",
        body: "The Platform collects account information, child profiles, audio recordings, transcripts, location and activity labels, and usage metadata necessary to operate the service. Audio is processed to produce transcripts and keyword or semantic analyses for developmental tracking. Aggregated or de-identified statistics may be used for program evaluation and research only as permitted by program policy and applicable law.",
    },
    {
        heading: "7. Third-party services",
        body: "The Platform relies on external providers for speech transcription, optional AI-based analysis, email delivery, and cloud hosting. Data sent to those providers is limited to what is required for the requested feature; provider terms and security practices apply to their processing. The program does not sell child personal information to third parties for marketing.",
    },
    {
        heading: "8. Data retention and deletion",
        body:
            "Transcripts are associated with an expiry date (currently 365 days after the recording date) after which transcript text may be purged from active storage while other assessment metadata may remain. In-app notifications expire automatically after a short retention window (approximately ten days). Teachers and coaches may delete their own account from Settings at any time. " +
            DELETION_CLAUSE +
            " Broader data deletion requests are handled according to program policy and applicable law; contact the program administrator.",
    },
    {
        heading: "9. Usability testing and research participation",
        body: "Participation in moderated usability sessions is voluntary and separate from routine Platform use. See the Usability Testing Protocol for consent procedures, recording policies, and participant rights before conducting or joining a session.",
    },
    {
        heading: "10. Disclaimer of warranties",
        body: 'THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING FITNESS FOR A PARTICULAR PURPOSE. TRANSCRIPTION AND ANALYSIS MAY CONTAIN ERRORS; HUMAN REVIEW IS REQUIRED BEFORE RELYING ON ASSESSMENTS.',
    },
    {
        heading: "11. Limitation of liability",
        body: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE PROGRAM OPERATORS AND TECHNOLOGY PROVIDERS ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM USE OF THE PLATFORM. DIRECT LIABILITY IS LIMITED AS SET BY APPLICABLE LAW AND PROGRAM AGREEMENTS.",
    },
    {
        heading: "12. Changes to terms",
        body: "These Terms may be updated. Material changes will be communicated through program channels. Continued use after notice constitutes acceptance where permitted by law.",
    },
    {
        heading: "13. Contact",
        body: "For questions about these Terms or data practices, contact your program administrator or the Anita Zucker Center / Bainum Foundation project lead.",
    },
]);
