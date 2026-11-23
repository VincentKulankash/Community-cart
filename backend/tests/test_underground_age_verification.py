def test_age_verification_status_is_separate_and_initially_unverified(client):
    with client.session_transaction() as session:
        session["_user_id"] = "42"

    response = client.get("/api/underground/age-verification")

    assert response.status_code == 200
    assert response.get_json() == {
        "verified": False,
        "minimum_age": 18,
        "simulated": True,
    }


def test_age_verification_accepts_adult_and_unlocks_api(client, monkeypatch):
    from underground import routes

    monkeypatch.setattr(routes, "get_underground_products", lambda: None)
    monkeypatch.setattr(
        routes,
        "search_products",
        lambda collection, filters: {
            "items": [],
            "page": 1,
            "per_page": 20,
            "total": 0,
            "pages": 0,
        },
    )

    response = client.post(
        "/api/underground/age-verification",
        json={"age": 18},
    )

    assert response.status_code == 200
    assert response.get_json()["verified"] is True
    assert response.get_json()["simulated"] is True
    assert client.get("/api/underground/age-verification").get_json()["verified"]
    assert client.get("/api/underground/products").status_code == 200


def test_underage_submission_is_rejected_and_clears_previous_verification(client):
    with client.session_transaction() as session:
        session["underground_age_verified"] = True

    response = client.post(
        "/api/underground/age-verification",
        json={"age": 17},
    )

    assert response.status_code == 403
    assert response.get_json()["code"] == "underground_age_rejected"
    assert client.get("/api/underground/age-verification").get_json()["verified"] is False
    assert client.get("/api/underground/products").status_code == 403


def test_age_verification_rejects_invalid_payloads(client):
    unsupported_media_type = client.post(
        "/api/underground/age-verification",
        data="age=18",
    )
    invalid_age = client.post(
        "/api/underground/age-verification",
        json={"age": True},
    )
    out_of_range_age = client.post(
        "/api/underground/age-verification",
        json={"age": 131},
    )
    extra_field = client.post(
        "/api/underground/age-verification",
        json={"age": 18, "birth_date": "2000-01-01"},
    )

    assert unsupported_media_type.status_code == 415
    assert invalid_age.status_code == 422
    assert out_of_range_age.status_code == 422
    assert extra_field.status_code == 422
    assert client.get("/api/underground/age-verification").get_json()["verified"] is False


def test_local_frontend_fallback_ports_can_call_age_gate(client):
    allowed = client.options(
        "/api/underground/age-verification",
        headers={
            "Origin": "http://127.0.0.1:3003",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    rejected = client.options(
        "/api/underground/age-verification",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert allowed.headers["Access-Control-Allow-Origin"] == "http://127.0.0.1:3003"
    assert allowed.headers["Access-Control-Allow-Credentials"] == "true"
    assert "Access-Control-Allow-Origin" not in rejected.headers
