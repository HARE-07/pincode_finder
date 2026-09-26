from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from data import pincode_db
from exception import (
    PincodeNotFoundError,
    pincode_not_found_handler,
    invalid_pincode_handler,
    InvalidPincodeError,
)
from model import LocationResponse, BulkRequest, BulkResponse

app = FastAPI(
    title="Pincode Finder",
    description="Pincode lookup API with a web interface",
)

# Register custom exception handlers
app.add_exception_handler(PincodeNotFoundError, pincode_not_found_handler)
app.add_exception_handler(InvalidPincodeError, invalid_pincode_handler)


@app.get("/api")
def api_root():
    return {"message": "pincode lookup api"}


@app.get("/pincode/{code}", response_model=LocationResponse)
def lookup(code: str):
    if len(code) != 6 or not code.isdigit():
        raise InvalidPincodeError(code, "must be exactly 6 digits")

    if code not in pincode_db:
        raise PincodeNotFoundError(code)

    return pincode_db[code]


@app.post("/pincode/bulk", response_model=BulkResponse)
def bulk_lookup(request: BulkRequest):
    result = []
    missing = []

    for code in request.pincode:
        if code in pincode_db:
            result.append(pincode_db[code])
        else:
            missing.append(code)

    return BulkResponse(
        found=len(result),
        not_found=len(missing),
        result=result,
        missing=missing,
    )


# Serve the frontend from FastAPI
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", include_in_schema=False)
def website():
    return FileResponse("static/index.html")
