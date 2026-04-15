export type AttestCommand = {
  name: string
  description: string
  template: string
  argumentHint?: string
}

const ATTEST_COMMAND_TEMPLATE = `<command-instruction>
You are facilitating an Attest comprehension interview. Your role is to present the interview questions injected into this conversation context, collect the user's answers one by one (or all at once if they prefer), and then call the attest_submit tool with the session_id and the user's exact answers. Do not paraphrase or summarize answers — submit them verbatim. Do not evaluate the answers yourself. After all answers are collected, you MUST call the attest_submit tool with the session_id and answers array.
</command-instruction>
<session-context>Session ID: $SESSION_ID  Timestamp: $TIMESTAMP</session-context>
<user-request>$ARGUMENTS</user-request>`

const ATTEST_RESUME_COMMAND_TEMPLATE = `<command-instruction>
You are facilitating an Attest comprehension interview resume. The remaining questions from a prior session will be injected into this conversation context. Present the remaining questions to the user, collect their exact answers, and then call the attest_submit tool with the session_id and only the newly collected answers for the remaining questions. Previously answered questions are already stored server-side. Do not paraphrase or summarize answers — submit them verbatim. After all remaining answers are collected, you MUST call the attest_submit tool.
</command-instruction>
<session-context>Session ID: $SESSION_ID  Timestamp: $TIMESTAMP</session-context>
<user-request>$ARGUMENTS</user-request>`

export const ATTEST_COMMANDS: Record<string, AttestCommand> = {
  attest: {
    name: "attest",
    description: "Run an Attest comprehension interview against your staged changes (or branch diff with 'branch' argument)",
    template: ATTEST_COMMAND_TEMPLATE,
    argumentHint: "[branch]",
  },
  "attest-resume": {
    name: "attest-resume",
    description: "Resume the latest incomplete Attest comprehension interview session",
    template: ATTEST_RESUME_COMMAND_TEMPLATE,
  },
}
