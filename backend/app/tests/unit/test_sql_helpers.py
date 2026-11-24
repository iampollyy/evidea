from evidea.core.sql import contains_pattern, escape_like


def test_like_wildcards_and_escape_char_are_escaped() -> None:
    assert escape_like("100%") == "100\\%"
    assert escape_like("a_b") == "a\\_b"
    assert escape_like("back\\slash") == "back\\\\slash"
    assert escape_like("plain") == "plain"


def test_contains_pattern_trims_and_wraps() -> None:
    assert contains_pattern("  kow ") == "%kow%"
