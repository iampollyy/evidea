from uuid import uuid4

import pytest

from evidea.modules.predictions.inference import (
    Candidate,
    LabFeature,
    StubModel,
    build_input_snapshot,
)

CANDIDATES = [Candidate(uuid4(), f"ORPHA:{code}", f"Disease {code}") for code in range(100, 108)]


def snapshot(complaint: str | None = "Progressive proximal muscle weakness") -> dict[str, object]:
    return build_input_snapshot(
        anamnesis={"chief_complaint": complaint, "allergies": None, "medications": ""},
        vital_signs={"heart_rate_bpm": 76, "spo2_percent": None},
        lab_features=[
            LabFeature("CK", "Creatine Kinase", "U/L", 1520),
            LabFeature("MYO_U", "Myoglobinuria", None, True),
        ],
        age_years=28,
        sex="male",
    )


def test_snapshot_keeps_only_clinical_features() -> None:
    data = snapshot()
    assert data["text_input"] == {"chief_complaint": "Progressive proximal muscle weakness"}
    assert data["vital_signs"] == {"heart_rate_bpm": 76}
    assert data["lab_input"] == [
        {"code": "CK", "name": "Creatine Kinase", "unit": "U/L", "value": 1520},
        {"code": "MYO_U", "name": "Myoglobinuria", "unit": None, "value": True},
    ]
    assert data["demographics"] == {"age_years": 28, "sex": "male"}
    assert {"text_input", "lab_input"} <= data.keys()


def test_stub_supports_only_inputs_with_a_chief_complaint() -> None:
    model = StubModel()
    assert model.supports(snapshot())
    assert not model.supports(snapshot(complaint=None))
    assert not model.supports({})


def test_stub_predictions_are_ranked_bounded_and_deterministic() -> None:
    model = StubModel(top_k=5)
    first = model.predict(snapshot(), CANDIDATES)
    second = model.predict(snapshot(), CANDIDATES)

    assert first == second
    assert len(first) == 5
    scores = [r.score for r in first]
    assert scores == sorted(scores, reverse=True)
    assert all(0 < s <= 1 for s in scores)
    assert sum(scores) == pytest.approx(1, abs=1e-5)
    assert len({r.disease_id for r in first}) == 5


def test_different_input_gives_a_different_ranking() -> None:
    model = StubModel(top_k=8)
    a = [r.disease_id for r in model.predict(snapshot(), CANDIDATES)]
    b = [r.disease_id for r in model.predict(snapshot("Recurrent lung infections"), CANDIDATES)]
    assert a != b


def test_explanations_are_marked_as_demo_and_reference_inputs() -> None:
    result = StubModel().predict(snapshot(), CANDIDATES)[0]
    explanation = result.explanations[0]
    assert explanation.method == "shap"
    assert "demo stub model" in explanation.data["disclaimer"]
    assert "not causal proof" in explanation.data["disclaimer"]
    tokens = [f["token"] for f in explanation.data["textFeatures"]]
    assert tokens == ["progressive", "proximal", "muscle"]
    assert explanation.data["labFeatures"][0]["analyte"] == "Creatine Kinase"
    assert explanation.summary is not None and explanation.summary.startswith("Demo explanation")


def test_no_candidates_means_no_predictions() -> None:
    assert StubModel().predict(snapshot(), []) == []
