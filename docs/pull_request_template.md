## Feature Overview
- **Feature Name**: 
- **Target SRS ID**: `Feature XX` (e.g. Feature BM, Feature CF)
- **Author**: (Your name/github username)

## Problem
- [Provide a concise summary of what this feature accomplishes, why it was introduced, and how it improves the student learning experience.]

## Solution (Feature Description)
- [Provide a concise summary of what this feature accomplishes, why it was introduced, and how it improves the student learning experience.]

## User Interaction & Style
- [Describe the user interface elements and interaction flow (e.g., drag-and-drop tiles, sliders, custom graphics canvases, responsiveness).]

## Technical Implementation & Architecture
- [Explain how the feature is implemented technically. Mention core libraries used, state persistence mechanisms, or complex client-server APIs.]

## Dependencies & Feature Mocking
If your feature depends on a parent/companion feature that does not exist in the codebase yet:
- **Dependency Strategy**: Select how you handled the missing dependency:
  - [ ] **State/Function Mocking**: I used local mock state (`useState`), dummy variables, or utility stubs (describe below).
  - [ ] **Stacked PR**: This branch is stacked on another open PR. (Link to parent PR: #`PR_NUMBER`)
- **Mocking Details**: Briefly list what functions/states are stubbed (e.g., `mockCoinTally = 100`, empty API routes returning stubbed JSON) to help reviewers run your code without breaking.

---

## Technical & Quality Checklist
Please confirm your implementation satisfies the following code quality checks:
- [ ] **SRS Alignment**: The feature implements all corresponding functional requirements listed in `Tenali-SRS.md`.
- [ ] **Metacognitive/Pedagogical Scaffolding**: Checked that text/explanations avoid paragraphs exceeding 3 lines.
- [ ] **Resource Optimization (Audio)**: For audio elements, checked that a single shared/lazy-loaded `AudioContext` instance is reused to prevent browser leaks.
- [ ] **Memory Management (Canvas)**: Verified that animation loops (`requestAnimationFrame`) and resize event listeners are cancelled on component unmount.
- [ ] **State Persistence**: Verified that progress/configurations persist across reloads in `localStorage` or server databases where appropriate.
- [ ] **Clean Code**: No extraneous debug console logs or developer comment markers are left in production.
- [ ] **Documentation**: Updated the feature entries in `Tenali-SRS.md` and `attribution_matrix.md` accordingly.

---

## Verification & Acceptance Criteria
Please outline how you verified the Gherkin acceptance scenarios:
1. **Manual Validation Steps**:
   - Step 1: ...
   - Step 2: ...
2. **Local Build & Tests**:
   - Checked that `npm run dev` builds successfully without warnings.

---

## Feature Demo
Attach screenshots or screen recordings showcasing the final UI layout and user interaction:
| UI Component / View | Visual Demo |
| :--- | :--- |
| *[e.g., Setup Screen]* | *[Attach Screenshot or Video]* |
| *[e.g., Playing State]* | *[Attach Screenshot or Video]* |
