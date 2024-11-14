import time
from functools import wraps

class RateLimiter:
    def __init__(self, calls_per_second=1):
        self.calls_per_second = calls_per_second
        self.last_call_time = 0

    def wait(self):
        """Wait if necessary to maintain the rate limit"""
        current_time = time.time()
        time_since_last_call = current_time - self.last_call_time
        time_to_wait = (1.0 / self.calls_per_second) - time_since_last_call
        
        if time_to_wait > 0:
            time.sleep(time_to_wait)
        
        self.last_call_time = time.time()

def rate_limit(calls_per_second=1):
    """Decorator to rate limit function calls"""
    limiter = RateLimiter(calls_per_second)
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            limiter.wait()
            return func(*args, **kwargs)
        return wrapper
    return decorator
