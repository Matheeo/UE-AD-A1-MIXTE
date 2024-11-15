from ariadne import graphql_sync, make_executable_schema, load_schema_from_path, ObjectType, QueryType, MutationType
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS

import resolvers as r

PORT = 3001
HOST = '0.0.0.0'
app = Flask(__name__)
CORS(app)


# -------------------------------------------------------
# GraphQL setup
# -------------------------------------------------------

# load schema
type_defs = load_schema_from_path("movie.graphql")

# create schema
query = ObjectType("Query")
mutation = ObjectType("Mutation")

# resolvers
query.set_field("list_movie", r.resolve_list_movie)
query.set_field("movie_by_id", r.resolve_movie_by_id)
query.set_field("movie_by_title", r.resolve_movie_by_title)
query.set_field("help", r.resolve_help)

# mutation
mutation.set_field("add_movie", r.resolve_add_movie)
mutation.set_field("delete_movie", r.resolve_delete_movie)
mutation.set_field("update_movie_rating", r.resolve_update_movie_rating)

# create schema
schema = make_executable_schema(type_defs, query, mutation)


# -------------------------------------------------------


@app.route("/", methods=['GET'])
def home():
    """Home page"""

    return make_response("<h1 style='color:blue'>Welcome to the Movie service!</h1>", 200)


@app.route('/graphql', methods=['POST'])
def graphql_server():
    """GraphQL endpoint"""

    # get the data from the request
    data = request.get_json()

    # execute the query
    success, result = graphql_sync(schema, data, context_value=request)

    # set the status code
    if success:
        status_code = 200
    else:
        status_code = 400

    # return the result
    return make_response(jsonify(result), status_code)


if __name__ == "__main__":
    print("Server running in port %s" % (PORT))
    app.run(host=HOST, port=PORT)
