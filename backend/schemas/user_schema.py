from marshmallow import Schema, fields, validate


class UserSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1))
    email = fields.Email(required=True)
    password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=8)
    )
    location = fields.String(load_default=None, allow_none=True)
