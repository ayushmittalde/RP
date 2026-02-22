# Agent Execution Sequence - Sequence Diagram

**Metadata:**
- Model: Claude Sonnet 4.5
- Date: February 22, 2026
- Source: create-basic-agent.md
- Plan: create-basic-agent-representation-plan.md
- Diagram Type: Sequence Diagram

---

## Purpose
Show the interaction between user, UI components, and backend services during agent execution for both Q&A and Calculator agents.

## Scope
- User initiates agent run
- System processes inputs through connected blocks
- Results are returned and displayed
- Covers both Q&A and Calculator agent execution patterns

## Key Participants
- User
- Visual Builder UI
- Input Block(s)
- Processing Block (AI Text Generator or Calculator)
- Output Block
- Backend Services (AI Service for Q&A, Calculation Service for Calculator)

---

## Q&A Agent Execution Sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Visual Builder UI
    participant InputBlock as Input Block<br/>(question)
    participant AIBlock as AI Text Generator<br/>(answer)
    participant AIService as AI Backend Service
    participant OutputBlock as Output Block
    
    Note over User,OutputBlock: Q&A Agent Execution Flow (FR-QA-008)
    
    User->>+UI: Open Q&A Agent for execution
    UI-->>-User: Display agent interface
    
    User->>+UI: Enter question text
    UI->>UI: Validate input
    
    alt Input is empty (Edge-Case-1)
        UI-->>User: Display validation error
        UI-->>-User: Prompt for input
    else Input is valid
        User->>+UI: Click Run button
        UI->>UI: Change agent state to Executing
        
        Note over UI,OutputBlock: Data Flow (BR-005, BR-006)
        
        UI->>+InputBlock: Process input "question"
        InputBlock->>InputBlock: Validate and prepare data
        InputBlock->>+AIBlock: Send to Prompt input (FR-QA-004)
        
        AIBlock->>AIBlock: Prepare AI request
        AIBlock->>+AIService: Send prompt for processing
        
        alt AI Service Available
            AIService->>AIService: Generate AI response
            AIService-->>-AIBlock: Return AI-generated answer
            AIBlock->>AIBlock: Receive response
            AIBlock->>+OutputBlock: Send to value input (FR-QA-005)
            
            OutputBlock->>OutputBlock: Store result
            OutputBlock-->>-AIBlock: Acknowledge
            AIBlock-->>-InputBlock: Processing complete
            InputBlock-->>-UI: Execution complete
            
            UI->>UI: Change agent state to Completed
            UI-->>-User: Display completion notification
            
            User->>+UI: Select View More (FR-QA-009)
            UI->>+OutputBlock: Request results
            OutputBlock-->>-UI: Return answer text
            UI-->>-User: Display AI-generated answer
            
        else AI Service Unavailable (Edge-Case-6)
            AIService-->>-AIBlock: Service error
            AIBlock-->>-InputBlock: Propagate error
            InputBlock-->>-UI: Execution failed
            UI->>UI: Change agent state to Error
            UI-->>-User: Display service unavailable error
        end
    end
    
    Note over User,OutputBlock: Alternative: View in Agent Outputs (FR-QA-010)
    User->>+UI: Navigate to Agent Outputs
    UI->>+OutputBlock: Request output
    OutputBlock-->>-UI: Return result
    UI-->>-User: Display result in Agent Outputs section
```

---

## Calculator Agent Execution Sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Visual Builder UI
    participant InputA as Input Block (a)
    participant InputB as Input Block (b)
    participant CalcBlock as Calculator Block
    participant CalcService as Calculation Service
    participant OutputBlock as Output Block
    
    Note over User,OutputBlock: Calculator Agent Execution Flow (FR-CALC-008)
    
    User->>+UI: Open Calculator Agent for execution
    UI-->>-User: Display agent interface with input fields
    
    User->>+UI: Enter value for a
    User->>UI: Enter value for b
    UI->>UI: Validate inputs are numeric
    
    alt Inputs are non-numeric (Edge-Case-4)
        UI-->>User: Display non-numeric error
        UI-->>-User: Prompt for valid numeric inputs
    else Inputs are valid
        User->>+UI: Click Run button
        UI->>UI: Change agent state to Executing
        
        Note over UI,OutputBlock: Data Flow through connected blocks (BR-005, BR-006)
        
        UI->>+InputA: Process input a
        UI->>+InputB: Process input b
        
        InputA->>InputA: Validate numeric value
        InputB->>InputB: Validate numeric value
        
        InputA->>+CalcBlock: Send to operand1 (FR-CALC-004)
        InputB->>+CalcBlock: Send to operand2 (FR-CALC-004)
        
        CalcBlock->>CalcBlock: Receive both operands
        
        alt Operation is divide AND b is zero (Edge-Case-5)
            CalcBlock->>CalcBlock: Detect division by zero
            CalcBlock-->>InputB: Invalid operand
            CalcBlock-->>-InputA: Invalid operand
            InputB-->>-UI: Error detected
            InputA-->>-UI: Error detected
            UI->>UI: Change agent state to Error
            UI-->>-User: Display division by zero error
        else Valid operation
            CalcBlock->>+CalcService: Request calculation<br/>(operation, a, b)
            CalcService->>CalcService: Perform calculation
            CalcService-->>-CalcBlock: Return result
            
            CalcBlock->>CalcBlock: Receive calculation result
            CalcBlock->>+OutputBlock: Send to value input (FR-CALC-005)
            
            OutputBlock->>OutputBlock: Store result
            OutputBlock-->>-CalcBlock: Acknowledge
            CalcBlock-->>InputB: Processing complete
            CalcBlock-->>-InputA: Processing complete
            InputB-->>-UI: Success
            InputA-->>-UI: Success
            
            UI->>UI: Change agent state to Completed
            UI-->>-User: Display completion notification
            
            User->>+UI: Navigate to Agent Outputs (FR-CALC-009)
            UI->>+OutputBlock: Request result
            OutputBlock-->>-UI: Return calculated value
            UI-->>-User: Display result in Agent Outputs
        end
    end
    
    Note over User,OutputBlock: Alternative: View More (FR-CALC-010)
    User->>+UI: Select View More option
    UI->>+OutputBlock: Request execution details
    OutputBlock-->>-UI: Return result and metadata
    UI-->>-User: Display detailed results
    
    Note over User,OutputBlock: Reusability: Run Again
    User->>+UI: Provide new inputs and run again
    Note over UI,OutputBlock: Sequence repeats with new values
    UI-->>-User: New results displayed
```

---

## Sequence Diagram Analysis

### Key Interactions

#### Q&A Agent
1. **User → UI**: Input submission and execution trigger
2. **UI → Input Block**: Input processing initiation
3. **Input Block → AI Text Generator**: Data flow via Prompt connection (FR-QA-004)
4. **AI Text Generator → AI Service**: Backend AI processing request
5. **AI Service → AI Text Generator**: Response return
6. **AI Text Generator → Output Block**: Response flow via value connection (FR-QA-005)
7. **Output Block → UI → User**: Result display (FR-QA-009, FR-QA-010)

#### Calculator Agent
1. **User → UI**: Multiple input submission (a, b)
2. **UI → Input Blocks**: Parallel input processing
3. **Input Blocks → Calculator**: Data flow via operand connections (FR-CALC-004)
4. **Calculator → Calculation Service**: Calculation request
5. **Calculation Service → Calculator**: Result return
6. **Calculator → Output Block**: Result flow via value connection (FR-CALC-005)
7. **Output Block → UI → User**: Result display (FR-CALC-009, FR-CALC-010)

### Error Handling Sequences
- **Empty Input** (Edge-Case-1): Early validation at UI level
- **AI Service Unavailable** (Edge-Case-6): Error propagation from service to user
- **Non-Numeric Input** (Edge-Case-4): Validation before processing
- **Division by Zero** (Edge-Case-5): Detection at Calculator Block level

### State Transitions
All sequences include state transitions:
- **Saved → Executing**: When Run is clicked
- **Executing → Completed**: When processing succeeds
- **Executing → Error**: When processing fails

### Activation Boxes
- Show active processing time for each participant
- Indicate when blocks are actively processing data
- Demonstrate parallel processing (Calculator receiving both inputs)

### Alternative Flows
- **alt** blocks show conditional behavior (error vs success paths)
- Demonstrates error handling integrated into main flow
- Shows different result viewing options

---

## Traceability Matrix for Sequence Diagrams

| Requirement ID | Sequence Element | Diagram Coverage |
|---------------|------------------|------------------|
| FR-QA-004 | Input → AI Text Generator (Prompt) | Q&A Diagram |
| FR-QA-005 | AI Text Generator (response) → Output | Q&A Diagram |
| FR-QA-008 | Run agent with input | Q&A Diagram |
| FR-QA-009 | View More option | Q&A Diagram |
| FR-QA-010 | Agent Outputs section | Q&A Diagram |
| FR-CALC-004 | Input Blocks → Calculator (operands) | Calculator Diagram |
| FR-CALC-005 | Calculator (result) → Output | Calculator Diagram |
| FR-CALC-008 | Execute calculation | Calculator Diagram |
| FR-CALC-009 | Agent Outputs display | Calculator Diagram |
| FR-CALC-010 | View More display | Calculator Diagram |
| BR-005 | Data flow pattern | Both Diagrams |
| BR-006 | Connection point purpose | Both Diagrams |
| Edge-Case-1 | Empty input handling | Q&A Diagram |
| Edge-Case-4 | Non-numeric input | Calculator Diagram |
| Edge-Case-5 | Division by zero | Calculator Diagram |
| Edge-Case-6 | Service unavailable | Q&A Diagram |

---

## Notes
- Sequence diagrams use solid arrows (->>) for synchronous calls
- Dashed arrows (-->) for responses
- Activation boxes (+/-) show processing duration
- alt blocks demonstrate conditional logic
- Notes provide context for requirement traceability
- Both diagrams follow the same structural pattern for consistency
