# Feature: Calculator Agent Creation without AI
# 
# As an agent creator
# I want to create a Calculator agent using the visual builder
# So that I can build a mathematical calculation system
#
# Metadata:
# - Model: Claude Sonnet 4.5
# - Date: February 22, 2026
# - Source: create-basic-agent.md
# - Plan: create-basic-agent-representation-plan.md

@Calculator-Agent @Agent-Creation
Feature: Calculator Agent Creation without AI

  Background:
    Given the visual builder is accessible
    And the user has permission to create agents
    And the Calculator function is available

  @FR-CALC-001 @Input-Block
  Scenario: Add first Input Block for numeric value 'a'
    Given the user is in the visual builder workspace
    When the user adds an Input Block to the workspace
    Then the Input Block should be visible in the workspace
    And the Input Block should have connection points available

  @FR-CALC-006 @Block-Naming
  Scenario: Name the first Input Block as "a"
    Given an Input Block is added to the workspace
    When the user names the Input Block as "a"
    Then the Input Block should display the name "a"
    And the block should be identifiable by the name "a"

  @FR-CALC-001 @Input-Block
  Scenario: Add second Input Block for numeric value 'b'
    Given the user is in the visual builder workspace
    And an Input Block named "a" already exists
    When the user adds another Input Block to the workspace
    Then the second Input Block should be visible in the workspace
    And the second Input Block should have connection points available

  @FR-CALC-006 @Block-Naming
  Scenario: Name the second Input Block as "b"
    Given a second Input Block is added to the workspace
    When the user names the second Input Block as "b"
    Then the Input Block should display the name "b"
    And the block should be identifiable by the name "b"

  @FR-CALC-002 @Calculator-Block
  Scenario: Add Calculator Block
    Given the user is in the visual builder workspace
    When the user adds a Calculator Block to the workspace
    Then the Calculator Block should be visible in the workspace
    And the Calculator Block should have input connection points for operands
    And the Calculator Block should have a "result" output connection point
    And the Calculator Block should allow operation selection

  @FR-CALC-007 @Operation-Selection
  Scenario Outline: Select mathematical operation in Calculator Block
    Given a Calculator Block is added to the workspace
    When the user selects the "<operation>" operation
    Then the Calculator Block should be configured for "<operation>"
    And the operation should be displayed on the Calculator Block

    Examples:
      | operation |
      | multiply  |
      | add       |
      | subtract  |
      | divide    |

  @FR-CALC-003 @Output-Block
  Scenario: Add Output Block for displaying calculation result
    Given the user is in the visual builder workspace
    When the user adds an Output Block to the workspace
    Then the Output Block should be visible in the workspace
    And the Output Block should have a "value" input connection point

  @FR-CALC-006 @Block-Naming
  Scenario: Name the Output Block
    Given an Output Block is added to the workspace
    When the user names the Output Block with a descriptive name
    Then the Output Block should display the assigned name
    And the block should be identifiable by the assigned name

  @FR-CALC-004 @BR-001 @BR-005 @Block-Connection
  Scenario: Connect first Input Block to Calculator Block
    Given an Input Block named "a" exists in the workspace
    And a Calculator Block exists in the workspace
    When the user connects the output of "a" block to the first operand input of the Calculator Block
    Then a connection line should be visible between "a" and the Calculator Block
    And the connection should be established from "a" output to Calculator first operand
    And the data flow should be configured from Input to Calculator

  @FR-CALC-004 @BR-001 @BR-005 @Block-Connection
  Scenario: Connect second Input Block to Calculator Block
    Given an Input Block named "b" exists in the workspace
    And a Calculator Block exists in the workspace
    And the first operand is already connected
    When the user connects the output of "b" block to the second operand input of the Calculator Block
    Then a connection line should be visible between "b" and the Calculator Block
    And the connection should be established from "b" output to Calculator second operand
    And both operands should be connected to the Calculator Block

  @FR-CALC-005 @BR-001 @BR-005 @Block-Connection
  Scenario: Connect Calculator Block result to Output Block
    Given a Calculator Block exists in the workspace
    And an Output Block exists in the workspace
    When the user connects the "result" output of the Calculator Block to the "value" input of the Output Block
    Then a connection line should be visible between Calculator and Output Block
    And the connection should be established from Calculator result to Output value
    And the data flow should be configured from Calculator to Output

  @FR-CALC-007 @Agent-Saving
  Scenario: Save the Calculator agent with a custom name
    Given all blocks are added to the workspace
      | Block Type     | Block Name |
      | Input Block    | a          |
      | Input Block    | b          |
      | Calculator     | calc       |
      | Output Block   | result     |
    And all connections are established correctly
      | Source Block | Source Point | Target Block | Target Point    |
      | a            | output       | calc         | operand1        |
      | b            | output       | calc         | operand2        |
      | calc         | result       | result       | value           |
    And the Calculator Block is configured for an operation
    When the user saves the agent with the name "Calculator Agent"
    Then the agent should be saved successfully
    And the agent should be identifiable by the name "Calculator Agent"
    And the agent should be available for execution

  @BR-001 @Edge-Case-8 @Error-Handling
  Scenario: Attempt to save Calculator agent with incomplete connections
    Given blocks are added to the workspace
      | Block Type     | Block Name |
      | Input Block    | a          |
      | Input Block    | b          |
      | Calculator     | calc       |
      | Output Block   | result     |
    But only one input is connected to the Calculator Block
    When the user attempts to save the agent
    Then the system should display a validation error
    And the error should indicate that all Calculator inputs must be connected
    And the agent should not be saved

  @Edge-Case-3 @Error-Handling
  Scenario: Attempt to connect incompatible block types
    Given an Input Block exists in the workspace
    And another Input Block exists in the workspace
    When the user attempts to connect an Input Block output to another Input Block
    Then the system should prevent the connection
    Or the system should display an error message
    And the error should indicate that the blocks are incompatible

  @Integration @Complete-Flow
  Scenario: Complete Calculator agent creation workflow with multiply operation
    Given the user is in the visual builder workspace
    When the user performs the following actions in sequence:
      | Step | Action                                                      |
      | 1    | Add Input Block and name it "a"                            |
      | 2    | Add Input Block and name it "b"                            |
      | 3    | Add Calculator Block and name it "calc"                    |
      | 4    | Select "multiply" operation in Calculator Block            |
      | 5    | Add Output Block and name it "result"                      |
      | 6    | Connect "a" output to "calc" first operand                 |
      | 7    | Connect "b" output to "calc" second operand                |
      | 8    | Connect "calc" result to "result" value                    |
      | 9    | Save the agent with name "Multiplication Agent"            |
    Then all blocks should be visible and properly named
    And all connections should be established correctly
    And the Calculator Block should be configured for "multiply"
    And the agent "Multiplication Agent" should be saved successfully
    And the agent should transition to "Saved" state
    And the agent should be ready for execution

  @Traceability
  Scenario: Verify all Calculator functional requirements are covered
    Given the Calculator agent creation process
    Then the following requirements should be testable:
      | Requirement ID | Description                                | Coverage |
      | FR-CALC-001   | Add multiple Input Blocks                  | Yes      |
      | FR-CALC-002   | Add Calculator Block                       | Yes      |
      | FR-CALC-003   | Add Output Block                           | Yes      |
      | FR-CALC-004   | Connect Input Blocks to Calculator         | Yes      |
      | FR-CALC-005   | Connect Calculator to Output               | Yes      |
      | FR-CALC-006   | Name blocks with custom identifiers        | Yes      |
      | FR-CALC-007   | Support operation selection                | Yes      |
      | BR-001        | Blocks must be connected                   | Yes      |
      | BR-002        | Input blocks must be named                 | Yes      |
      | BR-003        | Output blocks must be named                | Yes      |
