from flask import Flask
from flask.ext.restful import Api
# import flask.ext.whooshalchemy as whooshalchemy

# from flask.ext import admin, wtf
# from flask.ext.admin.contrib import sqlamodel, fileadmin
# from flask.ext.admin.base import MenuLink, Admin, BaseView, expose

from api import *
from models import *
from admin import *
import settings

#
# APP CONFIG
#
app = Flask(__name__,
            static_url_path = '',
            static_folder = '../web-app')
app.config['SQLALCHEMY_DATABASE_URI'] = settings.DB_URI

# Secret key to use sessions
app.config['SECRET_KEY'] = '\xc0\x19\x94\x19v\xf3\x85mul9[y\xd6\xc7\xf4\xc6sz\x03U09\x05'

#
# API Resources
#
api = Api(app)

api.add_resource(Email,       '/api/v1/email')
api.add_resource(Users,       '/api/v1/user')
api.add_resource(Messages,    '/api/v1/messages')
api.add_resource(Annotations, '/api/v1/annotations',  '/api/v1/annotations/<int:ann_id>')
api.add_resource(Documents,   '/api/v1/documents',    '/api/v1/documents/<int:doc_id>')
api.add_resource(Network,     '/api/v1/network')
api.add_resource(Gold,        '/api/v1/gm',           '/api/v1/gm/<int:doc_id>')
api.add_resource(Quests,      '/api/v1/quest',        '/api/v1/quest/<int:quest_id>',     '/api/v1/quest/<string:quest_name>')

#
# API Resources
#
# admin = admin.Admin(app, 'Mark2Cure')
# admin.add_view( MyQuestView(Quests, db.session) )

#
# Main App Center
#

if __name__ == '__main__':
    app.debug = True
    app.run()