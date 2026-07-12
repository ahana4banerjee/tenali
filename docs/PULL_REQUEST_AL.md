## Feature Overview
- **Feature Name**: Guided Learning Journey Checkpoints & Targeted Revision Loop
- **Target SRS ID**: `Feature AL`
- **Author**: ahana4banerjee

---

## Problem
Currently, students on the platform can access any math puzzle in any order, which frequently leads to cognitive overload and a disjointed learning experience. Additionally, when students undergo general assessments or checkpoints, there is no system in place to track specific gaps in their understanding, nor is there a structured way to guide them to revise only the concepts they answered incorrectly. 

---

## Solution (Feature Description)
We have introduced the **Guided Learning Journey** feature, which provides a structured, gated, and pedagogical learning pathway for students.

1. **Structured Topics & Concepts**: Topics must be unlocked in a sequential, prerequisite-based order (e.g., *Arithmetic Basics* must be cleared to unlock *Advanced Arithmetic*). Within each topic, concepts are mapped out on a vertical timeline path, unlocking sequentially as the preceding concept is completed.
2. **Milestone Gating (Checkpoint Gate)**: At the end of each topic timeline, a cumulative **15-question Checkpoint Quiz** is generated, drawing questions randomly from all constituent concepts of the topic. Clearing the checkpoint requires scoring **80% or higher** (at least 12/15 correct answers).
3. **Interactive Celebrations & Feedback**: 
   - **Passing**: Triggers a beautiful fullscreen interactive canvas confetti shower celebrating the student's mastery and unlocks the next topic.
   - **Failing**: Renders a supportive results layout displaying *"Oh no, it's okay"* alongside a styled, highlighted guidance card directing them to revise.
4. **Targeted Concept Revision Loop**: If a student fails the checkpoint, the system tracks the exact questions they answered incorrectly. 
   - The corresponding concepts are flagged as **`needs_revision`** in the database.
   - The UI overlays these concepts with an orange dashed border, a **`⚠️ Revision Required`** badge, and a **`↻`** rotation timeline node icon.
   - Flagged concepts remain playable. Completing the individual concept quiz successfully removes it from the revision list.
   - Retrying and passing the checkpoint quiz successfully automatically clears all remaining revision flags for the topic.

---

## User Interaction & Style
- **Homepage Banner**: Prominent premium entry banner placed right below the search bar row on the home menu, decorated with a smooth gradient background, hover translations, and interactive icons. It automatically hides when a search filter query is active to prevent layout clutter.
- **Vertical Timeline**: Renders concept cards sequentially with locking padlock overlays. Line connectors dynamically turn green as concepts are completed.
- **Revision Visuals**: Concepts requiring revision stand out with customized warm warning themes: dashed orange borders (`#ff9f43`), soft orange background tints (`rgba(255, 159, 67, 0.08)`), and rotatable timeline nodes (`↻`).
- **Checkpoint Gate Node**: Styled as a checkered flag terminal, turning orange/green when eligible or cleared.
- **Quiz progress dot track**: Tracks session progress question-by-question, lighting up green/red during grading.
- **Confetti Animation**: Renders dynamic falling confetti on a canvas layer matching the student's high-contrast theme, automatically clearing memory on completion.

---

## Technical Implementation & Architecture

### Database Schema
- **Collection**: `learningjourneyprogresses`
- **Fields**:
  - `completedConcepts`: Array of string keys.
  - `completedTopics`: Array of unlocked topic IDs.
  - `conceptsNeedingRevision`: Array of concept keys flagged for revision.
  - `latestCheckpointScore`: Map of topic IDs to their last checkpoint score.
  - `activeCheckpoint`: Restricts session-hijacking by keeping a secure subdocument of generated questions, prompts, and correct answers.

### Backend Controllers (`server/lil/learning_journey/controllers.js`)
- **Progression Computation**: Verifies topic unlocks and computes active states (`locked`, `completed`, `playable`, `needs_revision`) dynamically.
- **Sequential Validation**: Blocks unauthorized API requests to complete locked concepts.
- **Loopback Solver**: Since some concept APIs do not expose answers on standard GET requests to prevent client-side cheating, `getQuestionForConcept` intercepts empty answers and makes a loopback POST request to the check API with `solve: true`. This resolves the correct answer on the fly on the server side and falls back to text-formatted prompts if standard ones are absent.
- **Grading & Flagging**: Compares submissions to active checkpoint records, calculates percentages, and updates user progress parameters (saving wrong keys to `conceptsNeedingRevision` or clearing topic completions).

### Frontend Routing & Hooks (`client/src/App.jsx`)
- Integrates sub-views `learning_journey`, `learning_journey_topic`, and `learning_journey_checkpoint` in the App shell navigation.
- **Completion Check Interceptor**: Navigating away mid-quiz is detected by scanning the DOM for the presence of the `.final-score` marker element; aborting the quiz prevents the concept from being registered as complete.

---

## Dependencies & Feature Mocking
- **Dependency Strategy**: 
  - [x] **State/Function Mocking**
- **Mocking Details**: 
  - The loopback resolver includes standard stubs (`spot`/`guess` keys) for client-only fallback routes, ensuring compilation and testing are unaffected if specific microservices are down.
  - Added a Mongoose connection timeout fallback of 10s to gracefully manage slower Mongo service starts on local machines.

---

## Technical & Quality Checklist
- [x] **SRS Alignment**: Features conform directly to gating requirements.
- [x] **Metacognitive/Pedagogical Scaffolding**: Checked that quiz instruction labels and warning alerts are kept under 3 lines.
- [x] **Memory Management (Canvas)**: Verified that the canvas confetti rain cancels its `requestAnimationFrame` loop, resizes events, and garbage collects particles immediately upon component unmount.
- [x] **State Persistence**: User progression, checkpoints, and revision lists are fully persisted in MongoDB.
- [x] **Clean Code**: No console logs or active debugger comments are left in production files.
- [x] **Documentation**: Updated `Feature_Checkpoint_Plan.md` and walkthrough logs.

---

## Verification & Acceptance Criteria

### 1. Manual Validation Steps
- **Step 1**: Run the database reset script (`node reset_completed_topics.js`) to wipe progress.
- **Step 2**: Open the homepage, click the **Guided Learning Journey** banner. Confirm that *Arithmetic Basics* is unlocked, and its first concept *Addition* is playable, while all others are locked.
- **Step 3**: Complete all constituent concepts sequentially. Confirm that the *Checkpoint Gate* unlocks.
- **Step 4**: Launch the checkpoint quiz and intentionally fail (answer questions incorrectly). 
  - Confirm the heading shows *"Oh no, it's okay"*.
  - Confirm that the wrong concepts now show the dashed border, **`⚠️ Revision Required`** badge, and **`↻`** icon.
- **Step 5**: Complete one of the revision concepts. Confirm it returns to a completed state (checkmark icon).
- **Step 6**: Relaunch the checkpoint quiz and score $\ge 80\%$.
  - Confirm the fullscreen canvas confetti celebrate success.
  - Confirm all remaining revision-needed badges disappear.
  - Confirm the next topic *Advanced Arithmetic & Finance* is unlocked.

### 2. Local Build & Tests
- Ran `npm run build` in the `client` directory:
  ```bash
  vite v8.0.0 building client environment for production...
  ✓ built in 1.78s
  ```
- Executed progression validation tests successfully.

---

## Feature Demo

| UI Component / View | Visual Demo |
--- | ---
| **Guided Learning Journey Entrance** | *[Insert Homepage Banner Screenshot]* |
| **Gated Concept Timeline** | *[Insert Timeline locks & padlocks Screenshot]* |
| **Concept Needing Revision** | *[Insert Dashed border & ⚠️ Revision Required badge Screenshot]* |
| **Checkpoint Passed Confetti** | *[Insert Canvas celebration animation Screenshot]* |
| **Checkpoint Failed Screen** | *[Insert "Oh no, it's okay" & Highlighted alert box Screenshot]* |
