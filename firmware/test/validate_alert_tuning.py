class AlertState:
    def __init__(self, duration_minutes=10):
        self.duration_minutes = duration_minutes
        self.sustained_minutes = 0
        self.latched = False
        self.alert_count = 0

    def evaluate(self, avg_db, threshold):
        if avg_db > threshold:
            self.sustained_minutes += 1
        else:
            self.sustained_minutes = 0
            self.latched = False
            return False

        if not self.latched and self.sustained_minutes >= self.duration_minutes:
            self.latched = True
            self.alert_count += 1
            return True

        return False


def parse_time_to_minutes(value):
    hours, minutes = value.split(":")
    return (int(hours) * 60) + int(minutes)


def is_quiet_hours_active(current_time, start_time, end_time):
    current = parse_time_to_minutes(current_time)
    start = parse_time_to_minutes(start_time)
    end = parse_time_to_minutes(end_time)

    if start == end:
        return False
    if start < end:
        return start <= current < end
    return current >= start or current < end


def test_alert_triggers_once_after_configured_duration():
    state = AlertState(duration_minutes=3)

    assert not state.evaluate(81.0, 80.0)
    assert not state.evaluate(82.0, 80.0)
    assert state.evaluate(83.0, 80.0)
    assert not state.evaluate(84.0, 80.0)
    assert state.alert_count == 1


def test_alert_resets_after_recovery():
    state = AlertState(duration_minutes=2)

    assert not state.evaluate(82.0, 80.0)
    assert not state.evaluate(79.0, 80.0)
    assert not state.evaluate(82.0, 80.0)
    assert state.evaluate(82.0, 80.0)
    assert state.alert_count == 1


def test_quiet_hours_crossing_midnight():
    assert is_quiet_hours_active("23:30", "22:00", "07:00")
    assert is_quiet_hours_active("06:30", "22:00", "07:00")
    assert not is_quiet_hours_active("12:00", "22:00", "07:00")


if __name__ == "__main__":
    test_alert_triggers_once_after_configured_duration()
    test_alert_resets_after_recovery()
    test_quiet_hours_crossing_midnight()
    print("SUCCESS: Alert tuning state machine checks passed successfully!")
