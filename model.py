from pydantic import BaseModel, field_validator


class PincodeRequest(BaseModel):
    pincode: str

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, value):
        if len(value) != 6 or not value.isdigit():
            raise ValueError("pincode should be exactly 6 digits")
        return value


class LocationResponse(BaseModel):
    pincode: str
    city: str
    state: str
    district: str
    lat: float
    lon: float


class BulkRequest(BaseModel):
    pincode: list[str]

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, value):
        if len(value) == 0:
            raise ValueError("at least one pincode is required")

        if len(value) > 20:
            raise ValueError("maximum 20 pincodes are allowed per request")

        for code in value:
            # Important: validate each individual code.
            if len(code) != 6 or not code.isdigit():
                raise ValueError(f"invalid pincode: {code}")

        return value


class BulkResponse(BaseModel):
    status: str = "success"
    found: int
    not_found: int
    result: list[LocationResponse]
    missing: list[str]
