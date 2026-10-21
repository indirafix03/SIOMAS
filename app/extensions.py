from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flasgger import Swagger

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()

swagger_config = dict(Swagger.DEFAULT_CONFIG)
swagger_config["ui_params"] = {"tagsSorter": "alpha"}

swagger = Swagger(config=swagger_config)