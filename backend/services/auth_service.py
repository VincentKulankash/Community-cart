from backend.extensions import bcrypt
from backend.models import User


# 1. Hash passwords
def hash_password(password):
    """
    Converts a plain password into a secure hash.
    """
    hashed = bcrypt.generate_password_hash(password)
    return hashed.decode("utf-8")


# 2. Verify passwords
def verify_password(password, hashed_password):
    """
    Checks whether the provided password
    matches the stored password hash.
    """
    return bcrypt.check_password_hash(hashed_password, password)


# 3. Check for duplicate emails
def email_exists(email):
    """
    Checks whether an email is already registered.
    """
    email = email.strip().lower()

    existing_user = User.query.filter_by(email=email).first()

    return existing_user is not None