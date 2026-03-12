"""
Reviews routes
GET  /reviews/latest
POST /reviews
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.review import Review
from utils.helpers import success_response, error_response
from utils.validators import validate_rating

reviews_bp = Blueprint("reviews", __name__, url_prefix="/reviews")


@reviews_bp.route("/latest", methods=["GET"])
def latest_reviews():
    reviews = (
        Review.query
        .order_by(Review.created_at.desc())
        .limit(4)
        .all()
    )
    return success_response([r.to_dict() for r in reviews])


@reviews_bp.route("", methods=["POST"])
@jwt_required()
def create_review():
    from models.user import User
    identity = get_jwt_identity()
    user     = User.query.get(identity.get("user_id"))

    data        = request.get_json(silent=True) or {}
    rating      = data.get("rating")
    review_text = data.get("review_text", "").strip()

    if not validate_rating(rating):
        return error_response("Rating must be an integer between 1 and 5.", 422)

    review = Review(
        user_id=user.id,
        rating=int(rating),
        review_text=review_text or None,
    )
    db.session.add(review)
    db.session.commit()

    return success_response(review.to_dict(), "Review submitted. Thank you!", 201)
