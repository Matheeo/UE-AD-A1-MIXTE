import json
import os
import sys
from datetime import datetime

import grpc
import requests
from flask import Flask, jsonify, make_response
from google.protobuf.json_format import MessageToDict

# Add the path to the booking proto file
sys.path.append(os.path.join(os.path.dirname(__file__), '../booking'))
from booking import booking_pb2, booking_pb2_grpc

app = Flask(__name__)

PORT = 3203
HOST = '0.0.0.0'

# -------------------------------------------
# Movie service
movie_ws = "http://localhost:3001/graphql"

query_get_movie_by_id = """
query getMovieById($id: String!) {
  movie_by_id(id: $id) {
    id
    title
    director
    rating
  }
}
"""
# -------------------------------------------

# -------------------------------------------
# Booking service

# Create a channel to the booking service
booking_channel = grpc.insecure_channel('localhost:3003')

# Create a stub to the booking service
booking_stub = booking_pb2_grpc.BookingStub(booking_channel)


# -------------------------------------------


# Load the users from the json file
def load_users():
    with open('{}/data/users.json'.format("."), 'r') as jsf:
        return json.load(jsf)["users"]


# Check if the user exist in the database
def user_exist(userid):
    exist = False
    for user in users:
        if user["id"] == userid:
            exist = True
    return exist


@app.route("/", methods=['GET'])
def home():
    """Return the home page of the user service"""

    return "<h1 style='color:blue'>Welcome to the User service!</h1>"


@app.route("/users/<string:userid>/movies/watched-count", methods=["GET"])
def get_user_watchedcount(userid):
    """Return the number of movie booking booking the today date"""

    today = datetime.today().strftime('%Y%m%d')
    counter = 0

    # check to be sure the user is in the database
    if user_exist(userid):

        # request to get the user bookings
        booking_request = booking_pb2.UserId(userid=userid)
        booking_response = booking_stub.GetBookingByUser(booking_request)

        # if the request has no problems and the dates list exist in json response
        if booking_response.userid and booking_response.dates:

            # iterate over all the booking dates
            for date in booking_response.dates:

                # if the date is before the today date
                if date.date < today:
                    # we iterate over the movies of the date and add 1 each times
                    for movie in date.movies:
                        counter += 1

        return make_response(jsonify({"watched-count": counter}), 200)
    return make_response("User not found", 404)


@app.route("/users/<string:userid>/movies/titles", methods=["GET"])
def get_booked_movie_titles(userid):
    """Return all the title of the movies in user booking"""

    titles = []

    # check to be sure the user is in the database
    if user_exist(userid):

        # request to get the user bookings
        booking_request = booking_pb2.UserId(userid=userid)
        booking_response = booking_stub.GetBookingByUser(booking_request)
        response_dict = MessageToDict(booking_response)

        # if the request has no problems and the dates list exist in json response
        print(response_dict)
        if booking_response.userid and booking_response.dates:

            # iterate over all the booking dates
            for date in booking_response.dates:

                # we iterate over the movies of the date and add 1 each times
                for movie in date.movies:

                    # get the movie object
                    variables = {"id": movie}
                    response_movie = requests.post(
                        movie_ws,
                        json={'query': query_get_movie_by_id, 'variables': variables}
                    )

                    # check if we get response
                    if response_movie.status_code == 200 and response_movie.json()["data"]["movie_by_id"]:

                        # check if the title is not already in the movie list
                        if not response_movie.json()["data"]["movie_by_id"]["title"] in titles:
                            # add title to the list
                            titles.append(response_movie.json()["data"]["movie_by_id"]["title"])

            return make_response(jsonify({"titles": titles}), 200)
    return make_response("User ID not found")


users = load_users()

if __name__ == "__main__":
    print("Server running in port %s" % (PORT))
    app.run(host=HOST, port=PORT)
