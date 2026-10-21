from flask import jsonify

def success_response(data=None, message="Berhasil", code=200, **kwargs):
    """
    Standard successful API response format.
    """
    response_body = {
        "success": True,
        "message": message,
        "data": data
    }
    for key, value in kwargs.items():
        response_body[key] = value
    return jsonify(response_body), code


def error_response(message="Terjadi kesalahan", code=400, errors=None, **kwargs):
    """
    Standard error API response format.
    """
    response_body = {
        "success": False,
        "message": message
    }
    if errors is not None:
        response_body["errors"] = errors
    for key, value in kwargs.items():
        response_body[key] = value
    return jsonify(response_body), code
