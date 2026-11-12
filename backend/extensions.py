# OWNER: VINCENT (Scrum Master / Integration)
# TASKS:
# 1. Initialize db, bcrypt, login_manager, migrate, cors.
# 2. Import these anywhere in the app to avoid circular imports.

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
migrate = Migrate()
cors = CORS()

