from ariadne import graphql_sync, make_executable_schema, load_schema_from_path, ObjectType, QueryType, MutationType
from flask import Flask, request, jsonify, make_response

import resolvers as r

PORT = 3001
HOST = '0.0.0.0'
app = Flask(__name__)

type_defs = load_schema_from_path("movie.graphql")

query = ObjectType("Query")
mutation = ObjectType("Mutation")

query.set_field("list_movie", r.resolve_list_movie)
query.set_field("movie_by_id", r.resolve_movie_by_id)
query.set_field("movie_by_title", r.resolve_movie_by_title)
query.set_field("help", r.resolve_help)

mutation.set_field("add_movie", r.resolve_add_movie)
mutation.set_field("delete_movie", r.resolve_delete_movie)
mutation.set_field("update_movie_rating", r.resolve_update_movie_rating)

schema = make_executable_schema(type_defs, query, mutation)

# root message
@app.route("/", methods=['GET'])
def home():
    return make_response("<h1 style='color:blue'>Welcome to the Movie service!</h1>",200)

# graphql entry points
@app.route('/graphql', methods=['POST'])
def graphql_server():
    data = request.get_json()

    success, result = graphql_sync(schema, data, context_value=request)

    if success:
        status_code = 200
    else:
        status_code = 400

    return jsonify(result), status_code

if __name__ == "__main__":
    print("Server running in port %s"%(PORT))
    app.run(host=HOST, port=PORT)