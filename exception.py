from fastapi import Request
from fastapi.responses import JSONResponse


class PincodeNotFoundError(Exception):
    def __init__(self, pincode: str):
        self.pincode = pincode


class InvalidPincodeError(Exception):
    def __init__(self, pincode: str, reason: str = "invalid format"):
        self.pincode = pincode
        self.reason = reason


async def invalid_pincode_handler(
    request: Request,
    exc: InvalidPincodeError,
):
    return JSONResponse(
        status_code=404,
        content={
            "error": "invalid_pincode",
            "message": f"pincode {exc.pincode} is invalid: {exc.reason}",
            "pincode": exc.pincode,
        },
    )


async def pincode_not_found_handler(
    request: Request,
    exc: PincodeNotFoundError,
):
    return JSONResponse(
        status_code=404,
        content={
            "error": "pincode_not_found",
            "message": f"no location found for pincode {exc.pincode}",
            "pincode": exc.pincode,
        },
    )
