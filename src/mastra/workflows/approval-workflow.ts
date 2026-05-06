import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * Human-in-the-loop workflow example.
 *
 * The workflow generates a response, suspends for human review,
 * then either publishes it (resume) or rejects it (bail).
 */

// ---------- Step 1: Generate a draft response ----------

const generateDraft = createStep({
  id: 'generate-draft',
  description: 'Generates a draft response for the user query',
  inputSchema: z.object({
    query: z.string().describe('The user query to respond to'),
  }),
  outputSchema: z.object({
    draft: z.string(),
    query: z.string(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    feedback: z.string().optional(),
  }),
  suspendSchema: z.object({
    reason: z.string(),
    draft: z.string(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    const { query } = inputData;

    // Check if we are resuming with human feedback
    if (resumeData) {
      const { approved, feedback } = resumeData;

      if (!approved) {
        return suspend({
          reason: 'Draft was previously rejected by reviewer.',
          draft: `Query: "${query}" (rejected)`,
        });
      }

      return {
        draft: feedback
          ? `Revised draft for "${query}" (reviewer feedback: ${feedback})`
          : `Published: ${query}`,
        query,
      };
    }

    // First run — generate a simple draft and wait for approval
    const draft = `Draft response for: "${query}"`;

    return suspend({
      reason: 'Human approval required before publishing.',
      draft,
    });
  },
});

// ---------- Step 2: Publish (only reached after approval) ----------

const publish = createStep({
  id: 'publish',
  description: 'Publishes the approved draft',
  inputSchema: z.object({
    draft: z.string(),
    query: z.string(),
  }),
  outputSchema: z.object({
    published: z.string(),
    status: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      published: inputData.draft,
      status: 'published',
    };
  },
});

// ---------- Workflow ----------

const approvalWorkflow = createWorkflow({
  id: 'approval-workflow',
  inputSchema: z.object({
    query: z.string().describe('The query to generate a response for'),
  }),
  outputSchema: z.object({
    published: z.string(),
    status: z.string(),
  }),
})
  .then(generateDraft)
  .then(publish);

approvalWorkflow.commit();

export { approvalWorkflow };
