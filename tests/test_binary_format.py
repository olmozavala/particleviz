"""Tests for ParticleViz binary encoding helpers."""

import numpy as np

from ParticleViz_DataPreproc.BinaryFormat import (
    decode_chunk,
    encode_dense_chunk,
    encode_ragged_chunk,
    experiment_slug,
    format_header,
    parse_header,
)


def test_experiment_slug() -> None:
    """Experiment names should map to stable folder slugs."""
    assert experiment_slug("Global Litter") == "global_litter"
    assert experiment_slug(" Dataset 1 ") == "dataset_1"


def test_header_roundtrip() -> None:
    """Header formatting and parsing should preserve all fields."""
    header = format_header(100, 50, "2021-01-01T00:00:00", "days", 1.0, True, True)
    parsed = parse_header(header)
    assert parsed == (100, 50, "2021-01-01T00:00:00", "days", 1.0, True, True)


def test_legacy_header_defaults_to_dense() -> None:
    """Six-field headers should remain compatible with older files."""
    parsed = parse_header("10, 5, 2020-01-01T00:00:00, seconds, 3600, False")
    assert parsed[-1] is False


def test_dense_roundtrip() -> None:
    """Dense chunks without NaNs should round-trip unchanged."""
    lats = np.array([[10.5, 11.0], [20.0, 21.5]], dtype=np.float64)
    lons = np.array([[100.0, 101.0], [110.0, 111.0]], dtype=np.float64)
    payload = encode_dense_chunk(lats, lons)
    decoded_lats, decoded_lons, visible = decode_chunk(payload, 2, 2, False, False)
    np.testing.assert_allclose(decoded_lats, lats)
    np.testing.assert_allclose(decoded_lons, lons)
    assert visible.all()


def test_ragged_roundtrip() -> None:
    """Ragged chunks should preserve only visible particle positions."""
    lats = np.array([[10.0, np.nan], [np.nan, 30.0]], dtype=np.float64)
    lons = np.array([[100.0, np.nan], [np.nan, 300.0]], dtype=np.float64)
    visible = np.array([[True, False], [False, True]])
    payload = encode_ragged_chunk(lats, lons, visible)
    decoded_lats, decoded_lons, decoded_visible = decode_chunk(payload, 2, 2, True, True)

    assert decoded_visible[0, 0]
    assert not decoded_visible[0, 1]
    assert not decoded_visible[1, 0]
    assert decoded_visible[1, 1]
    assert decoded_lats[0, 0] == 10.0
    assert decoded_lons[0, 0] == 100.0
    assert decoded_lats[1, 1] == 30.0
    assert decoded_lons[1, 1] == 300.0
    assert np.isnan(decoded_lats[0, 1])
    assert np.isnan(decoded_lons[1, 0])
