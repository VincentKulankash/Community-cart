from marshmallow import EXCLUDE, Schema, fields, validate


class ListingSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=150))
    description = fields.String(required=True, validate=validate.Length(min=1))
    price = fields.Decimal(required=True, as_string=False, places=2)
    category = fields.String(required=True, validate=validate.Length(min=1, max=100))
    condition = fields.String(load_default=None, allow_none=True)
    image_url = fields.String(load_default=None, allow_none=True)
    location = fields.String(load_default=None, allow_none=True)
    status = fields.String(load_default="active", allow_none=False)

    class Meta:
        unknown = EXCLUDE


listing_schema = ListingSchema()
listing_update_schema = ListingSchema(partial=True)