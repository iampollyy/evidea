from evidea.modules.auth.rate_limit import LoginRateLimiter


class FakeClock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


def test_blocks_after_max_failures_and_unblocks_after_window() -> None:
    clock = FakeClock()
    limiter = LoginRateLimiter(max_attempts=3, window_seconds=60, clock=clock)
    for _ in range(3):
        assert limiter.retry_after("k") is None
        limiter.register_failure("k")
    assert limiter.retry_after("k") == 60

    clock.now += 45
    assert limiter.retry_after("k") == 15

    clock.now += 15
    assert limiter.retry_after("k") is None


def test_keys_are_independent_and_reset_clears() -> None:
    limiter = LoginRateLimiter(max_attempts=1, window_seconds=60, clock=FakeClock())
    limiter.register_failure("a")
    assert limiter.retry_after("a") is not None
    assert limiter.retry_after("b") is None
    limiter.reset("a")
    assert limiter.retry_after("a") is None
