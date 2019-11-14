from __future__ import unicode_literals
from collections import deque
from functools import wraps

__all__ = (
    'SimpleCache',
    'FastDictCache',
    'memoized',
)


class SimpleCache(object):
    """
    Very simple cache that discards the oldest item when the cache size is
    exceeded.

    :param maxsize: Maximum size of the cache. (Don't make it too big.)
    """
    def __init__(self, maxsize=8):
        assert isinstance(maxsize, int) and maxsize > 0

        self._data = {}
        self._keys = deque()
        self.maxsize = maxsize

    def get(self, key, getter_func):
        """
        Get object from the cache.
        If not found, call `getter_func` to resolve it, and put that on the top
        of the cache instead.
        """
        # Look in cache first.
        try:
            return self._data[key]
        except KeyError:
            # Not found? Get it.
            value = getter_func()
            self._data[key] = value
            self._keys.append(key)

            # Remove the oldest key when the size is exceeded.
            if len(self._data) > self.maxsize:
                key_to_remove = self._keys.popleft()
                if key_to_remove in self._data:
                    del self._data[key_to_remove]

            return value

    def clear(self):
        " Clear cache. "
        self._data = {}
        self._keys = deque()


class FastDictCache(dict):
    """
    Fast, lightweight cache which keeps at most `size` items.
    It will discard the oldest items in the cache first.

    The cache is a dictionary, which doesn't keep track of access counts.
    It is perfect to cache little immutable objects which are not expensive to
    create, but where a dictionary lookup is still much faster than an object
    instantiation.

    :param get_value: Callable that's called in case of a missing key.
    """
    # NOTE: This cache is used to cache `prompt_toolkit.layout.screen.Char` and
    #       `prompt_toolkit.Document`. Make sure to keep this really lightweight.
    #       Accessing the cache should stay faster than instantiating new
    #       objects.
    #       (Dictionary lookups are really fast.)
    #       SimpleCache is still required for cases where the cache key is not
    #       the same as the arguments given to the function that creates the
    #       value.)
    def __init__(self, get_value=None, size=1000000):
        assert callable(get_value)
        assert isinstance(size, int) and size > 0

        self._keys = deque()
        self.get_value = get_value
        self.size = size

    def __missing__(self, key):
        # Remove the oldest key when the size is exceeded.
        if len(self) > self.size:
            key_to_remove = self._keys.popleft()
            if key_to_remove in self:
                del self[key_to_remove]

        result = self.get_value(*key)
        self[key] = result
        self._keys.append(key)
        return result


def memoized(maxsize=1024):
    """
    Momoization decorator for immutable classes and pure functions.
    """
    cache = SimpleCache(maxsize=maxsize)

    def decorator(obj):
        @wraps(obj)
        def new_callable(*a, **kw):
            def create_new():
                return obj(*a, **kw)

            key = (a, tuple(kw.items()))
            return cache.get(key, create_new)
        return new_callable
    return decorator
