from decimal import Decimal

from marshmallow import RAISE, Schema, fields, validate

from underground.database import MARKETPLACE_ID


class UndergroundProductSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=150),
    )
    description = fields.String(
        required=True,
        validate=validate.Length(min=1, max=5000),
    )
    price = fields.Decimal(
        required=True,
        as_string=False,
        places=2,
        validate=validate.Range(min=Decimal("0")),
    )
    category = fields.String(
        required=True,
        validate=validate.Length(min=1, max=100),
    )
    subcategory = fields.String(
        required=True,
        validate=validate.Length(min=1, max=100),
    )
    image = fields.Url(required=True)
    vendor_id = fields.Integer(
        required=True,
        validate=validate.Range(min=1),
    )
    availability = fields.Boolean(load_default=True)
    average_rating = fields.Float(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    marketplace = fields.Constant(MARKETPLACE_ID, dump_only=True)

    class Meta:
        unknown = RAISE


underground_product_schema = UndergroundProductSchema()


class UndergroundAgeVerificationSchema(Schema):
    age = fields.Integer(
        required=True,
        strict=True,
        validate=validate.Range(min=0, max=130),
    )

    class Meta:
        unknown = RAISE


underground_age_verification_schema = UndergroundAgeVerificationSchema()


class ProductQuerySchema(Schema):
    q = fields.String(
        load_default=None,
        allow_none=True,
        validate=validate.Length(max=100),
    )
    category = fields.String(
        load_default=None,
        allow_none=True,
        validate=validate.Length(max=100),
    )
    subcategory = fields.String(
        load_default=None,
        allow_none=True,
        validate=validate.Length(max=100),
    )
    min_price = fields.Decimal(
        load_default=None,
        allow_none=True,
        as_string=True,
        places=2,
        validate=validate.Range(min=Decimal("0")),
    )
    max_price = fields.Decimal(
        load_default=None,
        allow_none=True,
        as_string=True,
        places=2,
        validate=validate.Range(min=Decimal("0")),
    )
    availability = fields.Boolean(load_default=None, allow_none=True)
    sort = fields.String(
        load_default="newest",
        validate=validate.OneOf(
            ["newest", "price_asc", "price_desc", "rating"]
        ),
    )
    page = fields.Integer(
        load_default=1,
        validate=validate.Range(min=1),
    )
    per_page = fields.Integer(
        load_default=20,
        validate=validate.Range(min=1, max=50),
    )

    class Meta:
        unknown = RAISE


product_query_schema = ProductQuerySchema()
