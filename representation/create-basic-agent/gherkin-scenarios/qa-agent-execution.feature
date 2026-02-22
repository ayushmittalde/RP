# Feature: Q&A Agent Execution
# 
# As an agent creator
# I want to execute my Q&A agent with test inputs
# So that I can verify the agent produces AI-generated responses
#
# Metadata:
# - Model: Claude Sonnet 4.5
# - Date: February 22, 2026
# - Source: create-basic-agent.md
# - Plan: create-basic-agent-representation-plan.md

@QA-Agent @Agent-Execution
Feature: Q&A Agent Execution

  Background:
    Given a Q&A agent named "Q&A Agent" exists
    And the agent is in "Saved" state
    And the agent has the following configuration:
      | Block Type          | Block Name | Connections                    |
      | Input Block         | question   | output -> answer.Prompt        |
      | AI Text Generator   | answer     | response -> output.value       |
      | Output Block        | output     | -                              |
    And the AI Text Generator service is available

  @FR-QA-008 @Agent-Execution
  Scenario: Run the Q&A agent with a test question
    Given the user opens the Q&A agent for execution
    When the user provides the input "What is artificial intelligence?" for the "question" block
    And the user clicks the "Run" button
    Then the agent should transition to "Executing" state
    And the agent should process the input through the connected blocks
    And the agent should transition to "Completed" state

  @FR-QA-009 @FR-QA-010 @Result-Display
  Scenario: View Q&A agent results through "View More" option
    Given the Q&A agent has been executed successfully
    And the execution has completed
    When the user selects the "View More" option
    Then the system should display the agent execution results
    And the results should include the AI-generated answer
    And the results should correspond to the input question

  @FR-QA-010 @Result-Display
  Scenario: View Q&A agent results in "Agent Outputs" section
    Given the Q&A agent has been executed successfully
    And the execution has completed
    When the user navigates to the "Agent Outputs" section
    Then the system should display the output from the Output Block
    And the output should contain the AI-generated answer
    And the output should be clearly labeled with the output block name

  @BR-004 @Edge-Case-7 @Error-Handling
  Scenario: Attempt to run agent before saving
    Given blocks are added and connected in the workspace
    But the agent has not been saved
    When the user attempts to run the agent
    Then the system should display an error message
    And the error message should indicate that the agent must be saved first
    And the agent execution should not proceed

  @Edge-Case-1 @Error-Handling
  Scenario: Run agent without providing input
    Given the Q&A agent is ready for execution
    When the user clicks the "Run" button without providing input for "question"
    Then the system should display a validation error
    And the error should indicate that input is required
    Or the agent should execute with empty input and produce a response

  @Edge-Case-6 @Error-Handling
  Scenario: AI Text Generator service unavailable during execution
    Given the Q&A agent is ready for execution
    And the AI Text Generator service is unavailable
    When the user provides input "What is AI?" for the "question" block
    And the user clicks the "Run" button
    Then the agent should attempt to execute
    And the system should display an error message
    And the error message should indicate that the AI service is unavailable
    And the agent should transition to an "Error" state

  @Data-Flow @Integration
  Scenario: Verify data flows correctly through connected blocks
    Given the Q&A agent is ready for execution
    When the user provides the input "Explain machine learning" for the "question" block
    And the user runs the agent
    Then the input should flow from Input Block to AI Text Generator's Prompt
    And the AI Text Generator should process the prompt
    And the AI response should flow from AI Text Generator to Output Block's value
    And the final output should be displayed in the Agent Outputs section

  @Parameterized @Multiple-Executions
  Scenario Outline: Execute Q&A agent with various questions
    Given the Q&A agent is ready for execution
    When the user provides the input "<question>" for the "question" block
    And the user runs the agent
    Then the agent should execute successfully
    And the system should display an AI-generated answer in the Agent Outputs section
    And the answer should be relevant to "<question>"

    Examples:
      | question                                    |
      | What is artificial intelligence?            |
      | Explain neural networks                     |
      | How does machine learning work?             |
      | What are the benefits of AI?                |
      | Define natural language processing          |

  @Reusability
  Scenario: Execute the same agent multiple times
    Given the Q&A agent has been executed once
    And the previous execution has completed
    When the user provides a new input "What is deep learning?" for the "question" block
    And the user runs the agent again
    Then the agent should execute successfully with the new input
    And the new results should be displayed
    And the previous execution results should still be accessible

  @State-Transition
  Scenario: Agent state transitions during execution
    Given the Q&A agent is in "Saved" state
    When the user provides input and runs the agent
    Then the agent should transition through the following states:
      | From State | To State   | Trigger       |
      | Saved      | Executing  | Run initiated |
      | Executing  | Completed  | Execution end |
    And each state transition should be observable
    And the agent should return to "Saved" state for next execution

  @Performance @Non-Functional
  Scenario: Q&A agent execution completes within reasonable time
    Given the Q&A agent is ready for execution
    When the user provides input "What is AI?" and runs the agent
    Then the agent should complete execution within acceptable time limits
    And the user should receive feedback during execution
    And the system should indicate processing status

  @Traceability
  Scenario: Verify execution requirements coverage
    Given the Q&A agent execution process
    Then the following requirements should be testable:
      | Requirement ID | Description                         | Coverage |
      | FR-QA-008     | Run agent with test inputs          | Yes      |
      | FR-QA-009     | Display results via View More       | Yes      |
      | FR-QA-010     | Display results in Agent Outputs    | Yes      |
      | BR-004        | Agent must be saved before run      | Yes      |
      | BR-005        | Connections follow data flow        | Yes      |
      | BR-006        | Connection points have purpose      | Yes      |
