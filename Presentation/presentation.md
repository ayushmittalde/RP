## Title & Framing

**Slide 1 – Title, Context, and Claim**  
**Title:** LLM-Assisted Test Generation for Documentation-Driven Software Systems  

**Bullets:**
- Proof-of-concept for generating system tests from natural-language documentation
- Target system: Auto-GPT no‑code agent platform with Playwright infrastructure
- Focus: From documentation → formal representations → executable web tests via AI agents
- Infra : VS Code with Github copilot agents, Playwright CLI, and markdown artefacts for traceability
**Suggested visual:** Pipeline graphic (Docs → Representation → Tests).  

**Speaker notes:** Briefly introduce yourself, thesis title, and institution. State that the core question is whether LLMs can systematically transform natural-language documentation into reliable, executable system tests for complex, documentation-driven systems, using Auto-GPT as the evaluation platform using LLM Agents.

---

## Problem & Motivation

**Slide 2 – Problem in Context**  
**Title:** Gap Between Documentation and Executable System Tests  
**Bullets:**
- Software-defined systems expose behavior via heterogeneous interfaces and rich documentation.
- System tests remain largely handcrafted (at least till now) and disconnected from documentation of the system.
- System test connected to Formal requirements using traceability matrices. 
- Existing LLM-for-testing work focuses on REST APIs with formal schemas (OpenAPI)
- Limited support for systems where documentation is the primary specification

**Speaker notes:** Explain the practical difficulty teams face when trying to maintain system tests that stay aligned with fast-changing documentation, requirements especially when there is no formal schema (e.g., OpenAPI). Emphasize that this is amplified in SDVs and documentation-driven platforms like Auto-GPT.

**Slide 3 – Prior Work and Limitations**  
**Title:** Existing LLM-Based API Testing: Strengths and Boundaries  
**Bullets:**
- Learnings from literature review 
- Limitation: assume well-structured OpenAPI/Swagger; do not address documentation-only systems
**Speaker notes:** Position your work explicitly as moving from “schema-driven” to “documentation-driven” test generation. Highlight that the literature review showed maturity in REST API testing but a research gap for systems whose primary interface is textual documentation.

**Slide 4 – Research Pivot and Target System**  
**Title:** From REST APIs to Documentation-Driven Software Systems  
**Bullets:**
- Pivot after literature review: focus on systems lacking formal API specs
- Candidate evaluation: Autoware vs. Auto-GPT
- Auto-GPT selected: rich docs, mature test infra, strong doc–test alignment
---

## Research Questions & Objectives

**Slide 5 – Research Questions**  
**Title:** Research Questions: From Documentation to Deterministic Tests  
**Bullets:**
- RQ1: How can natural-language documentation be transformed into structured representations suitable for test derivation?
- RQ2: How can AI agents leverage these representations to generate deterministic, infrastructure-aligned web tests?
- RQ3: What is the effectiveness and failure profile of such LLM-assisted test generation?
**Suggested visual:** Simple list or 3-box graphic, each box = RQ with icon.  
**Speaker notes:** Clearly articulate each RQ and tie them to the stages of your pipeline: modeling (RQ1), agentic test generation (RQ2), and empirical evaluation (RQ3).

**Slide 6 – Goals and Contributions**  
**Title:** Research Goals and Key Contributions  
**Bullets:**
- Design a multi-phase pipeline from documentation to executable Playwright tests
- Implement an AI agent architecture with specialized prompts and tools
- Generate and validate tests on the Auto-GPT web interface using PLawright CLI
- Provide quantitative results (document generation and Model performance experimentation)
**Suggested visual:** Contribution map: numbered contributions linked to pipeline stages.

**Speaker notes:** Phrase your contributions as concrete, evaluable outputs: a modeling methodology, an agent architecture, an implemented toolchain, and empirical findings.

---

## Methodology Overview

**Slide 7 – Multi-Phase Pipeline Overview**  
**Title:** Multi-Phase Test Generation Pipeline  
**Bullets:**
- Phase 1: Documentation analysis → decision on representation
- Phase 2: decision on representation → Representation construction (Mermaid diagrams, Gherkin, traceability tables)
- Phase 3: Representation → Playwright test generation via AI agents 
- Phase 4: Execution, coverage analysis, and reporting
**Suggested visual:** End-to-end pipeline diagram with 4 phases, arrows, and artefacts per phase.  
**Speaker notes:** Walk through the pipeline at a high level before diving into agent architecture. Emphasize that each phase is explicit, tool-supported, and traceable.

---

## AI Agent Architecture

**Slide 8 – Overall Agent Architecture**  
**Title:** AI Agent Architecture for Documentation-Driven Testing  
**Bullets:**
- Modular agents( driven by custom prompts) aligned with pipeline phases (doc→dec, dec→rep, rep→test, test→report)
- Shared environment: markdown artefacts
- Explicit tools: file I/O, search, web fetch, Playwright exploration, task tracking
- Strong separation of concerns: planning, representation, generation, execution, reporting
**Suggested visual:** Architecture diagram showing four agents as boxes, connected via artefacts in the repo (plan/, representation/, Resources/, report/).  
**Speaker notes:** Describe the architecture as a coordinated set of specialized agents, each governed by a strict prompt and tool set. Highlight reproducibility: each phase leaves behind structured artefacts.

**Slide 9 – Prompt Design Philosophy**  
**Title:** Prompt Design as Encoded Methodology  
**Bullets:**
- Prompts specify *roles* (e.g., “Senior QA Architect”, “Formal Modeling Engineer”)
- Gated and Phased prompting
- Iterative process
- Each prompt encodes process constraints (phases, mandatory checks, forbidden shortcuts)
- Heavy use of task tracking and tool calls instead of free-form reasoning
- Mermaid treated as formal grammar; representation prompts forbid inventing syntax
- Using subagents for quality checks and validation to ensure certain standards are met (e.g., no test generation without exploration, documentation must have certain sections)  
**Speaker notes:** Argue that prompts are not just instructions but a way of encoding methodological instructions: clear phases, explicit tools, and hard constraints against speculative behavior. This reframes “prompting” as process design.

**Slide 10 - 11 – An example interaction or Log File**  
**Title:** An example interaction or Log File  
**Bullets:**
- An example log file interation , system prompt, user prompt, context , tool calling and response.


## Representation & Test Generation

**Slide 12 – Structured Representation Layer**  
**Title:** From Documentation to Formalized Representations  
**Bullets:**
- Outputs: state diagrams, sequence diagrams, flowcharts, Gherkin, traceability tables
- Unique IDs and explicit links to documentation sections
- Designed for systematic test derivation and coverage reasoning
- Stored in representation/ for reuse and review
**Suggested visual:** Example schematic: requirement ID → state diagram node → scenario ID → test case.  
**Speaker notes:** Explain how the decision-to-representation agent converts narrative documentation into a graph of states and transitions plus Gherkin-like scenarios, enabling structured coverage and test design.

**Slide 13 – Structured Representation Layer- Example**  
**Title:** Structured Representation Layer- Example
**Bullets:**
- Example pictures of a state diagram and Gherkin scenarios generated from a specific documentation section.

**Slide 14 – Empirical Playwright Test Generation -1**  
**Title:** Representation-Driven, Empirically Grounded Playwright Tests  
**Bullets:**
- Tests derived only after live exploration with `playwright-cli`
- Every action backed by captured code snippets and snapshots
- Assertions guided by observed DOM, network, and console behavior
- Resulting tests: deterministic, infrastructure-aligned, and replayable
**Suggested visual:** Two-layer diagram: top = representation elements; bottom = captured Playwright code blocks linked to them.  
**Speaker notes:** Stress the philosophy shift: implementation reality is primary. The agent is forced to interact with the real Auto-GPT UI, capture the generated Playwright code, and only then synthesize tests using those verified selectors and behaviors.

**Slide 15 – Empirical Playwright Test Generation -2**  
**Title:** Representation-Driven, Empirically Grounded Playwright Tests  
**Bullets:**
- Discussion about different iterations of promting which lead to successfull test generation.
**Suggested visual:** Two-layer diagram: top = representation elements; bottom = captured Playwright code blocks linked to them.  
**Speaker notes:** Stress the philosophy shift: implementation reality is primary. The agent is forced to interact with the real Auto-GPT UI, capture the generated Playwright code, and only then synthesize tests using those verified selectors and behaviors.

**Slide 16 – Video Demo**  

---

## Experimental Setup & Results

**Slide 17 – Experimental Infrastructure**  
**Title:** Experimental Infrastructure on Auto-GPT Platform  
**Bullets:**
- Auto-GPT web UI with no-code agent builder workflows
- Docker
- Existing Playwright and Pytest suites 
**Suggested visual:** Infrastructure diagram: browser, Playwright runner, Auto-GPT web app, file system for artefacts.  
    
**Slide 18 – Quantitative Outcomes**  
**Title:** Test Generation Outcomes and Coverage  
**Bullets:**
- Number of scenarios modeled and tests generated (happy, negative, boundary)
- Coverage metrics (functional areas, flows, or branches where available)
- Execution statistics: passes, failures, blocked tests
- Findings
**Suggested visual:** Bar chart or table summarizing number of generated tests and their outcomes; coverage per feature.  
**Speaker notes:** Present concrete numbers from your academic report (counts, percentages). Emphasize not just volume of tests, but how many are executable and stable.

**Slide 19 – Comparison Between different Models**  
**Title:** Comparison Between different Models  
**Bullets:**
- Categorization: selector errors, state/precondition failures, auth/infrastructure issues, logic errors
- Mapping of failures back to representation and documentation gaps
- Identification of fragile assumptions and ambiguous docs
- Demonstrated ability of the pipeline to surface documentation–implementation mismatches
 
---

## Discussion, Contributions, and Defense

**Slide 20 – Discussion and Contributions**  
**Title:** Interpretation of Findings and Technical Contributions  
**Bullets:**
- LLMs can generate executable integration tests *when constrained by formal representations and empirical exploration*
- LLMs are becomming very good at following complex, multi-step reasoning when properly prompted. 
- Did not observed hallucinated tests that were not grounded in the actual system behavior, which is a common failure mode in LLM test generation.
- Quality checks , validation , conformant to some stadards (Like test cases should not have this , documenttiomn should have this) can be enforced via subagent rather then self regulatory prompting.
- Agent prompts that encode process rules improve determinism and reduce hallucinations
- Contributions: methodology, architecture, implementation, and empirical evaluation on a realistic system
**Suggested visual:** Bullet list with emphasis boxes highlighting 3–4 key technical contributions.  


---

## Conclusion & Future Work

**Slide 21 – Conclusions and Future Directions**  
**Title:** Conclusions, Impact, and Future Work  
**Bullets:**
- Testing APIs driven by OpenAPI , where the reinforcement algorithim or other novel algorithim , expert , findings are designed as prompt but not implemented in code. 
- Building and modelling the complex system side by side with Knowledge graph when the Aagent explores the system under test. 
- Extend the framework to security testing, can help in anticipating and mitigating vulnerabilities in SDVs by generating tests that probe for security weaknesses based on documentation and observed behavior and known vulnerabilities internet. 
- Future work: extend to SDV/SDX APIs, richer coverage metrics, multi-agent collaboration
- Broader impact: towards maintainable, traceable, and semi-automated integration testing in safety-relevant domains.  
**Speaker notes:** Close by restating your main contribution in one or two sharp sentences, then project the next research steps

**Slide 20 – Thank You** 