# Feature: Calculator Agent Execution
# 
# As an agent creator
# I want to execute my Calculator agent with numeric inputs
# So that I can verify the agent performs mathematical calculations correctly
#
# Metadata:
# - Model: Claude Sonnet 4.5
# - Date: February 22, 2026
# - Source: create-basic-agent.md
# - Plan: create-basic-agent-representation-plan.md

@Calculator-Agent @Agent-Execution
Feature: Calculator Agent Execution

  Background:
    Given a Calculator agent named "Calculator Agent" exists
    And the agent is in "Saved" state
    And the agent has the following configuration:
      | Block Type     | Block Name | Connections                    |
      | Input Block    | a          | output -> calc.operand1        |
      | Input Block    | b          | output -> calc.operand2        |
      | Calculator     | calc       | result -> result.value         |
      | Output Block   | result     | -                              |
    And the Calculator service is available

  @FR-CALC-008 @Agent-Execution @Multiply
  Scenario: Execute Calculator agent with multiply operation
    Given the Calculator Block is configured for "multiply" operation
    And the user opens the Calculator agent for execution
    When the user provides the following inputs:
      | Block Name | Value |
      | a          | 5     |
      | b          | 3     |
    And the user clicks the "Run" button
    Then the agent should transition to "Executing" state
    And the agent should calculate 5 × 3
    And the agent should produce the result 15
    And the agent should transition to "Completed" state

  @FR-CALC-008 @Agent-Execution @Add
  Scenario: Execute Calculator agent with add operation
    Given the Calculator Block is configured for "add" operation
    And the user opens the Calculator agent for execution
    When the user provides the following inputs:
      | Block Name | Value |
      | a          | 10    |
      | b          | 7     |
    And the user clicks the "Run" button
    Then the agent should calculate 10 + 7
    And the agent should produce the result 17
    And the result should be displayed in the Output Block

  @FR-CALC-008 @Agent-Execution @Subtract
  Scenario: Execute Calculator agent with subtract operation
    Given the Calculator Block is configured for "subtract" operation
    And the user opens the Calculator agent for execution
    When the user provides the following inputs:
      | Block Name | Value |
      | a          | 20    |
      | b          | 8     |
    And the user clicks the "Run" button
    Then the agent should calculate 20 − 8
    And the agent should produce the result 12
    And the result should be displayed in the Output Block

  @FR-CALC-008 @Agent-Execution @Divide
  Scenario: Execute Calculator agent with divide operation
    Given the Calculator Block is configured for "divide" operation
    And the user opens the Calculator agent for execution
    When the user provides the following inputs:
      | Block Name | Value |
      | a          | 100   |
      | b          | 4     |
    And the user clicks the "Run" button
    Then the agent should calculate 100 ÷ 4
    And the agent should produce the result 25
    And the result should be displayed in the Output Block

  @FR-CALC-009 @FR-CALC-010 @Result-Display
  Scenario: View Calculator agent results in "Agent Outputs" section
    Given the Calculator agent has been executed successfully
    And the execution has completed with result 15
    When the user navigates to the "Agent Outputs" section
    Then the system should display the output from the Output Block
    And the output should show the numeric value 15
    And the output should be clearly labeled with the output block name "result"

  @FR-CALC-010 @Result-Display
  Scenario: View Calculator agent results through "View More" option
    Given the Calculator agent has been executed successfully
    And the execution has completed
    When the user selects the "View More" option
    Then the system should display the agent execution results
    And the results should show the calculated value
    And the results should correspond to the provided inputs and operation

  @Edge-Case-4 @Error-Handling
  Scenario: Calculator receives non-numeric input for operand 'a'
    Given the Calculator agent is ready for execution
    When the user provides the following inputs:
      | Block Name | Value      |
      | a          | "abc"      |
      | b          | 5          |
    And the user clicks the "Run" button
    Then the system should detect invalid input
    And the system should display an error message
    And the error should indicate that numeric input is required for "a"
    And the calculation should not proceed

  @Edge-Case-4 @Error-Handling
  Scenario: Calculator receives non-numeric input for operand 'b'
    Given the Calculator agent is ready for execution
    When the user provides the following inputs:
      | Block Name | Value      |
      | a          | 10         |
      | b          | "xyz"      |
    And the user clicks the "Run" button
    Then the system should detect invalid input
    And the system should display an error message
    And the error should indicate that numeric input is required for "b"
    And the calculation should not proceed

  @Edge-Case-5 @Error-Handling @Divide-By-Zero
  Scenario: Division by zero error handling
    Given the Calculator Block is configured for "divide" operation
    And the user opens the Calculator agent for execution
    When the user provides the following inputs:
      | Block Name | Value |
      | a          | 100   |
      | b          | 0     |
    And the user clicks the "Run" button
    Then the system should detect division by zero
    And the system should display an error message
    And the error should indicate that division by zero is not allowed
    And the agent should handle the error gracefully

  @Edge-Case-1 @Error-Handling
  Scenario: Run Calculator agent without providing inputs
    Given the Calculator agent is ready for execution
    When the user clicks the "Run" button without providing inputs for "a" and "b"
    Then the system should display a validation error
    And the error should indicate that both inputs are required
    Or the agent should execute with default/empty values

  @Data-Flow @Integration
  Scenario: Verify data flows correctly through Calculator blocks
    Given the Calculator agent is configured for "add" operation
    And the user opens the agent for execution
    When the user provides inputs: a=25, b=15
    And the user runs the agent
    Then the value 25 should flow from Input "a" to Calculator operand1
    And the value 15 should flow from Input "b" to Calculator operand2
    And the Calculator should process: 25 + 15 = 40
    And the result 40 should flow from Calculator to Output Block
    And the final output 40 should be displayed in Agent Outputs section

  @Parameterized @Multiple-Operations
  Scenario Outline: Execute Calculator agent with various operations and values
    Given the Calculator Block is configured for "<operation>" operation
    And the user opens the Calculator agent for execution
    When the user provides the following inputs:
      | Block Name | Value   |
      | a          | <value_a> |
      | b          | <value_b> |
    And the user runs the agent
    Then the agent should execute successfully
    And the system should display the result <expected_result> in Agent Outputs
    And the result should be correct for the "<operation>" operation

    Examples:
      | operation | value_a | value_b | expected_result |
      | multiply  | 5       | 3       | 15              |
      | multiply  | 10      | 10      | 100             |
      | add       | 20      | 30      | 50              |
      | add       | 100     | 50      | 150             |
      | subtract  | 50      | 20      | 30              |
      | subtract  | 100     | 25      | 75              |
      | divide    | 100     | 5       | 20              |
      | divide    | 50      | 2       | 25              |

  @Boundary-Testing
  Scenario Outline: Execute Calculator with boundary values
    Given the Calculator Block is configured for "<operation>" operation
    When the user provides inputs: a=<value_a>, b=<value_b>
    And the user runs the agent
    Then the agent should handle the boundary case correctly
    And the result should be <expected_result> or an appropriate error

    Examples:
      | operation | value_a | value_b | expected_result | notes            |
      | multiply  | 0       | 100     | 0               | Zero operand     |
      | multiply  | 1       | 999     | 999             | Identity         |
      | add       | -10     | 10      | 0               | Negative numbers |
      | subtract  | 5       | 5       | 0               | Equal operands   |
      | divide    | 0       | 5       | 0               | Zero dividend    |
      | divide    | 100     | 0       | ERROR           | Division by zero |

  @Reusability
  Scenario: Execute the same Calculator agent multiple times with different inputs
    Given the Calculator agent has been executed once with a=5, b=3
    And the previous execution produced result 15
    When the user provides new inputs: a=10, b=7
    And the user runs the agent again
    Then the agent should execute successfully with the new inputs
    And the new result should be calculated based on new inputs
    And the previous execution results should still be accessible

  @State-Transition
  Scenario: Calculator agent state transitions during execution
    Given the Calculator agent is in "Saved" state
    When the user provides valid inputs and runs the agent
    Then the agent should transition through the following states:
      | From State | To State   | Trigger       |
      | Saved      | Executing  | Run initiated |
      | Executing  | Completed  | Calculation done |
    And each state transition should be observable
    And the agent should return to "Saved" state for next execution

  @Traceability
  Scenario: Verify Calculator execution requirements coverage
    Given the Calculator agent execution process
    Then the following requirements should be testable:
      | Requirement ID | Description                           | Coverage |
      | FR-CALC-008   | Execute calculations with inputs      | Yes      |
      | FR-CALC-009   | Display results in Agent Outputs      | Yes      |
      | FR-CALC-010   | Display results via View More         | Yes      |
      | FR-CALC-007   | Support all operation types           | Yes      |
      | BR-001        | Blocks must be connected              | Yes      |
      | BR-004        | Agent must be saved before run        | Yes      |
      | BR-005        | Connections follow data flow          | Yes      |
