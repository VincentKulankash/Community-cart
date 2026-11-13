from marshmallow import EXCLUDE, Schema, fields


class ListingSchema(Schema):
    title = fields.String(required=True)
    description = fields.String(required=True)
    price = fields.Decimal(required=True, as_string=True)
    category = fields.String(required=True)
    condition = fields.String(load_default=None, allow_none=True)
    image_url = fields.String(load_default=None, allow_none=True)
    location = fields.String(load_default=None, allow_none=True)

    class Meta:
        unknown = EXCLUDE
