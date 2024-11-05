# Load the movies from the json file
import json

from graphql import GraphQLError


def load_movies():
    with open('{}/data/movies.json'.format("."), 'r') as jsf:
        return json.load(jsf)["movies"]

# Save the movies to the json file
def save_movies(movies_list):
    with open('{}/data/movies.json'.format("."), 'w') as jsf:
        json.dump({"movies": movies_list}, jsf, indent=4)

def movie_exist(movieid):
    exist = False
    for movie in movies:
        if movie["id"] == movieid:
            exist = True
    return exist

movies = load_movies()

def resolve_list_movie(_, info):
    return movies

def resolve_movie_by_id(_, info, id):

    for movie in movies:
        if movie["id"] == id:
            return movie

    return None

def resolve_movie_by_title(_, info, title):

    for movie in movies:
        if movie["title"] == title:
            return movie

    return None

def resolve_add_movie(_, info, id, title, rating, director):

    # check if the movie already exists
    exist = movie_exist(id)

    # if the movie already exists, we will return a 409 error
    if exist:
        return GraphQLError("The movie already exist in database")

    # if the movie does not exist, we will add the movie to the list
    else:
        new_movie = {
            "id": id,
            "title": title,
            "director": director,
            "rating": rating
        }
        movies.append(new_movie) # add the movie to the list
        save_movies(movies) # save the movies to the json file
        return new_movie

def resolve_delete_movie(_, info, id):

    global movies

    # check if the movie already exists
    exist = movie_exist(id)

    # if the movie already exists, we will return a 409 error
    if not exist:
        return GraphQLError("The movie ID not found in database")

    # if the movie exists, we will delete the movie
    movies = [movie for movie in movies if movie["id"] != id]

    # we save the new movies list
    save_movies(movies)

    return {"message": "Movie deleted with succes"}

def resolve_update_movie_rating(_, info, id, rating):

    # Demander a la prof si on peux renvoyer une autre erreur pour note invalide
    if (rating < 0 or rating > 10) or not isinstance(rating, int):
        return GraphQLError("Rate invalid")

    # check if the movie already exists
    exist = movie_exist(id)

    # if the movie does not exist, we will return a 400 error
    if not exist:
        return GraphQLError("Movie id not found")

    # if the movie exists, we will update the movie rate
    for movie in movies:
        if movie["id"] == id:
            movie["rating"] = rating

    # we save the new movies list
    save_movies(movies)
    return {"message": "Rate updated with succes!"}




def resolve_movies_by_minimal_rating(rating):

    movies_list = []

    # convert the rate to int, if that raise an Exception
    try:
        min_rating = rating
    except (TypeError, ValueError):
        return GraphQLError("Rate invalid")

    # if the rating is valid
    if min_rating >= 0 or min_rating <= 10:

        # we will loop through the movies list
        for movie in movies:

            # if the movie title is found, we will return the movie
            if movie["rating"] >= min_rating:
                movies_list.append(movie)

        return movies_list
    return GraphQLError("Rate invalid")


def resolve_movies_by_director(director):
    """Return all the movie by director"""

    movies_list = []

    # get the director param in url
    director = director

    # we will loop through the movies list
    for movie in movies:

        # if the movie director is the same, we add the movie in the list
        if movie["director"] == director:
            movies_list.append(movie)

    return movies_list

def resolve_help(_, info):
    # Get the schema informations
    schema = info.schema
    query_type = schema.get_type("Query")
    mutation_type = schema.get_type("Mutation")

    # Formate arguments in json
    def format_arguments(args):
        formatted_args = []
        for arg_name, arg in args.items():
            formatted_args.append({
                "name": arg_name,
                "type": str(arg.type)
            })
        return formatted_args

    # Create all querys informations
    queries = []
    for name, field in query_type.fields.items():
        queries.append({
            "name": name,
            "description": field.description or "No description available",
            "type": "Query",
            "arguments": format_arguments(field.args)  # Ajouter les arguments
        })

    # Create all the mutations informations
    mutations = []
    for name, field in mutation_type.fields.items():
        mutations.append({
            "name": name,
            "description": field.description or "No description available",
            "type": "Mutation",
            "arguments": format_arguments(field.args)  # Ajouter les arguments
        })

    # Return queries and mutations information
    return queries + mutations