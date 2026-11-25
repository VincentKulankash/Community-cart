import base64
import os
import re
from datetime import datetime
from zoneinfo import ZoneInfo

import requests


SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke"
REQUEST_TIMEOUT = 15


class MpesaConfigurationError(Exception):
    pass


class MpesaServiceError(Exception):
    pass


def get_sandbox_credentials():
    environment = os.getenv("MPESA_ENV", "sandbox").strip().lower()

    if environment != "sandbox":
        raise MpesaConfigurationError(
            "Only the M-Pesa sandbox environment is permitted."
        )

    consumer_key = os.getenv("MPESA_CONSUMER_KEY", "").strip()
    consumer_secret = os.getenv("MPESA_CONSUMER_SECRET", "").strip()

    if not consumer_key or not consumer_secret:
        raise MpesaConfigurationError(
            "M-Pesa sandbox credentials are not configured."
        )

    return consumer_key, consumer_secret


def get_access_token():
    consumer_key, consumer_secret = get_sandbox_credentials()

    credentials = base64.b64encode(
        f"{consumer_key}:{consumer_secret}".encode("utf-8")
    ).decode("ascii")

    try:
        response = requests.get(
            f"{SANDBOX_BASE_URL}/oauth/v1/generate",
            params={"grant_type": "client_credentials"},
            headers={"Authorization": f"Basic {credentials}"},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()

    except requests.RequestException as exc:
        raise MpesaServiceError(
            "Could not connect to the M-Pesa sandbox."
        ) from exc
    except ValueError as exc:
        raise MpesaServiceError(
            "The M-Pesa sandbox returned an invalid response."
        ) from exc

    access_token = data.get("access_token")

    if not access_token:
        raise MpesaServiceError(
            "The M-Pesa sandbox did not return an access token."
        )

    return access_token


def initiate_stk_push(amount, account_reference, phone_number):
    get_sandbox_credentials()

    shortcode = os.getenv("MPESA_SHORTCODE", "").strip()
    passkey = os.getenv("MPESA_PASSKEY", "").strip()
    callback_url = os.getenv("MPESA_CALLBACK_URL", "").strip()
    phone_number = str(phone_number or "").strip().replace(" ", "").replace("-", "")

    if phone_number.startswith("0") and len(phone_number) == 10:
        phone_number = "254" + phone_number[1:]
    elif phone_number.startswith("+254"):
        phone_number = phone_number[1:]

    if not all([shortcode, passkey, callback_url, phone_number]):
        raise MpesaConfigurationError(
            "M-Pesa sandbox STK settings are incomplete."
        )

    if not callback_url.startswith("https://"):
        raise MpesaConfigurationError(
            "The sandbox callback URL must use HTTPS."
        )

    if not re.fullmatch(r"254\d{9}", phone_number):
        raise MpesaConfigurationError(
            "Enter a valid Kenyan M-Pesa phone number."
        )

    try:
        amount = int(amount)
    except (TypeError, ValueError):
        raise MpesaServiceError(
            "Payment amount must be a whole number."
        )

    if amount < 1:
        raise MpesaServiceError(
            "Payment amount must be greater than zero."
        )

    account_reference = str(account_reference).strip()

    if not account_reference or len(account_reference) > 12:
        raise MpesaServiceError(
            "Invalid payment account reference."
        )

    timestamp = datetime.now(
        ZoneInfo("Africa/Nairobi")
    ).strftime("%Y%m%d%H%M%S")

    password = base64.b64encode(
        f"{shortcode}{passkey}{timestamp}".encode("utf-8")
    ).decode("ascii")

    access_token = get_access_token()

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone_number,
        "PartyB": shortcode,
        "PhoneNumber": phone_number,
        "CallBackURL": callback_url,
        "AccountReference": account_reference,
        "TransactionDesc": "LocalLoop",
    }

    try:
        response = requests.post(
            f"{SANDBOX_BASE_URL}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()

    except requests.RequestException as exc:
        raise MpesaServiceError(
            "Could not submit the STK request to the sandbox."
        ) from exc
    except ValueError as exc:
        raise MpesaServiceError(
            "The M-Pesa sandbox returned an invalid STK response."
        ) from exc

    if str(data.get("ResponseCode")) != "0":
        raise MpesaServiceError(
            data.get("ResponseDescription")
            or "The M-Pesa sandbox rejected the STK request."
        )

    if not data.get("CheckoutRequestID") or not data.get("MerchantRequestID"):
        raise MpesaServiceError(
            "The sandbox response did not contain the required request IDs."
        )

    return {
        "merchant_request_id": data["MerchantRequestID"],
        "checkout_request_id": data["CheckoutRequestID"],
        "response_code": data["ResponseCode"],
        "customer_message": data.get("CustomerMessage", ""),
    }


def query_stk_push(checkout_request_id):
    get_sandbox_credentials()

    shortcode = os.getenv("MPESA_SHORTCODE", "").strip()
    passkey = os.getenv("MPESA_PASSKEY", "").strip()

    if not shortcode or not passkey:
        raise MpesaConfigurationError(
            "M-Pesa sandbox shortcode or passkey is missing."
        )

    checkout_request_id = str(checkout_request_id).strip()

    if not checkout_request_id:
        raise MpesaServiceError(
            "Checkout request ID is required."
        )

    timestamp = datetime.now(
        ZoneInfo("Africa/Nairobi")
    ).strftime("%Y%m%d%H%M%S")

    password = base64.b64encode(
        f"{shortcode}{passkey}{timestamp}".encode("utf-8")
    ).decode("ascii")

    access_token = get_access_token()

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id,
    }

    try:
        response = requests.post(
            f"{SANDBOX_BASE_URL}/mpesa/stkpushquery/v1/query",
            json=payload,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()

    except requests.RequestException as exc:
        raise MpesaServiceError(
            "Could not query the M-Pesa sandbox."
        ) from exc
    except ValueError as exc:
        raise MpesaServiceError(
            "The M-Pesa sandbox returned an invalid query response."
        ) from exc

    if not isinstance(data, dict):
        raise MpesaServiceError(
            "Invalid M-Pesa sandbox query response."
        )

    return data
