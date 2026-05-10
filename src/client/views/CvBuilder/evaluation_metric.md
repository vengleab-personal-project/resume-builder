# AI Candidate CV Evaluation Rubric

## Purpose

This rubric is designed for an AI Agent to evaluate candidate CVs consistently before deciding whether to move a candidate to the interview stage.

---

# Evaluation Framework

## Overall Scoring Model

| Category                   | Weight | Max Score |
| -------------------------- | ------ | --------- |
| Role Match                 | 25%    | 25        |
| Skills Match               | 20%    | 20        |
| Experience Quality         | 15%    | 15        |
| Achievements & Impact      | 15%    | 15        |
| Career Stability           | 10%    | 10        |
| Communication & CV Quality | 10%    | 10        |
| Education & Certifications | 5%     | 5         |
| Total                      | 100%   | 100       |

---

# 1. Role Match (0–25)

## Objective

Determine how closely the candidate’s experience aligns with the target role.

## Evaluation Criteria

| Score | Description                                                       |
| ----- | ----------------------------------------------------------------- |
| 21–25 | Strong alignment with target role, industry, and responsibilities |
| 16–20 | Mostly aligned with minor gaps                                    |
| 11–15 | Partial relevance but transferable experience exists              |
| 6–10  | Limited relevance                                                 |
| 0–5   | Poor or unrelated background                                      |

## AI Evaluation Prompts

* Does the candidate have similar job titles?
* Has the candidate worked in a related domain?
* Are responsibilities similar to the job description?
* Is seniority level aligned?

## Example Signals

### Positive

* Backend Engineer applying for Backend Engineer role
* Experience in same industry/domain
* Similar project ownership

### Negative

* Unrelated experience
* Large mismatch in seniority
* No evidence of relevant responsibilities

---

# 2. Skills Match (0–20)

## Objective

Evaluate technical and functional skills against job requirements.

## Evaluation Criteria

| Score | Description                                    |
| ----- | ---------------------------------------------- |
| 17–20 | Strong match for required and preferred skills |
| 13–16 | Good match with few missing skills             |
| 9–12  | Moderate match                                 |
| 5–8   | Weak match                                     |
| 0–4   | Major skill gaps                               |

## AI Evaluation Prompts

* Are required technologies/tools present?
* How many must-have skills match?
* Are skills recent and actively used?
* Is depth or breadth demonstrated?

## Example Signals

### Positive

* Mentions modern frameworks/tools
* Demonstrates architecture or advanced usage
* Includes certifications or portfolio

### Negative

* Keyword stuffing without context
* Outdated technology only
* Missing core required skills

---

# 3. Experience Quality (0–15)

## Objective

Measure depth, complexity, and relevance of
