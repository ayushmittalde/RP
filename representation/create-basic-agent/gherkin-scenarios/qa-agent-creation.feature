# Feature: Q&A Agent Creation with AI Text Generator
# 
# As an agent creator
# I want to create a Q&A agent using the visual builder
# So that I can build an AI-powered question-answering system
#
# Metadata:
# - Model: Claude Sonnet 4.5
# - Date: February 22, 2026
# - Source: create-basic-agent.md
# - Plan: create-basic-agent-representation-plan.md

@QA-Agent @Agent-Creation
Feature: Q&A Agent Creation with AI Text Generator

  Background:
    Given the visual builder is accessible
    And the user has permission to create agents
    And the AI Text Generator service is available

  @FR-QA-001 @Input-Block
  Scenario: Add Input Block for question input
    Given the user is in the visual builder workspace
    When the user adds an Input Block to the workspace
    Then the Input Block should be visible in the workspace
    And the Input Block should have connection points available

  @FR-QA-006 @Block-Naming
  Scenario: Name the Input Block as "question"
    Given an Input Block is added to the workspace
    When the user names the Input Block as "question"
    Then the Input Block should display the name "question"
    And the block should be identifiable by the name "question"

  @FR-QA-002 @AI-Text-Generator
  Scenario: Add AI Text Generator Block
    Given the user is in the visual builder workspace
    When the user adds an AI Text Generator Block to the workspace
    Then the AI Text Generator Block should be visible in the workspace
    And the AI Text Generator Block should have a "Prompt" input connection point
    And the AI Text Generator Block should have a "response" output connection point

  @FR-QA-006 @Block-Naming
  Scenario: Name the AI Text Generator Block as "answer"
    Given an AI Text Generator Block is added to the workspace
    When the user names the AI Text Generator Block as "answer"
    Then the AI Text Generator Block should display the name "answer"
    And the block should be identifiable by the name "answer"

  @FR-QA-003 @Output-Block
  Scenario: Add Output Block for displaying results
    Given the user is in the visual builder workspace
    When the user adds an Output Block to the workspace
    Then the Output Block should be visible in the workspace
    And the Output Block should have a "value" input connection point

  @FR-QA-006 @Block-Naming
  Scenario: Name the Output Block
    Given an Output Block is added to the workspace
    When the user names the Output Block with a descriptive name
    Then the Output Block should display the assigned name
    And the block should be identifiable by the assigned name

  @FR-QA-004 @BR-001 @BR-005 @Block-Connection
  Scenario: Connect Input Block to AI Text Generator's Prompt input
    Given an Input Block named "question" exists in the workspace
    And an AI Text Generator Block named "answer" exists in the workspace
    When the user connects the output of "question" block to the "Prompt" input of "answer" block
    Then a connection line should be visible between "question" and "answer"
    And the connection should be established from "question" output to "answer" Prompt input
    And the data flow should be configured from Input to AI Text Generator

  @FR-QA-005 @BR-001 @BR-005 @Block-Connection
  Scenario: Connect AI Text Generator's response to Output Block's value
    Given an AI Text Generator Block named "answer" exists in the workspace
    And an Output Block exists in the workspace
    When the user connects the "response" output of "answer" block to the "value" input of the Output Block
    Then a connection line should be visible between "answer" and the Output Block
    And the connection should be established from "answer" response to Output value
    And the data flow should be configured from AI Text Generator to Output

  @FR-QA-007 @BR-004 @Agent-Saving
  Scenario: Save the Q&A agent with a custom name
    Given all blocks are added to the workspace
      | Block Type          | Block Name |
      | Input Block         | question   |
      | AI Text Generator   | answer     |
      | Output Block        | output     |
    And all connections are established correctly
      | Source Block | Source Point | Target Block | Target Point |
      | question     | output       | answer       | Prompt       |
      | answer       | response     | output       | value        |
    When the user saves the agent with the name "Q&A Agent"
    Then the agent should be saved successfully
    And the agent should be identifiable by the name "Q&A Agent"
    And the agent should be available for execution

  @FR-QA-007 @Edge-Case-2 @Error-Handling
  Scenario: Attempt to save agent without providing a name
    Given all blocks are added and connected in the workspace
    When the user attempts to save the agent without providing a name
    Then the system should display an error message
    And the error message should indicate that a name is required
    And the agent should not be saved

  @BR-001 @Edge-Case-8 @Error-Handling
  Scenario: Attempt to save agent with blocks not connected
    Given blocks are added to the workspace
      | Block Type          | Block Name |
      | Input Block         | question   |
      | AI Text Generator   | answer     |
      | Output Block        | output     |
    But the blocks are not connected
    When the user attempts to save the agent
    Then the system should display a validation error
    And the error should indicate that blocks must be connected
    And the agent should not be saved

  @Integration @Complete-Flow
  Scenario: Complete Q&A agent creation workflow
    Given the user is in the visual builder workspace
    When the user performs the following actions in sequence:
      | Step | Action                                                    |
      | 1    | Add Input Block and name it "question"                   |
      | 2    | Add AI Text Generator Block and name it "answer"         |
      | 3    | Add Output Block and name it "result"                    |
      | 4    | Connect "question" output to "answer" Prompt input       |
      | 5    | Connect "answer" response to "result" value input        |
      | 6    | Save the agent with name "Q&A Agent"                     |
    Then all blocks should be visible and properly named
    And all connections should be established correctly
    And the agent "Q&A Agent" should be saved successfully
    And the agent should transition to "Saved" state
    And the agent should be ready for execution

  @Traceability
  Scenario: Verify all functional requirements are covered
    Given the Q&A agent creation process
    Then the following requirements should be testable:
      | Requirement ID | Description                                    | Coverage |
      | FR-QA-001     | Add Input Block                                | Yes      |
      | FR-QA-002     | Add AI Text Generator Block                    | Yes      |
      | FR-QA-003     | Add Output Block                               | Yes      |
      | FR-QA-004     | Connect Input to AI Text Generator             | Yes      |
      | FR-QA-005     | Connect AI Text Generator to Output            | Yes      |
      | FR-QA-006     | Name blocks                                    | Yes      |
      | FR-QA-007     | Save agent with custom name                    | Yes      |
      | BR-001        | Blocks must be connected                       | Yes      |
      | BR-002        | Input blocks must be named                     | Yes      |
      | BR-003        | Output blocks must be named                    | Yes      |
      | BR-004        | Agent must be saved before execution           | Yes      |
