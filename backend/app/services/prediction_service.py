"""Prediction service wrapper for the MVP ML scaffold."""

from __future__ import annotations

from dataclasses import dataclass
import re

import pandas as pd

from backend.app.services.station_identity import (
    clean_station_text,
    display_station_name_for,
    line2_display_name_to_internal_name,
    line2_identifier_to_internal_name,
    load_line2_station_display_names,
    normalize_station_key,
)
from ml import config
from ml.data_loader import load_processed_station_area_features, load_sample_raw_data
from ml.feature_engineering import build_station_area_features
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


@dataclass(frozen=True)
class BusinessTypeProfile:
    count_columns: tuple[str, ...]
    strategy_comment: str


@dataclass(frozen=True)
class StationFeatureMatch:
    row: pd.Series
    station_id: str
    station_name: str
    display_station_name: str


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
    return clean_station_text(value)


def _normalize_station_name(value: object) -> str:
    return normalize_station_key(value)


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
        return _build_sample_station_features()
    try:
        processed_features = load_processed_station_area_features(validate_required_columns=True)
    except (OSError, ValueError, pd.errors.ParserError, UnicodeDecodeError):
        return _build_sample_station_features()

    sample_features = _build_sample_station_features()
    if sample_features.empty:
        return processed_features
    if processed_features.empty:
        return sample_features
    return pd.concat([processed_features, sample_features], ignore_index=True, sort=False)


def _build_sample_station_features() -> pd.DataFrame:
    try:
        raw_data = load_sample_raw_data()
        return build_station_area_features(
            raw_data.stores,
            raw_data.bus,
            raw_data.subway,
            raw_data.stations,
            radius_m=config.DEFAULT_RADIUS_M,
        )
    except (OSError, ValueError, pd.errors.ParserError, UnicodeDecodeError):
        return pd.DataFrame()


def _load_line2_display_aliases() -> dict[str, str]:
    return load_line2_station_display_names()


def _load_recommendation_top5() -> pd.DataFrame:
    if not config.RECOMMENDATION_TOP5_PATH.exists():
        return pd.DataFrame()

    try:
        return pd.read_csv(config.RECOMMENDATION_TOP5_PATH)
    except (OSError, pd.errors.ParserError, UnicodeDecodeError):
        return pd.DataFrame()


def _recommendation_display_station_name(
    row: pd.Series,
    line2_display_names: dict[str, str],
) -> str:
    explicit_display_name = _clean_text(row.get("display_station_name"))
    if explicit_display_name:
        return explicit_display_name

    station_name = _clean_text(row.get("station_name"))
    station_id = _clean_text(row.get("station_id"))
    district = _clean_text(row.get("district"))
    return (
        display_station_name_for(
            station_name=station_name,
            station_id=station_id,
            district=district,
            line2_display_names=line2_display_names,
        )
        or station_name
    )


def _build_recommendation_station_aliases(
    recommendations: pd.DataFrame,
    line2_display_names: dict[str, str],
) -> dict[str, str]:
    aliases: dict[str, str] = {}
    if recommendations.empty:
        return aliases

    for _, row in recommendations.iterrows():
        station_name = _clean_text(row.get("station_name"))
        if not station_name:
            continue

        station_id = _clean_text(row.get("station_id")) or station_name
        display_name = _recommendation_display_station_name(row, line2_display_names)
        for candidate in [station_name, station_id, display_name]:
            normalized = _normalize_station_name(candidate)
            if normalized:
                aliases.setdefault(normalized, station_name)

    return aliases


def _append_lookup_token(tokens: list[str], value: object) -> None:
    token = _clean_text(value)
    if token and token not in tokens:
        tokens.append(token)


def _append_resolved_lookup_tokens(
    tokens: list[str],
    value: object,
    line2_display_names: dict[str, str],
    recommendation_aliases: dict[str, str],
) -> None:
    cleaned = _clean_text(value)
    if not cleaned:
        return

    normalized = _normalize_station_name(cleaned)
    display_aliases = line2_display_name_to_internal_name(line2_display_names)
    for candidate in [
        line2_identifier_to_internal_name(cleaned, line2_display_names),
        recommendation_aliases.get(normalized),
        display_aliases.get(normalized),
        cleaned,
    ]:
        _append_lookup_token(tokens, candidate)


def _station_lookup_tokens(
    station_id: str | None,
    station_name: str | None,
    display_station_name: str | None,
    line2_display_names: dict[str, str],
    recommendation_aliases: dict[str, str],
) -> list[str]:
    tokens: list[str] = []
    for value in [station_id, station_name, display_station_name]:
        _append_resolved_lookup_tokens(
            tokens=tokens,
            value=value,
            line2_display_names=line2_display_names,
            recommendation_aliases=recommendation_aliases,
        )
    return tokens


def _station_aliases(
    station_name: str,
    station_id: str,
    display_station_name: str = "",
) -> set[str]:
    normalized_name = _normalize_station_name(station_name)
    aliases = {
        alias
        for alias in [
            normalized_name,
            _normalize_station_name(station_id),
            _normalize_station_name(display_station_name),
        ]
        if alias
    }
    if normalized_name == "첨단지구역":
        aliases.add("첨단역")
    if normalized_name.endswith("지구역"):
        aliases.add(normalized_name.replace("지구역", "역"))
    return aliases


def _display_name_for_row(
    row: pd.Series,
    line2_display_names: dict[str, str],
) -> str:
    station_name = _clean_text(row.get("station_name"))
    station_id = _clean_text(row.get("station_id"))
    explicit_display_name = _clean_text(row.get("display_station_name"))
    if explicit_display_name:
        return explicit_display_name

    return (
        display_station_name_for(
            station_name=station_name,
            station_id=station_id,
            district=_clean_text(row.get("district")),
            line2_display_names=line2_display_names,
        )
        or station_name
    )


def _station_match_from_row(
    row: pd.Series,
    line2_display_names: dict[str, str],
) -> StationFeatureMatch:
    station_name = _clean_text(row.get("station_name"))
    station_id = _clean_text(row.get("station_id")) or station_name
    return StationFeatureMatch(
        row=row,
        station_id=station_id,
        station_name=station_name,
        display_station_name=_display_name_for_row(row, line2_display_names),
    )


def _feature_row_matches(
    row: pd.Series,
    lookup_tokens: list[str],
    line2_display_names: dict[str, str],
) -> bool:
    aliases = _station_aliases(
        _clean_text(row.get("station_name")),
        _clean_text(row.get("station_id")),
        _display_name_for_row(row, line2_display_names),
    )
    return any(_normalize_station_name(token) in aliases for token in lookup_tokens)


def _risk_level_to_competition_index(risk_level: str) -> float:
    if "높" in risk_level:
        return 82.5
    if "낮" in risk_level:
        return 17.5
    return 50.0


def _risk_level_to_closure_risk_index(risk_level: str) -> float:
    if "높" in risk_level:
        return 68.0
    if "낮" in risk_level:
        return 36.0
    return 52.0


def _business_diversity_from_reason(reason: str) -> float | None:
    match = re.search(r"상권 다양성 지수\s*([0-9]+(?:\.[0-9]+)?)", reason)
    if match is None:
        return None

    value = _safe_float(match.group(1), -1.0)
    if value < 0:
        return None
    if value <= 1:
        value *= 100
    return _clamp_score(value)


def _feature_row_from_recommendation(row: pd.Series) -> pd.Series:
    station_name = _clean_text(row.get("station_name"))
    station_id = _clean_text(row.get("station_id")) or station_name
    score = _safe_float(row.get("startup_suitability_score"), 50.0)
    growth_score = _safe_float(row.get("growth_score"), 50.0)
    risk_level = _clean_text(row.get("risk_level"))
    main_reason = _clean_text(row.get("main_reason"))
    competition_index = _risk_level_to_competition_index(risk_level)
    diversity_index = _business_diversity_from_reason(main_reason)
    if diversity_index is None:
        diversity_index = 50.0

    bus_total = max(0.0, growth_score * 20.0)
    base_values: dict[str, object] = {
        "station_id": station_id,
        "station_name": station_name,
        "radius_m": config.DEFAULT_RADIUS_M,
        "total_store_count": 7.0,
        "same_business_count_by_type": 1.0,
        "cafe_count": 1.0,
        "restaurant_count": 1.0,
        "convenience_count": 1.0,
        "pharmacy_count": 1.0,
        "beauty_count": 1.0,
        "academy_count": 1.0,
        "retail_count": 1.0,
        "business_type_count": 7.0,
        "business_diversity_index": diversity_index,
        "bus_boarding_count": round(bus_total * 0.5, 2),
        "bus_alighting_count": round(bus_total * 0.5, 2),
        "bus_total_count": round(bus_total, 2),
        "nearby_bus_stop_count": 2.0,
        "subway_pattern_score": _clamp_score(growth_score),
        "competition_index": competition_index,
        "floating_demand_index": _clamp_score(growth_score),
        "sales_potential_index": _clamp_score((score + growth_score) / 2.0),
        "closure_risk_index": _risk_level_to_closure_risk_index(risk_level),
        "startup_suitability_score": score,
        "district": _clean_text(row.get("district")),
        "display_station_name": _clean_text(row.get("display_station_name")),
    }
    return pd.Series(base_values)


def _available_station_candidates(
    features: pd.DataFrame,
    recommendations: pd.DataFrame,
    line2_display_names: dict[str, str],
    limit: int = 8,
) -> list[str]:
    candidates: list[str] = []

    def add_candidate(value: object) -> None:
        candidate = _clean_text(value)
        if candidate and candidate not in candidates:
            candidates.append(candidate)

    for _, row in features.iterrows():
        add_candidate(_display_name_for_row(row, line2_display_names))
        add_candidate(row.get("station_name"))
        add_candidate(row.get("station_id"))
        if len(candidates) >= limit:
            return candidates[:limit]

    for _, row in recommendations.iterrows():
        add_candidate(_recommendation_display_station_name(row, line2_display_names))
        add_candidate(row.get("station_name"))
        add_candidate(row.get("station_id"))
        if len(candidates) >= limit:
            return candidates[:limit]

    return candidates[:limit]


def _station_not_found_message(
    requested_label: str,
    candidates: list[str],
) -> str:
    if candidates:
        return (
            f"Station not found: {requested_label}. "
            f"Available candidates include: {', '.join(candidates)}"
        )
    return f"Station not found: {requested_label}. Available candidates include: none"


def _find_station_feature_match(
    features: pd.DataFrame,
    station_id: str | None,
    station_name: str | None,
    display_station_name: str | None,
) -> StationFeatureMatch:
    line2_display_names = _load_line2_display_aliases()
    recommendations = _load_recommendation_top5()
    recommendation_aliases = _build_recommendation_station_aliases(
        recommendations,
        line2_display_names,
    )
    lookup_tokens = _station_lookup_tokens(
        station_id=station_id,
        station_name=station_name,
        display_station_name=display_station_name,
        line2_display_names=line2_display_names,
        recommendation_aliases=recommendation_aliases,
    )
    candidates = _available_station_candidates(
        features=features,
        recommendations=recommendations,
        line2_display_names=line2_display_names,
    )
    requested_label = _clean_text(station_id) or _clean_text(station_name) or _clean_text(display_station_name)
    if not lookup_tokens:
        raise PredictionStationNotFoundError(
            _station_not_found_message("missing station identifier", candidates),
        )

    for _, row in features.iterrows():
        if _feature_row_matches(row, lookup_tokens, line2_display_names):
            return _station_match_from_row(row, line2_display_names)

    for _, row in recommendations.iterrows():
        feature_row = _feature_row_from_recommendation(row)
        if _feature_row_matches(feature_row, lookup_tokens, line2_display_names):
            return _station_match_from_row(feature_row, line2_display_names)

    raise PredictionStationNotFoundError(
        _station_not_found_message(requested_label, candidates),
    )


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


def _business_sales_modifier(business_type: str) -> float:
    modifiers = {
        "coffee": 1.08,
        "restaurant": 1.12,
        "convenience": 0.94,
        "bakery": 1.02,
        "retail": 0.98,
        "pharmacy": 1.04,
        "academy": 0.9,
        "beauty": 0.96,
    }
    return modifiers[_normalize_business_type(business_type)]


def _monthly_sales_series(
    payload: dict[str, object],
    business_type: str,
    startup_suitability_score: float,
    predicted_growth_rate: float,
    predicted_sales_change_rate: float,
) -> list[dict[str, object]]:
    floating = _clamp_score(_safe_float(payload.get("floating_demand_index"), 50.0))
    competition = _clamp_score(_safe_float(payload.get("competition_index"), 50.0))
    diversity = _clamp_score(_safe_float(payload.get("business_diversity_index"), 50.0))
    business_modifier = _business_sales_modifier(business_type)

    opening_value = (
        1150.0
        + (startup_suitability_score * 8.8)
        + (predicted_growth_rate * 7.4)
        + (floating * 4.2)
        + (diversity * 1.8)
        - (competition * 3.2)
    ) * business_modifier
    opening_value = max(900.0, opening_value)

    before_slope = max(
        90.0,
        (predicted_growth_rate * 4.8) + (floating * 2.6) - (competition * 1.5),
    ) * business_modifier
    after_target = opening_value * (1.0 + (predicted_sales_change_rate / 100.0))
    after_lift = after_target - opening_value
    early_momentum = max(0.22, min(0.42, (floating - competition + 70.0) / 260.0))

    def value(amount: float) -> int:
        return int(round(amount / 10.0) * 10)

    return [
        {
            "label": "-12개월",
            "before_opening_value": value(opening_value - (before_slope * 2.0)),
            "after_opening_value": None,
        },
        {
            "label": "-6개월",
            "before_opening_value": value(opening_value - before_slope),
            "after_opening_value": None,
        },
        {
            "label": "개통 시점",
            "before_opening_value": value(opening_value),
            "after_opening_value": value(opening_value),
        },
        {
            "label": "+6개월",
            "before_opening_value": None,
            "after_opening_value": value(opening_value + (after_lift * early_momentum)),
        },
        {
            "label": "+12개월",
            "before_opening_value": None,
            "after_opening_value": value(opening_value + (after_lift * 0.58)),
        },
        {
            "label": "+18개월",
            "before_opening_value": None,
            "after_opening_value": value(opening_value + (after_lift * 0.8)),
        },
        {
            "label": "+24개월",
            "before_opening_value": None,
            "after_opening_value": value(after_target),
        },
    ]


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
    business_type: str,
    station_id: str | None = None,
    station_name: str | None = None,
    display_station_name: str | None = None,
    scenario: str | None = None,
    radius_m: float = config.DEFAULT_RADIUS_M,
) -> dict[str, object]:
    features = _load_station_features()
    match = _find_station_feature_match(
        features=features,
        station_id=station_id,
        station_name=station_name,
        display_station_name=display_station_name,
    )
    row = match.row
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
    return {
        "data_status": data_status,
        "station_id": match.station_id,
        "station_name": match.station_name,
        "display_station_name": match.display_station_name,
        "business_type": business_type,
        "scenario": scenario,
        "radius_m": radius_m,
        "startup_suitability_score": predicted_score,
        "predicted_score": predicted_score,
        "predicted_growth_rate": growth_rate,
        "predicted_sales_change_rate": sales_change_rate,
        "monthly_sales_series": _monthly_sales_series(
            payload=payload,
            business_type=business_type,
            startup_suitability_score=predicted_score,
            predicted_growth_rate=growth_rate,
            predicted_sales_change_rate=sales_change_rate,
        ),
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
