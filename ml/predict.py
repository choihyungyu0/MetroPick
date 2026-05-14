"""Prediction helper for the MVP startup-suitability model."""

from __future__ import annotations

import json

import joblib
import pandas as pd

from ml import config
from ml.scoring import calculate_startup_suitability_score


def _score_to_label(score: float) -> tuple[str, str]:
    if score >= 75:
        return "낮음", "창업 적합도 높음"
    if score >= 55:
        return "보통", "추가 검토 권장"
    return "높음", "보수적 검토 필요"


def _coerce_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _fallback_rule_score(input_features: dict[str, object]) -> float:
    score = calculate_startup_suitability_score(
        [_coerce_float(input_features.get("floating_demand_index"), 50.0)],
        [_coerce_float(input_features.get("sales_potential_index"), 50.0)],
        [_coerce_float(input_features.get("accessibility_score"), 50.0)],
        [_coerce_float(input_features.get("business_diversity_index"), 50.0)],
        [_coerce_float(input_features.get("competition_index"), 50.0)],
        [_coerce_float(input_features.get("closure_risk_index"), 50.0)],
    )
    return float(score.iloc[0])


def _top_reasons(input_features: dict[str, object], score: float) -> list[str]:
    reasons: list[str] = []
    floating = _coerce_float(input_features.get("floating_demand_index"))
    competition = _coerce_float(input_features.get("competition_index"))
    diversity = _coerce_float(input_features.get("business_diversity_index"))
    closure_risk = _coerce_float(input_features.get("closure_risk_index"))
    bus_total = _coerce_float(input_features.get("bus_total_count"))

    if floating >= 65:
        reasons.append("유동 수요 지표가 샘플 기준에서 높게 나타났습니다.")
    if bus_total >= 900:
        reasons.append("인근 버스 승하차 수요가 비교적 큽니다.")
    if diversity >= 70:
        reasons.append("업종 다양성이 높아 보완 소비 가능성이 있습니다.")
    if competition >= 70:
        reasons.append("경쟁 밀도가 높아 차별화 전략이 필요합니다.")
    if closure_risk >= 60:
        reasons.append("폐업 위험 대리 지표가 높아 임대료와 고정비 검토가 필요합니다.")
    if not reasons:
        reasons.append("현재 입력값은 샘플 기반 MVP 기준으로 해석되었습니다.")
    if score < 55:
        reasons.append("최종 점수가 낮아 실제 매출·폐업 데이터 연결 전까지 보수적으로 보아야 합니다.")
    return reasons[:4]


def predict_startup_suitability(input_features: dict[str, object]) -> dict[str, object]:
    """Return an MVP prediction response without calling external APIs."""

    if config.STARTUP_SUITABILITY_MODEL_PATH.exists() and config.STARTUP_SUITABILITY_FEATURES_PATH.exists():
        feature_columns = json.loads(config.STARTUP_SUITABILITY_FEATURES_PATH.read_text(encoding="utf-8"))
        model = joblib.load(config.STARTUP_SUITABILITY_MODEL_PATH)
        model_input = pd.DataFrame(
            [{feature: _coerce_float(input_features.get(feature), 0.0) for feature in feature_columns}]
        )
        predicted_score = float(model.predict(model_input)[0])
    else:
        predicted_score = _fallback_rule_score(input_features)

    predicted_score = round(max(0.0, min(100.0, predicted_score)), 2)
    risk_level, recommendation_label = _score_to_label(predicted_score)
    return {
        "predicted_score": predicted_score,
        "risk_level": risk_level,
        "recommendation_label": recommendation_label,
        "top_reasons": _top_reasons(input_features, predicted_score),
    }
