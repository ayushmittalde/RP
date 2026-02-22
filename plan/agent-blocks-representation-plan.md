# Representation Plan: Agent Blocks Feature — AutoGPT Platform

---

## Section 1: Documentation Analysis Summary

**Source:** `docs/content/platform/agent-blocks.md`  
**Feature:** How to Create an AI Agent as a Block in AutoGPT

---

### 1.1 Functional Requirements

| ID    | Requirement Description |
|-------|------------------------|
| FR-01 | The user shall be able to add an Input Block to the Builder canvas. |
| FR-02 | The user shall be able to add an AI Text Generator Block to the Builder canvas. |
| FR-03 | The user shall be able to add an Output Block to the Builder canvas. |
| FR-04 | The user shall be able to connect the Input Block's result to the AI Text Generator Block's Prompt. |
| FR-05 | The user shall be able to connect the AI Text Generator Block's response to the Output Block's value. |
| FR-06 | The user shall be able to name the Input Block (e.g., "question"). |
| FR-07 | The user shall be able to name the Output Block (e.g., "answer"). |
| FR-08 | The user shall be able to save the agent with a descriptive name (e.g., "Weather Agent"). |
| FR-09 | The user shall be able to access the Block Menu from the Builder interface. |
| FR-10 | The Block Menu shall display agent blocks, findable by agent tag or by searching the agent's name. |
| FR-11 | The user shall be able to click on an agent block in the Block Menu to add it to the current workflow. |
| FR-12 | The user shall be able to save the new agent (containing the agent block) with a descriptive name. |
| FR-13 | The user shall be able to enter a test input and run the agent. |
| FR-14 | The system shall display results in the "Agent Outputs" section after execution. |
| FR-15 | The user shall be able to click "View More" for detailed results. |
| FR-16 | The user shall be able to combine multiple agent blocks to create more complex workflows. |
| FR-17 | The user shall be able to chain different agents together for sophisticated workflows. |

---

### 1.2 Non-Functional Requirements

| ID     | Requirement Description |
|--------|------------------------|
| NFR-01 | Agent blocks shall be reusable across different workflows and contexts. |
| NFR-02 | Agent blocks shall be modular — each block is a complete, standalone workflow. |
| NFR-03 | Agent blocks shall be shareable with other users. |

---

### 1.3 Business Rules & Constraints

| ID   | Rule Description |
|------|-----------------|
| BR-01 | An agent block requires at minimum three components: Input Block, AI Text Generator Block, and Output Block. |
| BR-02 | Input's result must be connected to AI Text Generator's Prompt for the agent to function. |
| BR-03 | AI Text Generator's response must be connected to Output's value for results to appear. |
| BR-04 | If there is no Output Block, the "Agent Outputs" button will show up blank; results are still viewable via "View More" or at the bottom of the block. |
| BR-05 | Agent blocks accept specific inputs and produce defined outputs — their interface is determined by the Input and Output block names. |
| BR-06 | Agent blocks support hierarchical composition — an agent block can itself contain other agent blocks. |

---

### 1.4 Actors, Inputs, Outputs, and System States

**Actors:**
- **User** — the primary actor interacting with the AutoGPT Builder UI.
- **AutoGPT Platform (Builder)** — the system that provides the canvas, block library, connection engine, execution runtime, and results display.

**Inputs:**
- Block addition actions (Input Block, AI Text Generator Block, Output Block)
- Connection actions between block ports
- Naming actions for Input and Output blocks
- Agent save action (with descriptive name)
- Block Menu navigation and search actions
- Agent block selection/click to add to workflow
- Test input entry (e.g., a question)
- Run action

**Outputs:**
- Canvas with placed blocks
- Visual connections between blocks
- Saved agent (base agent)
- Agent block available in Block Menu
- Agent block placed in a new workflow
- Execution results in "Agent Outputs" section
- Detailed results via "View More"

**System States:**
1. **Builder Canvas Empty** — no blocks placed
2. **Blocks Placed** — Input, AI Text Generator, and Output blocks added to canvas
3. **Blocks Connected** — ports wired (Input→AI Text Generator→Output)
4. **Blocks Named** — Input and Output blocks given descriptive names
5. **Base Agent Saved** — agent persisted with a name
6. **Block Menu Open** — user browsing available blocks
7. **Agent Block Located** — agent found via tag or search in Block Menu
8. **Agent Block Added to Workflow** — block placed on a new agent's canvas
9. **New Agent Saved** — the agent containing the agent block is saved
10. **Agent Running** — test input submitted, execution in progress
11. **Results Available** — execution complete, results viewable

---

### 1.5 Preconditions

- The user is authenticated and has access to the AutoGPT Builder interface.
- The Builder canvas is loaded and available.
- Three block types (Input, AI Text Generator, Output) are available in the block library.

---

### 1.6 Postconditions

- A base agent is saved and accessible.
- The saved agent is available as a block in the Block Menu.
- The agent block can be added to other workflows.
- When run with test input, the agent produces viewable results.

---

### 1.7 Edge Cases (Documented Scope Only)

> Only edge cases implied or explicitly stated in the documentation are noted; no requirements are invented.

| ID   | Edge Case Description |
|------|----------------------|
| EC-01 | **No Output Block present:** The "Agent Outputs" button shows blank. Results are still accessible via "View More" or at the bottom of the block. (Explicitly documented.) |
| EC-02 | **Hierarchical/nested agent blocks:** Agent blocks can be used within other agent blocks, enabling recursive composition. (Implied by "more complex agents by combining multiple agent blocks.") |
| EC-03 | **Search for agent block:** The agent block must be findable by agent tag or by name search. If the agent name or tag is incorrect, the user may not find the block. |

---

## Section 2: Evaluation of Possible Representations

| Representation | Suitability | Test Case Derivation | Traceability | Verdict |
|---|---|---|---|---|
| **Flowchart / Activity Diagram** | High — the documentation describes a clear multi-phase sequential procedure (Create → Convert → Test → Advanced) | Excellent — each step and each phase transition becomes a test step | High — steps labeled with FR-IDs | ✅ Recommended (Mermaid `flowchart TD`) |
| **Sequence Diagram** | High — captures User ↔ System interactions across all three phases (create, convert, test) | Good — each message/response pair is a testable assertion | Medium — interaction labels reference FR IDs | ✅ Recommended (Mermaid `sequenceDiagram`) |
| **State Machine / State Transition Table** | High — the system transitions through 11 well-defined states from empty canvas to results available | Excellent — every state transition = one or more test cases; state-based testing is rigorous | High — states map to postconditions; transitions map to FR IDs | ✅ Recommended (Mermaid `stateDiagram-v2`) |
| **Use Case Specification** | High — structured template captures actors, preconditions, main flow (3 phases with sub-steps), alternative flows, postconditions | Excellent — main flow + alternatives map directly to test scenarios; proven for test derivation per Cockburn/UML methodology | Very High — bi-directional traceability via requirement IDs (FR-XX → UC Step → Test Case) | ✅ **Primary structured representation** |
| **Decision Table** | Moderate — valuable for BR-04 (Output Block present vs. absent and its effect on results display) and BR-01 (minimum component check) | Good for boundary / condition testing | Medium | ✅ Supplementary (for BR-01, BR-04) |
| **Gherkin (Given-When-Then)** | High — natural language test specification directly executable in BDD frameworks | Excellent — each scenario maps 1:1 to a requirement | High — each scenario traceable to FR/BR ID | ✅ Output artifact (derived from the use case, not the plan itself) |
| **Requirement Traceability Matrix (RTM)** | Moderate — governance artifact linking FR → UC Step → Test Case | Excellent — bi-directional traceability | Very High | ✅ Supplementary (governance artifact) |
| **UML Use Case Diagram** | Low — too high-level; shows actors & use cases but not step-by-step flows | Poor — insufficient for deriving detailed test steps | Low | ❌ Not selected |
| **Formalized Requirement Schema Templates** | Moderate — useful for tooling but adds overhead for a feature of this scope | Medium | High | ❌ Not selected for this scope |

---

## Section 3: Selected Representation & Justification

### 3.1 Primary Representation: Use Case Specification (Cockburn-style Fully Dressed)

**Why it is suitable for test case derivation:**

The Agent Blocks feature spans three distinct user workflows — creating the base agent, converting it to a block, and testing the agent block — each with clear sequential steps. A Use Case Specification decomposes these into:

- **Main Success Scenario** (step-by-step through all three phases)
- **Alternative / Extension Flows** (e.g., EC-01: no output block; EC-02: nested blocks)
- **Preconditions and Postconditions** (entry/exit criteria for test cases)

Every step in the main flow and every extension maps 1:1 to a test scenario. The Cockburn fully dressed template has been proven in practice for derivation of functional test cases (Cockburn, *Writing Effective Use Cases*, 2001; Zielczynski, *Traceability from Use Cases to Test Cases*, IBM developerWorks, 2006).

**How it enables verification and traceability:**

Each use case step is labeled (e.g., UC-AB-01 Step 3) and cross-referenced to a Functional Requirement ID (FR-XX) or Business Rule (BR-XX). This enables construction of a Requirements Traceability Matrix (RTM) ensuring every requirement has at least one corresponding test case. Post-requirements traceability (from use case → implementation → test artifact) is also supported.

**Advantages over alternative representations for this context:**

| Advantage | Explanation |
|-----------|-------------|
| More complete than Gherkin alone | Gherkin scenarios are *derived from* the use case specification, not created alongside it — the use case provides the source of truth. |
| More structured than a flowchart | Flowcharts visualize flow but don't capture preconditions, postconditions, actors, or alternative flows in a structured way. |
| Captures business rules | BR-01 through BR-06 are formally documented within the use case template, which a state machine would not include. |
| Extensible with alternative flows | EC-01 (no output block) and EC-02 (nested agent blocks) are captured as extensions — state machines and flowcharts would need separate diagrams for each. |
| Human-readable | The narrative form is understandable by QA engineers, developers, product managers, and other AI agents without specialized notation knowledge. |

### 3.2 Supplementary Representation: Decision Table (for BR-01 and BR-04)

Two decision tables will cleanly model key business rules:

1. **Minimum Component Check (BR-01):** Conditions = {Input Block present?, AI Text Generator present?, Output Block present?} → Action = {Agent can be saved as functional block? / Agent Outputs show results?}
2. **Output Block Presence (BR-04):** Conditions = {Output Block present?, View More clicked?} → Action = {"Agent Outputs" shows results / Results visible via "View More" / Results visible at bottom of block}

These decision tables provide exhaustive condition coverage for boundary testing.

### 3.3 Mermaid Diagrams as Visual Companions

Three Mermaid diagrams will be produced to complement the Use Case Specification:

1. **Flowchart / Activity Diagram** (`flowchart TD`) — end-to-end workflow
2. **Sequence Diagram** (`sequenceDiagram`) — User ↔ System message exchange
3. **State Diagram** (`stateDiagram-v2`) — agent block lifecycle states

These diagrams serve as visual verification aids and facilitate communication with stakeholders.

---

## Section 4: Mermaid Diagram Plan

---

### Diagram 1 — Activity / Flowchart

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Visualize the entire multi-phase workflow for creating, converting, and testing an agent block as a sequential activity with decision points. |
| **Scope** | Three phases: (1) Creating the Base Agent (add blocks → connect → name → save), (2) Converting to a Block (open Block Menu → find agent → add to workflow → save), (3) Testing (enter input → run → view results). Includes decision node for "Output Block present?" (BR-04). |
| **Key Actors / Entities** | User, Builder Canvas, Input Block, AI Text Generator Block, Output Block, Block Menu, Agent Executor, Agent Outputs / View More |
| **Exclusions** | Advanced usage (hierarchical composition) shown as a terminal note, not a full sub-flow. Internal AI processing logic not modeled. Authentication flow (precondition). |
| **Assumptions** | Happy path is the primary flow; the only documented branch is BR-04 (no output block). |
| **Mermaid Directive** | `flowchart TD` |

**Rendering directive:**
```
flowchart TD
```

---

### Diagram 2 — Sequence Diagram

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Show the chronological message-passing interactions between the User and the AutoGPT Platform across all three phases (Create, Convert, Test), making each system response explicit and testable. |
| **Scope** | All major steps: Add blocks → Connect → Name → Save → Open Block Menu → Search/Select → Add to workflow → Save new agent → Enter input → Run → Display results. Includes alternative fragment for BR-04 (output block absent). |
| **Key Actors / Entities** | `User`, `Builder UI`, `Block Library`, `Agent Store`, `Block Menu`, `Execution Engine`, `Results Display` |
| **Exclusions** | Internal API/backend calls (not documented). Authentication (precondition). AI model inference internals. |
| **Assumptions** | All interactions are synchronous UI-level interactions as implied by the documentation. The agent save operation is atomic. |
| **Mermaid Directive** | `sequenceDiagram` |

**Rendering directive:**
```
sequenceDiagram
```

---

### Diagram 3 — State Diagram

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Model the lifecycle of the Agent Block creation session as a set of discrete system states and transitions triggered by user actions, enabling state-based test case derivation (each transition = a test case). |
| **Scope** | Eleven states from `BuilderCanvasEmpty` through `ResultsAvailable`. Transitions correspond to user actions (add block, connect, name, save, open menu, search, select, save, enter input, run). Terminal state branches for BR-04. |
| **Key Actors / Entities** | Agent Block Creation Session (system-side state machine); transitions triggered by User actions |
| **Exclusions** | Error/failure states (not documented). Undo/rollback states (not documented). |
| **Assumptions** | Each state is reached only after the preceding action completes successfully. States are sequential with the exception of the BR-04 branch at `ResultsAvailable`. |
| **Mermaid Directive** | `stateDiagram-v2` |

**Rendering directive:**
```
stateDiagram-v2
```

---

## Section 5: Metadata

| Field | Value |
|-------|-------|
| **Model** | Claude Opus 4.6 (GitHub Copilot) |
| **Date** | 2026-02-22 |
| **Time** | Executed on February 22, 2026 |
| **Source Document** | `docs/content/platform/agent-blocks.md` |
| **Output File** | `plan/agent-blocks-representation-plan.md` |
| **Prompt Used** | `doc_to_dec.prompt.md` |
