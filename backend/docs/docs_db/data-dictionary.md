# EVIDEA — Data Dictionary

> **Version:** 1.1
>
> **Last updated:** 2026-11-15
>
> **System:** EVIDEA — Multimodal Clinical Decision Support System for Rare Disease Diagnosis
>
> **Database:** PostgreSQL 15+ (schema verified on PostgreSQL 16)

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Domain Map](#2-domain-map)
3. [Table and Column Reference](#3-table-and-column-reference)
4. [Data Quality Requirements](#4-data-quality-requirements)

---

## 1. Architectural Overview

### 1.1 Database Purpose

EVIDEA uses a single operational PostgreSQL database that serves both the clinical
workflow (case entry, prediction, review) and the application layer (authentication,
logging). The ML model is trained offline on a separate de-identified research dataset;
only the trained model artifacts and their metadata are registered in the production
database through the `ModelVersions` table.

### 1.2 Logical Layers

The database is organized into four logical layers based on the data lifecycle:

#### Application Layer

- **Purpose:** Authentication, authorization, audit logging
- **Tables:** `DoctorsAndAdmin`, `Roles`, `Invitations`, `SystemLogs`

#### Operational Layer

- **Purpose:** Clinical workflow, patient records, cases, data entry
- **Tables:** `Patients`, `Cases`, `CaseAnamneses`, `VitalSigns`, `LabReports`, `LabResultsItems`, `Case_Vital_Signs`, `Case_Lab_Reports`

#### Analytical Layer

- **Purpose:** ML predictions, explanations, disease reference
- **Tables:** `PredictionRuns`, `DiseaseHypotheses`, `PredictionExplanation`, `ModelVersions`, `Diseases`

#### Reference Layer

- **Purpose:** Lab catalog (read-heavy, rarely updated)
- **Tables:** `LabCategories`, `LabPanels`, `LabAnalytes`



| Layer | Purpose | Write frequency | Read frequency |
|-------|---------|----------------|----------------|
| **Application** | User management, RBAC, audit trail | Low–Medium | Medium |
| **Operational** | Core clinical workflow data | High (per case submission) | High |
| **Analytical** | ML inference results and explanations | Medium (per prediction run) | High |
| **Reference** | Laboratory and disease catalogs | Rare (admin-managed) | High |

### 1.3 Justification

A single-database design was chosen over a multi-database architecture (e.g.,
separate OLTP and analytical stores) for the following reasons:

- **MVP scope:** The prototype serves a limited number of concurrent users and does
  not require horizontal scaling of reads and writes independently.
- **Transactional integrity:** A case submission, prediction run, and explanation
  storage occur within a single workflow and benefit from ACID guarantees.
- **Operational simplicity:** A solo-developer project (Constraint: Resources) must
  minimize infrastructure complexity.
- **Future extensibility:** The logical layer separation allows migration to a
  read-replica or event-driven architecture if the system scales beyond the MVP.

### 1.4 Separation from ML Training Data

| Concern | Production DB | Research Dataset |
|---------|--------------|-----------------|
| Purpose | Clinical workflow and predictions | Model training and evaluation |
| Data | Patient records created by clinicians | De-identified / synthetic cases |
| PII | Yes (name, email, etc.) — access-controlled | No — fully de-identified |
| Access | Clinicians, admins via RBAC | Data & ML team only |
| Regulation | GDPR Art. 6(1)(f) | GDPR Art. 9(2)(j) / synthetic |

The trained model is registered in `ModelVersions` with its `artifact_uri` pointing
to the model storage. The production database never stores raw training data.

---

## 2. Domain Map

### 2.1 Domain Color Coding

| Color | Domain | Tables |
|-------|--------|--------|
| 🟣 Purple | Clinical / Patient | Patients, Cases, CaseAnamneses, VitalSigns |
| 🟢 Green | Laboratory | LabCategories, LabPanels, LabAnalytes, LabReports, LabResultsItems |
| 🔵 Blue | Auth & Access | DoctorsAndAdmin, Roles, Invitations |
| 🟠 Orange | ML & Predictions | PredictionRuns, ModelVersions, Diseases, DiseaseHypotheses, PredictionExplanation |
| 🔴 Red | Audit | SystemLogs |
| ⬜ White | Junction | Case_Vital_Signs, Case_Lab_Reports |

### 2.2 Entity-Relationship Summary

#### Database Relationships

##### 1. Patient and Clinical Records
- `Patients` 1:N `Cases`
- `Patients` 1:N `VitalSigns`
- `Patients` 1:N `LabReports`
- `Patients` 1:N `CaseAnamneses`
- `Cases` 1:N `CaseAnamneses`
- `Cases` M:N `VitalSigns` via `Case_Vital_Signs`
- `Cases` M:N `LabReports` via `Case_Lab_Reports`

##### 2. Clinical Decision Support
- `Cases` 1:N `PredictionRuns`
- `PredictionRuns` 1:N `DiseaseHypotheses`
- `DiseaseHypotheses` 1:N `PredictionExplanation`
- `Diseases` 1:N `DiseaseHypotheses`
- `ModelVersions` 1:N `PredictionRuns`

##### 3. Users and Access Management
- `Roles` 1:N `DoctorsAndAdmin`
- `DoctorsAndAdmin` 1:N `Cases` (`created_by`)
- `DoctorsAndAdmin` 1:N `PredictionRuns` (`initiated_by`)
- `DoctorsAndAdmin` 1:N `Invitations`
- `DoctorsAndAdmin` 1:N `SystemLogs`

##### 4. Laboratory Reference Data
- `LabCategories` 1:N `LabPanels`
- `LabPanels` 1:N `LabAnalytes`
- `LabReports` 1:N `LabResultsItems`
- `LabAnalytes` 1:N `LabResultsItems`


---

## 3. Table and Column Reference

### Notation

| Abbreviation | Meaning |
|---|---|
| PK | Primary Key |
| FK | Foreign Key |
| NN | NOT NULL |
| UQ | UNIQUE |
| IDX | Indexed (recommended) |
| — | Nullable, no constraint |

---

### 3.1 Clinical / Patient Domain 🟣

#### `Patients`

Stores patient records created and managed by authorized clinicians. Contains PII
for clinical identification purposes. Access restricted by RBAC (NFR-S2).

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `patient_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique patient identifier |
| 2 | `name` | `TEXT` | NN | Patient's first name |
| 3 | `surname` | `TEXT` | NN | Patient's last name |
| 4 | `birth_date` | `DATE` | NN | Date of birth |
| 5 | `sex` | `VARCHAR(64)` | NN | Biological sex. Allowed values: `male`, `female`, `other`, `unknown` (CHECK, DQ-26) |
| 6 | `email` | `TEXT` | NN | Contact email |
| 7 | `phone_number` | `TEXT` | — | Contact phone number (optional) |
| 8 | `created_at` | `DATE` | NN, default `CURRENT_DATE` | Date the record was created |
| 9 | `updated_at` | `TIMESTAMPTZ` | NN, default `now()` | Last modification timestamp |
| 10 | `deleted_at` | `TIMESTAMPTZ` | — | Soft-delete timestamp. `NULL` = active |

**Indexes:** `patient_id` (PK), `(surname, name)` (search), `deleted_at` (filter active).

**Soft delete:** Records are never physically removed; `deleted_at IS NULL` filters active patients.

---

#### `Cases`

Represents a clinical assessment case created by a clinician for a specific patient.
Central entity linking patient data to predictions.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `case_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique case identifier |
| 2 | `patient_id` | `UUID` | FK → `Patients.patient_id`, NN | Patient this case belongs to |
| 3 | `created_by` | `UUID` | FK → `DoctorsAndAdmin.doc_id`, NN | Clinician who created the case |
| 4 | `created_at` | `TIMESTAMPTZ` | NN, default `now()` | Case creation timestamp |
| 5 | `updated_at` | `TIMESTAMPTZ` | NN, default `now()` | Last modification timestamp |

**Indexes:** `case_id` (PK), `patient_id` (lookup), `created_by` (audit).

---

#### `CaseAnamneses`

Stores the clinical narrative (anamnesis) associated with a case. Contains free-text
fields that serve as input to the NLP (Transformer) branch of the ML pipeline.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `anamnesis_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique anamnesis identifier |
| 2 | `patient_id` | `UUID` | FK → `Patients.patient_id`, NN | Patient whose anamnesis this is |
| 3 | `case_id` | `UUID` | FK → `Cases.case_id`, NN | Case this anamnesis belongs to |
| 4 | `created_by_id` | `UUID` | FK → `DoctorsAndAdmin.doc_id`, NN | Clinician who entered the data |
| 5 | `clinical_notes` | `TEXT` | — | Free-text clinical notes and observations |
| 6 | `chief_complaint` | `TEXT` | NN | Primary reason for the consultation |
| 7 | `family_history` | `TEXT` | — | Relevant family medical history |
| 8 | `medications` | `TEXT` | — | Current medications |
| 9 | `symptoms_duration` | `TEXT` | — | Duration and progression of symptoms |
| 10 | `past_med_history` | `TEXT` | — | Past medical history |
| 11 | `allergies` | `TEXT` | — | Known allergies |
| 12 | `created_at` | `TIMESTAMPTZ` | NN, default `now()` | Record creation timestamp |
| 13 | `updated_at` | `TIMESTAMPTZ` | NN, default `now()` | Last modification timestamp |

**Indexes:** `anamnesis_id` (PK), `case_id` (lookup), `patient_id` (patient history).

**ML relevance:** Fields 5–11 are concatenated and tokenized by the Transformer model during inference. The `input_snapshot` in `PredictionRuns` captures the text at prediction time.

---

#### `VitalSigns`

Stores a set of vital sign measurements for a patient. Linked to specific cases
through the `Case_Vital_Signs` junction table.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `vital_sign_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique measurement set identifier |
| 2 | `patient_id` | `UUID` | FK → `Patients.patient_id`, NN | Patient measured |
| 3 | `weight_kg` | `NUMERIC(5,1)` | — | Body weight in kilograms (e.g., 72.5) |
| 4 | `systolic_bp_mmhg` | `INT` | — | Systolic blood pressure in mmHg |
| 5 | `diastolic_bp_mmhg` | `INT` | — | Diastolic blood pressure in mmHg |
| 6 | `heart_rate_bpm` | `INT` | — | Heart rate in beats per minute |
| 7 | `respiratory_rate` | `INT` | — | Respiratory rate in breaths per minute |
| 8 | `body_temp_celsius` | `NUMERIC(4,1)` | — | Body temperature in °C (e.g., 36.6) |
| 9 | `spo2_percent` | `INT` | — | Oxygen saturation as percentage (0–100) |
| 10 | `created_at` | `TIMESTAMPTZ` | NN, default `now()` | Measurement timestamp |
| 11 | `updated_at` | `TIMESTAMPTZ` | NN, default `now()` | Last modification timestamp |

**Indexes:** `vital_sign_id` (PK), `patient_id` (patient history).

**Note:** All measurement fields are nullable — the system applies the missing-data handling rule during processing (UC-1, step 6a).

---

### 3.2 Junction Tables ⬜

#### `Case_Vital_Signs`

Many-to-many relationship between Cases and VitalSigns. Allows a single vital sign
measurement set to be referenced by multiple cases for the same patient.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `vital_sign_id` | `UUID` | PK, FK → `VitalSigns.vital_sign_id`, NN | Vital signs record |
| 2 | `case_id` | `UUID` | PK, FK → `Cases.case_id`, NN | Case that includes these vital signs |
| 3 | `created_at` | `TIMESTAMPTZ` | NN, default `now()` | When the link was created |

**Primary Key:** Composite `(vital_sign_id, case_id)` — prevents duplicate links.

---

#### `Case_Lab_Reports`

Many-to-many relationship between Cases and LabReports. A clinician selects which
existing lab reports are relevant when building a case.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `report_id` | `UUID` | PK, FK → `LabReports.report_id`, NN | Lab report |
| 2 | `case_id` | `UUID` | PK, FK → `Cases.case_id`, NN | Case that includes this report |
| 3 | `created_at` | `TIMESTAMPTZ` | NN, default `now()` | When the link was created |

**Primary Key:** Composite `(report_id, case_id)` — prevents duplicate links.

---

### 3.3 Laboratory Domain 🟢

#### `LabCategories`

Top-level grouping of laboratory test panels (e.g., "Hematology", "Biochemistry").
Reference data managed by administrators.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `category_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique category identifier |
| 2 | `code` | `VARCHAR(30)` | NN, UQ | Short code (e.g., `HEM`, `BIO`) |
| 3 | `name` | `VARCHAR(100)` | NN | Display name (e.g., "Hematology") |
| 4 | `is_active` | `BOOL` | NN, default `TRUE` | Whether this category is available for use |

---

#### `LabPanels`

A panel is a group of related analytes within a category (e.g., "Complete Blood
Count" under Hematology).

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `panel_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique panel identifier |
| 2 | `category_id` | `UUID` | FK → `LabCategories.category_id`, NN | Parent category |
| 3 | `code` | `VARCHAR(30)` | NN, UQ | Short code (e.g., `CBC`) |
| 4 | `name` | `VARCHAR(150)` | NN | Display name (e.g., "Complete Blood Count") |
| 5 | `is_active` | `BOOL` | NN, default `TRUE` | Whether this panel is available |

**Indexes:** `panel_id` (PK), `category_id` (lookup).

---

#### `LabAnalytes`

Individual measurable substances or parameters within a panel (e.g., "Hemoglobin",
"White Blood Cell count"). Defines the expected unit and data type.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `analyte_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique analyte identifier |
| 2 | `panel_id` | `UUID` | FK → `LabPanels.panel_id`, NN | Parent panel |
| 3 | `code` | `VARCHAR(50)` | NN, UQ | LOINC-style code or internal code |
| 4 | `name` | `VARCHAR(150)` | NN | Display name (e.g., "Hemoglobin") |
| 5 | `unit` | `VARCHAR(30)` | — | Unit of measurement (e.g., `g/dL`, `mmol/L`) |
| 6 | `data_type` | `VARCHAR(20)` | NN | Expected value type: `numeric`, `text`, `boolean` (CHECK; not a PostgreSQL ENUM) |
| 7 | `is_active` | `BOOL` | NN, default `TRUE` | Whether this analyte is available |

**Indexes:** `analyte_id` (PK), `panel_id` (lookup), `code` (UQ).

**ML relevance:** Analytes with `data_type = 'numeric'` feed the Gradient Boosting branch.

---

#### `LabReports`

A collection of lab results from a single sample collection event for a patient.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `report_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique report identifier |
| 2 | `patient_id` | `UUID` | FK → `Patients.patient_id`, NN | Patient who was tested |
| 3 | `panel_id` | `UUID` | FK → `LabPanels.panel_id`, NN | Panel this report covers |
| 4 | `collected` | `TIMESTAMPTZ` | NN | When the sample was collected |
| 5 | `created_at` | `TIMESTAMPTZ` | NN, default `now()` | When the report was entered into EVIDEA |

**Indexes:** `report_id` (PK), `patient_id` (patient history), `panel_id` (lookup).

---

#### `LabResultsItems`

Individual analyte results within a lab report. Each row is one measured value.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `result_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique result identifier |
| 2 | `report_id` | `UUID` | FK → `LabReports.report_id`, NN | Parent report |
| 3 | `analyte_id` | `UUID` | FK → `LabAnalytes.analyte_id`, NN | Which analyte was measured |
| 4 | `numeric_val` | `NUMERIC(12,4)` | — | Numeric result (e.g., 13.5000) |
| 5 | `text_val` | `VARCHAR(500)` | — | Text result (e.g., "Positive", "Reactive") |
| 6 | `created_at` | `TIMESTAMPTZ` | NN, default `now()` | When this result was recorded |

**Indexes:** `result_id` (PK), `report_id` (lookup), `analyte_id` (lookup).

**Constraint:** At least one of `numeric_val` or `text_val` must be non-NULL (application-level check).

**ML relevance:** `numeric_val` values feed the Gradient Boosting branch; `text_val` may be used for categorical lab features.

---

### 3.4 Auth & Access Domain 🔵

#### `DoctorsAndAdmin`

User accounts for clinicians and administrators. Patients do not have accounts
(Out of Scope: Patient-Facing Functionality).

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `doc_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique user identifier |
| 2 | `name` | `TEXT` | NN | First name |
| 3 | `surname` | `TEXT` | NN | Last name |
| 4 | `birth_date` | `DATE` | — | Date of birth |
| 5 | `sex` | `VARCHAR(64)` | — | Biological sex |
| 6 | `email` | `TEXT` | NN, UQ | Email address (used for login) |
| 7 | `phone_number` | `TEXT` | — | Contact phone |
| 8 | `role` | `UUID` | FK → `Roles.role_id`, NN | Assigned role |
| 9 | `password_hash` | `TEXT` | NN | Bcrypt/Argon2 hashed password |
| 10 | `created_at` | `DATE` | NN, default `CURRENT_DATE` | Account creation date |
| 11 | `updated_at` | `TIMESTAMPTZ` | NN, default `now()` | Last profile update |
| 12 | `deactivated_at` | `TIMESTAMPTZ` | — | Deactivation timestamp. `NULL` = active |

**Indexes:** `doc_id` (PK), `email` (UQ, login lookup), `role` (filter).

**Security:**

- `password_hash` is never returned by the API.
- `deactivated_at IS NOT NULL` → login rejected (US-12, NFR-S3).
- Previously submitted cases are retained after deactivation (UC-2).

---

#### `Roles`

System roles for RBAC. Predefined; not user-editable in the MVP.

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `role_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique role identifier |
| 2 | `role_name` | `VARCHAR(20)` | NN, UQ | Role name |

**Seed data:**

| role_id | role_name |
|---------|-----------|
| `(uuid)` | `clinician` |
| `(uuid)` | `admin` |

**Security:** Role determines access scope (NFR-S2):

- `clinician` — case entry, predictions, explanations.
- `admin` — clinical user management(system administrator), clinician activation/deactivation.

---

#### `Invitations`

Tracks registration invitations sent by administrators to new clinicians (UC-2).

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `invite_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique invitation identifier |
| 2 | `doctor_id` | `UUID` | FK → `DoctorsAndAdmin.doc_id`, NN | Invited user |
| 3 | `token_hash` | `TEXT` | NN, UQ | SHA-256 hash of the invitation token |
| 4 | `expires_at` | `TIMESTAMPTZ` | NN | Token expiration time |
| 5 | `used_at` | `TIMESTAMPTZ` | — | When the invitation was accepted. `NULL` = pending |

**Security:** Only the hash is stored; the raw token is sent to the user once and not persisted (NFR-S6).

---

### 3.5 ML & Predictions Domain 🟠

#### `ModelVersions`

Registry of trained ML model versions. The active model is used for inference.
Trained on a separate de-identified research dataset (not stored in this DB).

| # | Column | Type | Constraints | Description |
|---|--------|------|-------------|-------------|
| 1 | `model_version_id` | `UUID` | PK, NN, default `gen_random_uuid()` | Unique version identifier |
| 2 | `name` | `VARCHAR(100)` | NN | Model name (e.g., "evidea-multimodal") |
| 3 | `version` | `VARCHAR(30)` | NN, UQ | Semantic version (e.g., "1.0.0") |
| 4 | `artifact_uri` | `TEXT` | NN | Path or URI to model artifacts |
| 5 | `eval_metrics` | `JSONB` | — | Evaluation metrics (Recall@5, Top-1 Accuracy, F1, etc.) |
| 6 | `trained_at` | `TIMESTAMPTZ` | NN | When the model was trained |
| 7 | `is_active` | `BOOL` | NN, default `FALSE` | Whether this is the current inference model |

**Constraint:** At most one row should have `is_active = TRUE` at any time (application-level or partial unique index).

**Example `eval_metrics`:**
```json
{
  "recall_at_5": 0.73,
  "top_1_accuracy": 0.42,
  "f1_text_extraction": 0.84,
  "test_set_size": 500,
  "dataset_source": "MIMIC-IV subset"
}
```

#### `PredictionRuns`

Records each invocation of the ML model for a case. Stores the input snapshot
for reproducibility and audit.

| # | Column | Type | Constraints | Description |
| :-- | :-- | :-- | :-- | :-- |
| 1 | prediction_run_id | UUID | PK, NN, default gen_random_uuid() | Unique run identifier |
| 2 | initiated_by | UUID | FK → DoctorsAndAdmin.doc_id, NN | Clinician who requested the prediction |
| 3 | case_id | UUID | FK → Cases.case_id, NN | Case analyzed |
| 4 | model_version_id | UUID | FK → ModelVersions.model_version_id, NN | Model version used |
| 5 | status | VARCHAR(20) | NN, default 'pending' | Run status |
| 6 | input_snapshot | JSONB | — | De-identified copy of all inputs at prediction time |
| 7 | started_at | TIMESTAMPTZ | — | Inference start time |
| 8 | completed_at | TIMESTAMPTZ | — | Inference completion time |
| 9 | error_msg | TEXT | — | Error description if status = 'failed' |

**Allowed status values**: pending, processing, completed, failed, unsupported.

**Indexes**: prediction_run_id (PK), case_id (lookup), initiated_by (audit).

**Note**: input_snapshot captures the exact text and lab values sent to the model, ensuring reproducibility even if the source case data is later edited (UC-1, step 9a).


#### `Diseases`

Reference catalog of rare diseases. Sourced from Orphanet (CC BY 4.0) and
cross-referenced with ICD codes.

| # | Column | Type | Constraints | Description |
| :-- | :-- | :-- | :-- | :-- |
| 1 | disease_id | UUID | PK, NN, default gen_random_uuid() | Unique disease identifier |
| 2 | orpha_code | VARCHAR(20) | NN, UQ | Orphanet code (e.g., "ORPHA:558") |
| 3 | name | TEXT | NN | Disease name |
| 4 | description | TEXT | — | Clinical description |
| 5 | icd_code | VARCHAR(20) | — | ICD-10/ICD-11 code |
| 6 | is_active | BOOL | NN, default TRUE | Whether this disease is in the supported set |
| 7 | created_at | TIMESTAMPTZ | NN, default now() | Record creation |
| 8 | updated_at | TIMESTAMPTZ | NN, default now() | Last update |
| 9 | inheritance_type | VARCHAR(50) | — | Mode of inheritance (e.g., "autosomal dominant") |
| 10 | affected_systems | JSONB | — | Affected organ systems |

Attribution: © INSERM 1999 / Orphadata. Data version documented per import.

#### `DiseaseHypotheses`

Individual disease hypotheses generated by a prediction run. Each row is one
ranked suggestion.

| # | Column | Type | Constraints | Description |
| :-- | :-- | :-- | :-- | :-- |
| 1 | hypothesis_id | UUID | PK, NN, default gen_random_uuid() | Unique hypothesis identifier |
| 2 | prediction_run_id | UUID | FK → PredictionRuns.prediction_run_id, NN | Parent prediction run |
| 3 | disease_id | UUID | FK → Diseases.disease_id, NN | Suggested disease |
| 4 | rank | INT | NN | Position in the ranked list (1 = highest) |
| 5 | score | NUMERIC(8,6) | NN | Model confidence score (0.000000–1.000000) |

**Indexes:** hypothesis_id (PK), prediction_run_id (lookup).

**Constraint:** rank is unique within a prediction_run_id (application-level or unique index on (prediction_run_id, rank)).

**UI note:** Score is labelled according to its actual meaning (US-09), not presented as a probability of diagnosis.

#### `PredictionExplanation`

Feature-level explanations for each hypothesis, generated by SHAP or LIME.

| # | Column | Type | Constraints | Description |
| :-- | :-- | :-- | :-- | :-- |
| 1 | explanation_id | UUID | PK, NN, default gen_random_uuid() | Unique explanation identifier |
| 2 | hypothesis_id | UUID | FK → DiseaseHypotheses.hypothesis_id, NN | Explained hypothesis |
| 3 | method | VARCHAR(20) | NN | Explanation method: shap, lime |
| 4 | explanation_data | JSONB | NN | Feature contributions (see example below) |
| 5 | summary | TEXT | — | Human-readable summary of key contributing factors |
| 6 | created_at | TIMESTAMPTZ | NN, default now() | Generation timestamp |

**Example `explanation_data`:**

```json
{
  "text_features": [
    {"token": "progressive muscle weakness", "shap_value": 0.34},
    {"token": "elevated CK", "shap_value": 0.28}
  ],
  "lab_features": [
    {"analyte": "Creatine Kinase", "value": 1520, "unit": "U/L", "shap_value": 0.41},
    {"analyte": "ALT", "value": 89, "unit": "U/L", "shap_value": 0.15}
  ],
  "disclaimer": "Feature associations, not causal proof."
}
```

**Ethical requirement (ER1, US-08): Explanations do not present feature associations as proof of causation.


### 3.6 Audit Domain 🔴

#### `SystemLogs`

Application-level event and error logging. Must not contain PII (NFR-S5).

| # | Column | Type | Constraints | Description |
| :-- | :-- | :-- | :-- | :-- |
| 1 | log_id | UUID | PK, NN, default gen_random_uuid() | Unique log entry identifier |
| 2 | user_id | UUID | FK → DoctorsAndAdmin.doc_id, — | User who triggered the event (nullable for system events) |
| 3 | case_id | UUID | FK → Cases.case_id, — | Related case (nullable for non-case events) |
| 4 | log_lvl | VARCHAR(20) | NN | Severity level: INFO, WARN, ERROR, FATAL |
| 5 | error_code | VARCHAR(20) | — | Application error code (e.g., MODEL_TIMEOUT) |
| 6 | message | TEXT | NN | Log message (must not contain PII) |
| 7 | created_at | TIMESTAMPTZ | NN, default now() | Event timestamp |

**Indexes:** log_id (PK), created_at (time-range queries), log_lvl (filter), case_id (case audit trail).

**NFR-S5 compliance:** No patient names, emails, clinical text, or lab values are stored in this table. The user_id and case_id are UUIDs only — personal context requires a separate authorized lookup.

## 4. Data Quality Requirements

### 4.1 Schema-Level Constraints
| Rule ID | Table(s) | Rule | Implementation |
| :-- | :-- | :-- | :-- |
| DQ-01 | All tables with UUID PK | Primary keys are non-null, unique, auto-generated | PK, DEFAULT gen_random_uuid() |
| DQ-02 | All FK columns | FK references are type-consistent (UUID → UUID) | FK constraints |
| DQ-03 | DoctorsAndAdmin | Email must be unique across all users | UNIQUE constraint on email |
| DQ-04 | DoctorsAndAdmin | Password is never stored in plaintext | Application-level hashing; password_hash type TEXT |
| DQ-05 | LabResultsItems | At least one of numeric_val or text_val is non-NULL | CHECK (numeric_val IS NOT NULL OR text_val IS NOT NULL) |
| DQ-06 | DiseaseHypotheses | rank is unique per prediction run | UNIQUE (prediction_run_id, rank) |
| DQ-07 | DiseaseHypotheses | score is between 0 and 1 | CHECK (score >= 0 AND score <= 1) |
| DQ-08 | VitalSigns | spo2_percent is between 0 and 100 | CHECK (spo2_percent >= 0 AND spo2_percent <= 100) |
| DQ-09 | ModelVersions | At most one active model at a time | Partial unique index: UNIQUE (is_active) WHERE is_active = TRUE |
| DQ-10 | Roles | role_name is unique | UNIQUE constraint |
| DQ-11 | LabCategories | code is unique | UNIQUE constraint |
| DQ-12 | LabPanels | code is unique | UNIQUE constraint |
| DQ-13 | LabAnalytes | code is unique | UNIQUE constraint |
| DQ-14 | Diseases | orpha_code is unique | UNIQUE constraint |
| DQ-15 | Invitations | token_hash is unique | UNIQUE constraint |

**Implementation notes (v1.1, PostgreSQL migrations in `backend/db/migrations/`):**

- **Table names** are snake_case plural: `DoctorsAndAdmin` → `doctors_and_admin`, `CaseAnamneses` → `case_anamneses`, `LabResultsItems` → `lab_results_items`, and so on. Column names are unchanged. CamelCase names are not used because unquoted identifiers are folded to lower case in PostgreSQL.
- **Timestamps:** all event timestamps are `TIMESTAMPTZ`. `DATE` is kept only for `Patients.created_at` and `DoctorsAndAdmin.created_at`, as specified.
- **JSON columns** are `JSONB` (`eval_metrics`, `input_snapshot`, `affected_systems`, `explanation_data`). This resolves the open question in `versioning.md`.
- **Enumerated text** (`data_type`, `status`, `method`, `log_lvl`, `sex`) uses `VARCHAR` with CHECK constraints rather than PostgreSQL `ENUM`. Adding a value then needs no `ALTER TYPE`.
- **Patient consistency** is enforced by composite foreign keys: a case's anamnesis, vital signs and lab reports must belong to the same patient as the case.
- **DQ-22** is enforced by trigger `trg_lab_results_items_consistency`. It checks that the analyte belongs to the report's panel, that numeric analytes have `numeric_val`, and that text or boolean analytes have `text_val` and no `numeric_val`.
- **DQ-03** email uniqueness is case-insensitive (unique index on `lower(email)`).
- **Single active model (DQ-09)** is enforced by a partial unique index.
- **Additional constraint not in the original rules:** `UNIQUE (prediction_run_id, disease_id)` in `disease_hypotheses`, so one disease appears at most once per run.
- **Test and demo data** are in `backend/db/seeds/` (dev/test only). Constraint tests are in `backend/db/tests/`. Migrations are run by Alembic (`backend/db/alembic.ini`, `backend/db/migrations/env.py`); the checksum journal is the `migration_checksums` table, see [versioning.md](./versioning.md).

### 4.2 Application-Level Validation

| Rule ID | Table(s) | Rule | Enforcement |
| :-- | :-- | :-- | :-- |
| DQ-20 | CaseAnamneses | chief_complaint must be non-empty text (≥ 10 characters) | API input validation (US-05) |
| DQ-21 | VitalSigns | Numeric ranges: weight 0.1–500 kg, BP 20–300 mmHg, HR 10–300 bpm, temp 25.0–45.0°C | API input validation |
| DQ-22 | LabResultsItems | The analyte must belong to the report's panel. `numeric` analytes require `numeric_val`. `text` and `boolean` analytes require `text_val` and no `numeric_val`. | DB trigger `trg_lab_results_items_consistency` (see implementation notes in 4.1) and API validation |
| DQ-23 | PredictionRuns | input_snapshot must contain both text_input and lab_input keys | API validation |
| DQ-24 | PredictionRuns | status transition: pending → processing → completed/failed | Application state machine |
| DQ-25 | Patients | birth_date must not be in the future | API input validation |
| DQ-26 | Patients | sex must be one of: male, female, other, unknown | CHECK constraint `chk_patients_sex` |
| DQ-27 | All text fields submitted by clinician | Must not contain direct patient identifiers (names, SSN, etc.) | UI warning on input form (NFR-S5); not enforced at DB level |

### 4.3 Temporal Consistency Rules

| Rule ID | Rule | Tables |
| :-- | :-- | :-- |
| DQ-30 | updated_at >= created_at | All tables with both fields |
| DQ-31 | completed_at >= started_at when both are set | PredictionRuns |
| DQ-32 | used_at <= expires_at when both are set | Invitations |
| DQ-33 | deactivated_at >= created_at when set | 
DoctorsAndAdmin, Patients (deleted_at) |
| DQ-34 | LabReports.collected <= LabReports.created_at | LabReports (sample collected before data entry) |


### 4.4 PII and Privacy Rules (NFR-S5, GDPR)


| Rule ID | Rule | Scope |
| :-- | :-- | :-- |
| DQ-40 | Patient PII (name, email, phone) is accessible only to roles clinician and admin | API authorization layer |
| DQ-41 | SystemLogs.message must not contain patient names, emails, clinical text, or lab values | Application logging framework |
| DQ-42 | PredictionRuns.input_snapshot must not contain patient identifiers (only clinical features) | Serialization layer |
| DQ-43 | PredictionExplanation.explanation_data must not contain patient identifiers | ML explanation pipeline |
| DQ-44 | password_hash and token_hash are never included in API responses or logs | API serialization, logging config |
| DQ-45 | Clinician account data is deleted or anonymized after the evaluation period | Operational procedure |


### 4.5 Referential Integrity Summary

| Check | Expected result |
| :-- | :-- |
| No orphan Cases (patient deleted) | ON DELETE RESTRICT prevents this |
| No orphan PredictionRuns (case deleted) | ON DELETE RESTRICT prevents this |
| No orphan DiseaseHypotheses (run deleted) | ON DELETE CASCADE cleans up |
| No orphan LabResultsItems (report deleted) | ON DELETE CASCADE cleans up |
| Logs survive user deactivation | ON DELETE SET NULL preserves logs |
| Deactivated user's cases preserved | deactivated_at flag; no record deletion (US-12) |

### 4.6 Data Integrity and Transactions

#### 4.6.1 ACID Guarantees

EVIDEA relies on PostgreSQL's native ACID properties:

| Property | How it is used in EVIDEA |
|---|---|
| **Atomicity** | Multi-step workflows (case creation, prediction run) are wrapped in a single transaction — either all steps succeed or none are persisted |
| **Consistency** | FK constraints, CHECK constraints, and UNIQUE indexes enforce valid state at all times |
| **Isolation** | `READ COMMITTED` isolation level (PostgreSQL default) prevents dirty reads while allowing concurrent clinicians to work independently |
| **Durability** | All committed transactions survive server restart; PostgreSQL WAL ensures write-ahead logging |

#### 4.6.2 Transaction Boundaries

Each critical workflow is designed as a single atomic transaction. If any step
fails, the entire transaction is rolled back and no partial data is persisted.

##### TX-1: Submit a Case and Generate Predictions (UC-1)

This is the most complex transaction in the system, covering steps 3–8 of UC-1:



