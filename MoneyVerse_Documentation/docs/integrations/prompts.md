# Versioned LLM Prompts

LLM features are disabled by default. This file contains no provider secrets.

## Prompt registry format

Each prompt must include:

- Stable ID and version
- Status
- Feature flag
- Allowed age bands
- Purpose
- Input schema
- Output schema
- Maximum input and output size
- Allowed context
- Forbidden behavior
- Human-review requirement
- Safety test cases
- Change history

## `story-generator/v1`

Status: Disabled  
Feature flag: `AI_STORY_GENERATION_ENABLED`

Purpose: Produce a schema-constrained variation of an approved educational scenario.

Forbidden:

- Personalized financial advice
- Real security recommendations
- Requests for personal or banking information
- Consequential actions
- Publishing without required review
- Contacting children
- Tool calls

## `parent-summary/v1`

Status: Disabled  
Purpose: Rephrase approved progress data into a concise adult-facing summary.

Only minimized educational metrics may be supplied. No child free text, financial-account details, secrets, or unrelated records.
