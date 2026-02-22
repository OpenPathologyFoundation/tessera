# SOP-001: Standard Operating Procedure

## Tessera — Operating Instructions

| Field | Value |
|-------|-------|
| **Document ID** | SOP-001 |
| **Version** | 1.0 |
| **Product** | Tessera |
| **Date Created** | 2026-02-18 |
| **Status** | Draft |
| **Parent Document** | DHF-001 |
| **Effective Date** | TBD (upon validation completion) |

---

## 1. Purpose

This Standard Operating Procedure provides step-by-step instructions for using the Tessera application to perform manual differential white blood cell counts on bone marrow aspirate and peripheral blood smears.

## 2. Scope

This SOP applies to all clinical laboratory personnel who use the Tessera application for manual differential counting. It covers the complete workflow from case entry to result documentation.

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
- Hands-on demonstration of Tessera application use

### 4.2 Equipment Requirements
- Laboratory workstation with supported web browser:
  - Google Chrome (current or previous major version)
  - Mozilla Firefox (current or previous major version)
  - Microsoft Edge (current or previous major version)
- Functional keyboard (standard QWERTY layout)
- Microscope with oil immersion objective (100x) for slide review
- Stained smear (Wright-Giemsa or equivalent)

### 4.3 Application Access
- Tessera application URL: `[configured per institution]`
- No login or account required
- Application loads entirely in the browser; no data is transmitted to any server

---

## 5. Procedure

### 5.1 Opening the Application

1. Open a supported web browser on the laboratory workstation.
2. Navigate to the Tessera application URL.
3. Verify that the application loads completely:
   - Page title displays "Tessera"
   - Counting table is visible
   - "Start Count" button is visible but disabled
   - Case number input field is empty and ready for input

**Troubleshooting**: If the application fails to load or displays an error about configuration, contact IT Support. Do not proceed with manual calculations.

### 5.2 Entering the Case Number

1. **Locate the specimen accession number** on the slide label or requisition form.
2. Click in the **"Case / Accession #"** input field.
3. Type the accession number exactly as it appears on the specimen label.
4. **CRITICAL: Verify the entered case number matches the specimen** by comparing the screen display with the slide label. This step prevents results from being attributed to the wrong patient.
5. The "Start Count" button will become enabled once a valid case number is entered.

**Acceptable formats**: Alphanumeric characters, hyphens, and forward slashes (e.g., S25-1234, H25-00567, 25-A/12345).

### 5.3 Selecting the Specimen Type

1. Use the **Specimen Type** dropdown to select the appropriate type:
   - **Bone Marrow** — for aspirate smear differentials
   - **Peripheral Blood** — for blood smear differentials
2. Verify the counting table displays the correct cell type categories:
   - **Bone Marrow**: blast, pro, gran, eryth, baso, eos, plasma, lymph, mono
   - **Peripheral Blood**: poly, band, lymph, mono, eos, baso, pro, blast, other
3. The specimen type selector will be locked once counting begins.

### 5.4 Starting the Count

1. Position the microscope slide for systematic review (e.g., start at one edge of the feathered zone).
2. Click the **"Start Count"** button.
3. The system will confirm counting mode is active:
   - "Start Count" button becomes disabled
   - Specimen type dropdown becomes locked
   - Keyboard input is now captured for counting
4. **Note**: The morphology comments field is available during counting. When you click in the comments field, keyboard input goes to the text field (not to cell counting). Click outside the field to resume counting.

### 5.5 Counting Cells

For each cell identified under the microscope, press the corresponding keyboard key:

#### Bone Marrow Key Mapping

| Key | Cell Type | Description |
|-----|-----------|-------------|
| **A** | blast | Myeloblasts |
| **S** | pro | Promyelocytes / Myelocytes |
| **D** | gran | Maturing granulocytes (metamyelocytes, bands, segs) |
| **F** | eryth | Erythroid precursors (all stages) |
| **Z** | baso | Basophils / Mast cells |
| **X** | eos | Eosinophils (all stages) |
| **C** | plasma | Plasma cells |
| **V** | lymph | Lymphocytes |
| **B** | mono | Monocytes |

#### Peripheral Blood Key Mapping

| Key | Cell Type | Description |
|-----|-----------|-------------|
| **A** | poly | Segmented neutrophils (polymorphonuclear) |
| **S** | band | Band neutrophils |
| **D** | lymph | Lymphocytes |
| **F** | mono | Monocytes |
| **Z** | eos | Eosinophils |
| **X** | baso | Basophils |
| **C** | pro | Immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes) |
| **V** | blast | Blasts |
| **B** | other | Other cells (e.g., nucleated RBCs — count but report separately) |

#### During Counting

- The **key mapping row** at the bottom of the table shows which key maps to which cell type — reference it as needed.
- Watch the **running total** in the rightmost column to track progress toward the minimum count.
- Percentages update in real time as you count.
- A brief **visual flash** on the cell confirms each keypress was registered.

#### Correcting a Miscount

If you press the wrong key:
- Hold **Shift** and press the **key of the cell type you want to correct** to subtract 1 from that cell.
- Then press the **correct key** to add 1 to the right cell type.
- **Example**: You pressed 'A' (blast) but meant 'V' (lymph). Press **Shift+A** to remove the blast, then press **V** to add the lymphocyte.
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

1. When the total count reaches or exceeds the minimum required:
   - **Bone Marrow**: 200 cells (institution configurable)
   - **Peripheral Blood**: 100 cells (institution configurable)
2. Click the **"Count Done"** button.
3. **If the count is below the minimum**, a warning dialog will appear:
   - Review the warning message.
   - If the specimen is adequate but hypocellular, click **"Continue"** to generate the output.
   - If you want to continue counting, click **"Cancel"** to return to counting mode.
4. After count completion:
   - The counting table locks (no further changes possible).
   - Output reports are generated in the tabbed output area.
   - Keyboard input is no longer captured.

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

#### Method 1: Enter New Case Number
1. Clear the current case number and type the new accession number.
2. A confirmation dialog will appear: "Changing the case number will clear all current count data. Continue?"
3. Click **OK** to clear all data and begin the new case.
4. Click **Cancel** to keep the current data and restore the previous case number.

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
Monthly or after any application update:
1. Perform the **VV-CALC-007 standard differential test**:
   - Enter: blast=2, pro=5, gran=60, eryth=10, baso=1, eos=3, plasma=2, lymph=12, mono=5 (total=100)
2. Verify all percentages match expected values exactly.
3. Document the QC check result.

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
| **Data Storage** | All count data exists only in browser memory. No data is transmitted to any server. No data is stored in permanent browser storage. |
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
6. **Keyboard key assignment is fixed per specimen type.** If institutional cell categories differ from the configured categories, contact the laboratory director to request a configuration change.

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

I have read and understand SOP-001 for the Tessera application. I have been trained on its use and am competent to perform manual differential counts using this tool.

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

## 13. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Laboratory Director | | | |
| Quality Manager | | | |
| Clinical User Representative | | | |
