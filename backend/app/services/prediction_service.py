"""Prediction service wrapper for the MVP ML scaffold."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re

import pandas as pd

from ml import config
from ml.predict import predict_startup_suitability


FEATURE_COLUMNS = [
    "radius_m",
    "total_store_count",
    "same_business_count_by_type",
    "cafe_count",
    "restaurant_count",
    "convenience_count",
    "pharmacy_count",
    "beauty_count",
    "academy_count",
    "retail_count",
    "business_type_count",
    "business_diversity_index",
    "bus_boarding_count",
    "bus_alighting_count",
    "bus_total_count",
    "nearby_bus_stop_count",
    "subway_pattern_score",
    "competition_index",
    "floating_demand_index",
    "sales_potential_index",
    "closure_risk_index",
]
STATION_PARENTHESES_PATTERN = re.compile(r"\s*\([^)]*\)")


@dataclass(frozen=True)
class BusinessTypeProfile:
    count_columns: tuple[str, ...]
    strategy_comment: str


class PredictionStationNotFoundError(ValueError):
    """Raised when the requested station cannot be matched to local features."""


BUSINESS_TYPE_PROFILES = {
    "coffee": BusinessTypeProfile(
        count_columns=("cafe_count",),
        strategy_comment="출퇴근·환승 수요를 겨냥한 테이크아웃 중심 운영과 회전율 관리가 적합합니다.",
    ),
    "restaurant": BusinessTypeProfile(
        count_columns=("restaurant_count",),
        strategy_comment="점심·저녁 피크 수요를 나누어 보고 배달과 홀 운영을 병행하는 전략이 적합합니다.",
    ),
    "convenience": BusinessTypeProfile(
        count_columns=("convenience_count",),
        strategy_comment="생활 동선과 야간 수요를 함께 겨냥한 소형 편의형 운영이 적합합니다.",
    ),
    "bakery": BusinessTypeProfile(
        count_columns=("cafe_count", "restaurant_count"),
        strategy_comment="출근 시간대 간편식과 오후 디저트 수요를 함께 고려한 상품 구성이 적합합니다.",
    ),
    "retail": BusinessTypeProfile(
        count_columns=("retail_count",),
        strategy_comment="반복 방문 수요를 만들 수 있는 생활밀착형 상품 구성과 재고 회전 관리가 중요합니다.",
    ),
    "pharmacy": BusinessTypeProfile(
        count_columns=("pharmacy_count",),
        strategy_comment="주거 배후와 의료·생활 편의 동선을 함께 확인하는 입지 검토가 필요합니다.",
    ),
    "academy": BusinessTypeProfile(
        count_columns=("academy_count",),
        strategy_comment="학령 인구와 주거 배후 수요를 중심으로 시간대별 이용 패턴을 검토해야 합니다.",
    ),
    "beauty": BusinessTypeProfile(
        count_columns=("beauty_count",),
        strategy_comment="예약 기반 재방문 수요와 인근 생활권 경쟁 밀도를 함께 관리하는 전략이 적합합니다.",
    ),
}


def _clean_text(value: object) -> str:
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def _normalize_station_name(value: str) -> str:
    cleaned = STATION_PARENTHESES_PATTERN.sub("", value).strip()
    return cleaned.replace(" ", "")


def _normalize_business_type(value: str) -> str:
    cleaned = value.replace(" ", "")
    if "커피" in cleaned or "카페" in cleaned:
        return "coffee"
    if "음식" in cleaned or "외식" in cleaned or "식당" in cleaned:
        return "restaurant"
    if "편의" in cleaned:
        return "convenience"
    if "베이커리" in cleaned or "빵" in cleaned:
        return "bakery"
    if "소매" in cleaned or "판매" in cleaned:
        return "retail"
    if "약국" in cleaned:
        return "pharmacy"
    if "학원" in cleaned or "교육" in cleaned:
        return "academy"
    if "미용" in cleaned or "뷰티" in cleaned:
        return "beauty"
    return "restaurant"


def _clamp_score(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 2)


def _safe_float(value: object, default: float = 0.0) -> float:
    try:
        if value is None or pd.isna(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _load_station_features() -> pd.DataFrame:
    if not config.STATION_AREA_FEATURES_PATH.exists():
        return pd.DataFrame()
    try:
        return pd.read_csv(config.STATION_AREA_FEATURES_PATH)
    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return pd.DataFrame()


def _load_line2_display_aliases(path: Path | None = None) -> dict[str, str]:
    path = path or config.LINE2_STATION_COORDINATES_PATH
    if not path.exists():
        return {}
    try:
        coordinates = pd.read_csv(path)
    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return {}
    if coordinates.empty or not {"역번호", "행정동"}.issubset(coordinates.columns):
        return {}

    aliases: dict[str, str] = {}
    for _, row in coordinates.iterrows():
        station_number = _clean_text(row.get("역번호"))
        district = _clean_text(row.get("행정동"))
        if station_number and district:
            aliases[f"2호선_{station_number}"] = f"{district} 예정역"
    return aliases


def _station_aliases(station_name: str, station_id: str) -> set[str]:
    normalized_name = _normalize_station_name(station_name)
    aliases = {normalized_name, _normalize_station_name(station_id)}
    if normalized_name == "첨단지구역":
        aliases.add("첨단역")
    if normalized_name.endswith("지구역"):
        aliases.add(normalized_name.replace("지구역", "역"))
    return aliases


def _find_station_feature_row(features: pd.DataFrame, station_name: str) -> pd.Series:
    requested = _normalize_station_name(station_name)
    if features.empty:
        raise PredictionStationNotFoundError("Station feature data is not available.")

    for _, row in features.iterrows():
        aliases = _station_aliases(
            _clean_text(row.get("station_name")),
            _clean_text(row.get("station_id")),
        )
        if requested in aliases:
            return row

    raise PredictionStationNotFoundError(f"Station not found: {station_name}")


def _business_count(row: pd.Series, profile: BusinessTypeProfile) -> float:
    values = [_safe_float(row.get(column), 0.0) for column in profile.count_columns]
    if len(values) == 1:
        return values[0]
    return max(values[0], 0.0) + max(values[1], 0.0)


def _build_feature_payload(row: pd.Series, business_type: str, radius_m: float) -> tuple[dict[str, object], float]:
    profile = BUSINESS_TYPE_PROFILES[_normalize_business_type(business_type)]
    payload = {column: _safe_float(row.get(column), 0.0) for column in FEATURE_COLUMNS}
    payload["radius_m"] = radius_m

    same_business_count = _business_count(row, profile)
    total_store_count = max(_safe_float(row.get("total_store_count"), 0.0), 1.0)
    business_pressure = _clamp_score((same_business_count / total_store_count) * 100.0)
    base_competition = _safe_float(row.get("competition_index"), 50.0)
    base_sales_potential = _safe_float(row.get("sales_potential_index"), 50.0)
    base_closure_risk = _safe_float(row.get("closure_risk_index"), 50.0)
    floating = _safe_float(row.get("floating_demand_index"), 50.0)

    payload["same_business_count_by_type"] = same_business_count
    payload["competition_index"] = _clamp_score((base_competition * 0.65) + (business_pressure * 0.35))
    payload["sales_potential_index"] = _clamp_score(
        base_sales_potential + ((floating - payload["competition_index"]) * 0.12),
    )
    payload["closure_risk_index"] = _clamp_score(
        base_closure_risk + (business_pressure * 0.08) + (payload["competition_index"] * 0.04),
    )
    return payload, business_pressure


def _risk_factors(payload: dict[str, object], business_type: str, business_pressure: float) -> list[str]:
    factors: list[str] = []
    competition = _safe_float(payload.get("competition_index"), 50.0)
    floating = _safe_float(payload.get("floating_demand_index"), 50.0)
    closure_risk = _safe_float(payload.get("closure_risk_index"), 50.0)

    if business_pressure >= 35:
        factors.append(f"{business_type} 동종 점포 비중이 높아 차별화 전략이 필요합니다.")
    else:
        factors.append(f"{business_type} 동종 점포 밀도는 과밀 구간은 아니지만 실제 임대료 확인이 필요합니다.")
    if competition >= 65:
        factors.append("반경 500m 내 상권 경쟁 지수가 높게 계산되었습니다.")
    if floating < 45:
        factors.append("유동 수요 지표가 낮아 고정 방문 수요 확보가 중요합니다.")
    else:
        factors.append("유동 수요 지표는 선택 역세권의 주요 기회 요인입니다.")
    if closure_risk >= 58:
        factors.append("폐업 위험 대리 지표가 높아 초기 고정비를 보수적으로 잡아야 합니다.")
    return factors[:4]


def _growth_rate(payload: dict[str, object], predicted_score: float, business_pressure: float) -> float:
    floating = _safe_float(payload.get("floating_demand_index"), 50.0)
    sales_potential = _safe_float(payload.get("sales_potential_index"), 50.0)
    competition = _safe_float(payload.get("competition_index"), 50.0)
    diversity = _safe_float(payload.get("business_diversity_index"), 50.0)
    growth = (
        5.0
        + (predicted_score * 0.22)
        + (floating * 0.24)
        + (sales_potential * 0.22)
        + (diversity * 0.08)
        - (competition * 0.12)
        - (business_pressure * 0.04)
    )
    return _clamp_score(growth)


def _confidence_metrics(payload: dict[str, object], predicted_score: float) -> list[dict[str, object]]:
    floating = _safe_float(payload.get("floating_demand_index"), 50.0)
    diversity = _safe_float(payload.get("business_diversity_index"), 50.0)
    competition = _safe_float(payload.get("competition_index"), 50.0)
    data_confidence = _clamp_score((floating * 0.45) + (diversity * 0.35) + 20.0)
    model_confidence = _clamp_score(70.0 + (predicted_score * 0.12))
    market_fit = _clamp_score((floating * 0.45) + (diversity * 0.35) - (competition * 0.18) + 25.0)
    overall = _clamp_score((data_confidence + model_confidence + market_fit) / 3.0)

    return [
        {"label": "종합 예측 신뢰도", "score": overall, "level": _confidence_level(overall)},
        {"label": "데이터 기반 신뢰도", "score": data_confidence, "level": _confidence_level(data_confidence)},
        {"label": "모델 점검 수준", "score": model_confidence, "level": _confidence_level(model_confidence)},
        {"label": "유사 상권 적합도", "score": market_fit, "level": _confidence_level(market_fit)},
    ]


def _confidence_level(score: float) -> str:
    if score >= 75:
        return "높음"
    if score >= 55:
        return "보통"
    return "낮음"


def _strategy_comment(business_type: str) -> str:
    profile = BUSINESS_TYPE_PROFILES[_normalize_business_type(business_type)]
    return profile.strategy_comment


def get_startup_suitability_prediction(input_features: dict[str, object]) -> dict[str, object]:
    return predict_startup_suitability(input_features)


def simulate_prediction(
    station_name: str,
    business_type: str,
    scenario: str | None = None,
    radius_m: float = config.DEFAULT_RADIUS_M,
) -> dict[str, object]:
    features = _load_station_features()
    row = _find_station_feature_row(features, station_name)
    payload, business_pressure = _build_feature_payload(row, business_type, radius_m)
    prediction = predict_startup_suitability(payload)
    predicted_score = _safe_float(prediction.get("predicted_score"), 0.0)
    growth_rate = _growth_rate(payload, predicted_score, business_pressure)
    sales_change_rate = _clamp_score(growth_rate * 0.86)
    data_status = (
        "ml_model"
        if config.STARTUP_SUITABILITY_MODEL_PATH.exists()
        and config.STARTUP_SUITABILITY_FEATURES_PATH.exists()
        else "model_missing"
    )
    matched_station_name = _clean_text(row.get("station_name"))
    line2_aliases = _load_line2_display_aliases()
    display_station_name = line2_aliases.get(matched_station_name, matched_station_name)

    return {
        "data_status": data_status,
        "station_name": matched_station_name,
        "display_station_name": display_station_name,
        "business_type": business_type,
        "scenario": scenario,
        "radius_m": radius_m,
        "startup_suitability_score": predicted_score,
        "predicted_score": predicted_score,
        "predicted_growth_rate": growth_rate,
        "predicted_sales_change_rate": sales_change_rate,
        "floating_demand_index": _clamp_score(_safe_float(payload.get("floating_demand_index"), 50.0)),
        "competition_index": _clamp_score(_safe_float(payload.get("competition_index"), 50.0)),
        "business_diversity_index": _clamp_score(_safe_float(payload.get("business_diversity_index"), 50.0)),
        "risk_level": prediction.get("risk_level", "보통"),
        "recommendation_label": prediction.get("recommendation_label", "추가 검토 권장"),
        "risk_factors": _risk_factors(payload, business_type, business_pressure),
        "strategy_comment": _strategy_comment(business_type),
        "confidence_metrics": _confidence_metrics(payload, predicted_score),
        "feature_payload": payload,
    }
