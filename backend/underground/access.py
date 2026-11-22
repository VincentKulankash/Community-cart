from functools import wraps

from flask import jsonify, session

MINIMUM_AGE = 18


def underground_age_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if session.get("underground_age_verified") is not True:
            return jsonify(
                {
                    "error": "Underground age verification is required.",
                    "code": "underground_age_required",
                }
            ), 403
        return view(*args, **kwargs)

    return wrapped
