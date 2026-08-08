# SOP-001: Standard Operating Procedure

## WBC ΔΣ — Operating Instructions

| Field | Value |
|-------|-------|
| **Document ID** | SOP-001 |
| **Version** | 2.1 |
| **Product** | WBC ΔΣ |
| **Date Created** | 2026-02-18 |
| **Status** | **Issued for local adoption** — to be reviewed and signed by the adopting laboratory. Key mappings, targets and completion behaviour corrected 2026-08-06 against the shipped profile (DCR-015); any locally printed copy of v1.0 must be withdrawn. |
| **Parent Document** | DHF-001 |
| **Effective Date** | TBD (upon validation completion) |

---

## 1. Purpose

This Standard Operating Procedure provides step-by-step instructions for using the WBC ΔΣ application to perform manual differential white blood cell counts on bone marrow aspirate and peripheral blood smears.

## 2. Scope

This SOP applies to all clinical laboratory personnel who use the WBC ΔΣ application for manual differential counting. It covers the complete workflow from case entry to result documentation.

## 3. Responsibilities

| Role | Responsibility |
|------|---------------|
| Medical Technologist (MT/MLS) | Perform counts according to this SOP; verify case number against specimen |
| Pathologist | Review results; perform verification counts as needed |
| Laboratory Supervisor | Ensure staff training on this SOP; monitor compliance |
| Laboratory Director | Approve SOP; ensure adequate training program |
| IT Support | Maintain application deployment; browser updates |

## 4. Prerequisites

### 4.1 Training Requirements
- Completion of laboratory orientation
- Competency assessment in manual differential counting (per CAP HEM.30550)
- Review of this SOP with supervisor sign-off
- Hands-on demonstration of WBC ΔΣ application use

### 4.2 Equipment Requirements
- Laboratory workstation with supported web browser:
  - Google Chrome (current or previous major version)
  - Mozilla Firefox (current or previous major version)
  - Microsoft Edge (current or previous major version)
- Functional keyboard (standard QWERTY layout)
- Microscope with oil immersion objective (100x) for slide review
- Stained smear (Wright-Giemsa or equivalent)

### 4.3 Application Access
- WBC ΔΣ application URL: `[configured per institution]`
- No login or account required
- Application loads entirely in the browser; no data is transmitted to any server

---

## 5. Procedure

### 5.1 Opening the Application

1. Open a supported web browser on the laboratory workstation.
2. Navigate to the WBC ΔΣ application URL.
3. Verify that the application loads completely:
   - Page title displays "WBC ΔΣ"
   - The case-entry screen is visible
   - "Start Count" button is visible and **enabled**
   - Case number input field is empty and ready for input

**Troubleshooting**: If the application fails to load or displays an error about configuration, contact IT Support. Do not proceed with manual calculations.

### 5.2 Entering the Case Number

1. **Locate the specimen accession number** on the slide label or requisition form.
2. Click in the **"Case / Accession #"** input field.
3. Type the accession number exactly as it appears on the specimen label.
4. **CRITICAL: Verify the entered case number matches the specimen** by comparing the screen display with the slide label. This step prevents results from being attributed to the wrong patient.
5. **The application does not enforce this step.** Every shipped profile sets
   `requireCaseNumber: false`, so "Start Count" is enabled with the field empty
   and a count can be completed without an identifier. Entering it is a
   procedural control owned by this SOP, not a software control — which is why
   step 4 is marked CRITICAL. A laboratory that wants the software to enforce it
   sets `requireCaseNumber: true` in its profile (Configuration Editor).

**Acceptable formats**: Alphanumeric characters, hyphens, and forward slashes (e.g., S25-1234, H25-00567, 25-A/12345).

### 5.3 Selecting the Specimen Type

1. Use the **Specimen Type** dropdown to select the appropriate type:
   - **Bone Marrow** — for aspirate smear differentials
   - **Peripheral Blood** — for blood smear differentials
2. Verify the counting table displays the cell type categories your profile
   defines. For the shipped profile these are:
   - **Bone Marrow**: nrbc, blasts, pro, myelo, meta, plasma, mast, bands, poly, baso, eos, mono, lymph, other
   - **Peripheral Blood**: nrbc, blasts, pro, myelo, meta, plasma, mast, bands, poly, baso, eos, mono, lymph, other
3. The specimen type can be changed during counting. Doing so saves the count in
   progress to the session history first and starts a fresh tally (URS-013).

### 5.4 Starting the Count

1. Position the microscope slide for systematic review (e.g., start at one edge of the feathered zone).
2. Click the **"Start Count"** button.
3. The system will confirm counting mode is active:
   - The counting grid and the running total appear
   - Keyboard input is now captured for counting
4. **Note**: The morphology comments field is available during counting. When you click in the comments field, keyboard input goes to the text field (not to cell counting). Click outside the field to resume counting.

### 5.5 Counting Cells

For each cell identified under the microscope, press the corresponding keyboard key:

#### Bone Marrow Key Mapping

Generated from the shipped profile `ndc-14 (formerly consensus-14)` v2.6. **The
authoritative mapping is always the key display on the counting screen** — keys
are configurable, and a laboratory that adapts the profile changes them.

| Key | Cell Type | Description |
|-----|-----------|-------------|
| **Q** | other | Other cells |
| **W** | mast | Mast cells |
| **E** | plasma | Plasma cells |
| **R** | pro | Promyelocytes |
| **A** | mono | Monocytes |
| **S** | lymph | Lymphocytes |
| **D** | bands | Band neutrophils |
| **F** | poly | Segmented neutrophils |
| **G** | eos | Eosinophils |
| **Z** | baso | Basophils |
| **X** | blasts | Blasts |
| **C** | meta | Metamyelocytes |
| **V** | myelo | Myelocytes |
| **B** | nrbc | Nucleated red blood cells (erythroid precursors) |

#### Peripheral Blood Key Mapping

| Key | Cell Type | Description |
|-----|-----------|-------------|
| **Q** | other | Other cells |
| **W** | mast | Mast cells |
| **E** | plasma | Plasma cells |
| **R** | pro | Promyelocytes |
| **A** | mono | Monocytes |
| **S** | lymph | Lymphocytes |
| **D** | bands | Band neutrophils |
| **F** | poly | Segmented neutrophils |
| **G** | eos | Eosinophils |
| **Z** | baso | Basophils |
| **X** | blasts | Blasts |
| **C** | meta | Metamyelocytes |
| **V** | myelo | Myelocytes |
| **B** | nrbc | Nucleated red blood cells (erythroid precursors) |

#### During Counting

- The **key mapping row** at the bottom of the table shows which key maps to which cell type — reference it as needed.
- Watch the **running total** to track progress toward the target count.
- Percentages update in real time as you count.
- A brief **visual flash** on the cell confirms each keypress was registered.

#### Correcting a Miscount

If you press the wrong key:
- Hold **Shift** and press the **key of the cell type you want to correct** to subtract 1 from that cell.
- Then press the **correct key** to add 1 to the right cell type.
- **Example** (default profile, §4.1): you pressed **'X'** (blasts) but meant
  **'S'** (lymphocytes). Press **Shift+X** to remove the blast, then press **S**
  to add the lymphocyte.
- **The keys above are those of the shipped default profile.** If your
  laboratory has loaded a different profile, read the key from the cell's own
  tile on screen — every tile shows its key beneath the count.
- A cell count cannot go below zero.

### 5.6 Recording Morphology Observations

During or after counting, you may enter morphology observations:

1. Click in the **Morphology Comments** text field.
2. Type your observations (maximum 500 characters).
3. Click outside the field to resume keyboard counting.

**Common morphology findings to document**:
- Toxic granulation, Dohle bodies, vacuolization
- Auer rods, Phi bodies
- Hypersegmented neutrophils
- Dysplastic changes (nuclear, cytoplasmic)
- Left shift / immature forms
- Atypical lymphocytes
- Rouleaux formation
- Red cell morphology (if relevant to case)

### 5.7 Completing the Count

1. Count toward the target for the specimen:
   - **Bone Marrow**: 500 cells (profile configurable)
   - **Peripheral Blood**: 200 cells (profile configurable)

   The target is **advisory, not enforced** (URS-041). Nothing blocks you from
   finishing earlier or continuing beyond it.
2. Click the **"Count Done"** button.
3. **If the count is below the target**, the results screen carries an advisory
   stating the count reached and the confidence interval it supports. It does
   not block, and there is no dialog to dismiss. Judge whether the count is
   adequate for the question being asked.
4. After count completion:
   - Keyboard counting stops, and further keystrokes cannot alter the tally.
   - Output reports are generated in the tabbed output area.
   - **"Continue Counting"** returns to counting with the tally intact if you
     decide more cells are needed — for example when an advisory says the count
     does not resolve a diagnostic threshold.

### 5.8 Reviewing and Copying Output

1. Review the generated output in the tabbed output area.
2. Click on different **tabs** to view different institutional templates (if multiple are available).
3. **Verify the output includes**:
   - Correct case/accession number
   - Correct total cell count
   - Reasonable percentages (spot-check against the table)
   - Morphology comments (if entered)
4. Click the **"Copy to Clipboard"** button on the desired template tab.
5. A brief "Copied!" confirmation will appear.
6. Navigate to your Laboratory Information System (LIS) or Electronic Medical Record (EMR).
7. Paste the output into the appropriate field (Ctrl+V or Cmd+V).
8. **Verify the pasted result** in the LIS/EMR before saving.

### 5.9 Starting a New Case

#### Method 1: New Case (from the results screen)
1. Finish the current count with **Count Done**.
2. Click **New Case**. The application returns to the case-entry screen with an
   empty case field, ready for the next specimen.
3. The completed count remains in Session History for the rest of the browser
   session (§5.10).

**The case number cannot be edited mid-count.** The field exists only on the
case-entry screen; during counting the case is shown as a read-only badge. There
is no change-the-case-number dialog — to correct a mistyped accession number,
finish or **Reset** the count and start again.

#### Method 2: Reset Button
1. Click the **"Reset"** button.
2. If count data exists, a confirmation dialog will appear.
3. Confirm to clear all data.
4. The application returns to the initial state with the cursor in the case number field.

### 5.10 Reviewing Session History

1. Click the **Session History** panel to expand it.
2. Previously completed counts during this browser session are listed by case number and timestamp.
3. Click an entry to view the completed count data in a **read-only** overlay.
4. **IMPORTANT**: Session history is temporary. It is lost when the browser tab or window is closed.
5. Session history is provided as a convenience for in-session review only. It is **not** a permanent medical record.

---

## 6. Quality Control

### 6.1 Pre-Use Verification
Before first use each day (or after application updates):
1. Load the application.
2. Enter a test case number "QC-TEST".
3. Count 5 cells of 2 different types.
4. Verify counts increment correctly.
5. Verify percentages are mathematically correct.
6. Verify Shift+key decrement works.
7. Click Count Done and verify output.
8. Reset the application.

### 6.2 Periodic Verification
Monthly or after any application update, on the **default profile** (§4.1):

1. Start a bone marrow count and enter this 100-cell vector. The key for each
   category is given first; each tile also shows its key on screen.

   | Key | Category | Count | Expected % |
   |-----|----------|-------|-----------|
   | X | blasts | 2 | 2% |
   | R | pro | 5 | 5% |
   | V | myelo | 20 | 20% |
   | C | meta | 20 | 20% |
   | D | bands | 20 | 20% |
   | F | poly | 10 | 10% |
   | B | nrbc | 10 | 10% |
   | Z | baso | 1 | 1% |
   | G | eos | 3 | 3% |
   | E | plasma | 2 | 2% |
   | S | lymph | 5 | 5% |
   | A | mono | 2 | 2% |

2. Verify the grand total reads **100**, every percentage matches the table, and
   the percentages **sum to exactly 100.0%**.
3. Verify the **M:E ratio reads 8.3:1** with interval **4.4–15.8**.
4. Document the QC check result.

**If any figure differs**, stop and follow §6.3. Do not adjust the software.

*(The automated suite verifies the same arithmetic continuously; the register of
implemented verification cases is in VV-001 §4. This monthly check confirms the
deployed instance behaves as the verified build does.)*

### 6.3 Discrepancy Handling
If the application produces unexpected results:
1. **Stop** — do not use the result for patient care.
2. Document the discrepancy (screenshot if possible).
3. Notify the laboratory supervisor.
4. Perform the count manually (pen/paper or backup counter).
5. File a problem report per institutional procedure.

---

## 7. Data Handling and Privacy

| Concern | Policy |
|---------|--------|
| **Data Storage** | No data is transmitted to any server. Counts, the case/accession number and morphology comments are written to **browser localStorage** by the autosave feature, so an interrupted count can be recovered; that record persists on the workstation until the count is completed, reset, or the browser's site data is cleared. Session history and the active configuration also persist locally. **On a shared workstation, treat the browser profile as holding patient-identifiable data** and either use non-identifying case references or clear site data between operators. Autosave can be disabled per profile (`autosave: false`). |
| **Session History** | Stored in browser sessionStorage; automatically cleared when the tab/window is closed. |
| **Patient Information** | Only the accession number is entered. No patient name, DOB, or other PHI is captured by the application. |
| **Data of Record** | The application is a **counting aid**. The data of record is what is entered into the LIS/EMR. The application does not replace the LIS. |

---

## 8. Troubleshooting

| Issue | Possible Cause | Resolution |
|-------|---------------|-----------|
| Application does not load | Server unavailable; network issue | Check URL; verify network connection; contact IT |
| "Configuration could not be loaded" | templates.json missing or corrupt | Contact IT; do not use until resolved |
| Keypresses not registering | Counting not started; focus in comments field; browser focus lost | Click Start Count; click outside comments field; click on the application window |
| Unexpected percentages | Verify count values are correct | Cross-check manually; if software error, file problem report |
| Copy to Clipboard fails | Browser permissions; older browser | Manually select and copy text; try different browser |
| Session history empty after reload | sessionStorage cleared | Expected behavior if browser was closed; session history is temporary |

---

## 9. Limitations and Warnings

1. **This application is a counting and calculation aid.** It does not perform cell identification or diagnosis.
2. **All cell identification decisions are made by the operator.** The software only tallies what the operator classifies.
3. **Session data is temporary.** Do not rely on the application for data retention. Always copy results to the LIS/EMR before closing.
4. **The application does not replace the LIS.** The LIS is the system of record for all patient results.
5. **Accuracy depends on operator training.** The software cannot detect miscategorization of cells — only that a key was pressed.
6. **Cell categories and their keys are configurable, not fixed.** The
   Configuration Editor (linked from the case-entry screen) changes
   categories, keys, targets and report wording. **Treat a configuration
   change as a change to a controlled document**: agree it with the
   laboratory director, record it, and re-run §6.2 afterwards, because
   every key in this procedure and every figure in §6.2 assumes the
   shipped default profile.

---

## 10. References

| Document | Title |
|----------|-------|
| URS-001 | User Requirements Specification |
| SRS-001 | System Requirements Specification |
| VV-001 | Verification & Validation Protocol |
| CLSI H20-A2 | Reference Leukocyte (WBC) Differential Count |
| CAP HEM.30550-30600 | Manual Differential Count Requirements |

---

## 11. Training Acknowledgment

I have read and understand SOP-001 for the WBC ΔΣ application. I have been trained on its use and am competent to perform manual differential counts using this tool.

| Name (Print) | Signature | Date | Trainer |
|--------------|-----------|------|---------|
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

---

## 12. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-02-18 | QMS | Initial draft - complete SOP |
| B | 2026-08-06 | QMS | v2.0 (DCR-015): key tables regenerated from the shipped profile after the v2.0 layout change; operator documentation aligned with the 14-category profile. |
| C | 2026-08-08 | QMS | v2.1 (DCR-038): pre-validation corrections. §5.5 miscount example named keys that do not do what it said (A was called blasts; A is monocytes). §6.2 monthly QC entered categories the profile does not have and cited a test that does not exist; replaced with an engine-derived 100-cell vector. §8 attested that nothing is written to permanent browser storage, which autosave contradicts. §5.1/§5.2 described a Start button gated on a case number, which was never built — the identification check is procedural and is now stated as such. §5.9 Method 1 described a case-number-change dialog that does not exist. §7 item 6 said keys are fixed, contradicting §4.1 and the Configuration Editor. Profile version stamp corrected to v2.6. |

## 13. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Laboratory Director | | | |
| Quality Manager | | | |
| Clinical User Representative | | | |
