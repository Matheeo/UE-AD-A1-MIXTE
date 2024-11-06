import os
import sys
from queue import Empty
import grpc
from concurrent import futures
from flask import request
from google.protobuf.json_format import MessageToDict

import booking_pb2
import booking_pb2_grpc
import json
import requests

sys.path.append(os.path.join(os.path.dirname(__file__), '../showtime'))
from showtime import showtime_pb2, showtime_pb2_grpc


class BookingServicer(booking_pb2_grpc.BookingServicer):

    def __init__(self):
        with open('{}/data/bookings.json'.format("."), "r") as jsf:
            self.db = json.load(jsf)["bookings"]

        self.showtime_channel = grpc.insecure_channel('localhost:3002')  # Port du serveur ShowtimeService
        self.showtime_stub = showtime_pb2_grpc.ShowtimeStub(self.showtime_channel)

    def __del__(self):
        self.showtime_channel.close()

    # check if the movie is available a the good date in showtime
    def movie_available(self, date, movieid):


        showtime_request = showtime_pb2.Date(date=date)


        showtime_response = self.showtime_stub.GetTimeByDate(showtime_request)
        response_dict = MessageToDict(showtime_response)

        if response_dict["date"]:

            # iterate over all the movies
            for movie in response_dict["movies"]:

                # if the movieid is in the movies liest of the date
                if movie == movieid:
                    return True

        return False

    def proto_object_by_user(self, userid):

        for item in self.db:
            # if the userid is the same as the one in the url
            if item["userid"] == userid:
                bookings_dates = [
                    booking_pb2.Informations(
                        date=info['date'],
                        movies=info['movies']
                    ) for info in item['dates']
                ]

                # Create proto data object
                return booking_pb2.BookingData(
                    userid=item['userid'],
                    dates=bookings_dates
                )

    def save_bookings(self, bookings):
        try:
            with open('data/bookings.json', 'w') as jsf:
                json.dump({"bookings": bookings}, jsf, indent=4)
            print("Les réservations ont été sauvegardées avec succès.")
        except IOError as e:
            print("Erreur lors de la sauvegarde des réservations")

    def Home(self, request, context):
        return booking_pb2.HTMLBooking(
            html_content="<h1 style='color:blue'>Welcome to the Booking service!</h1>"
        )

    def GetBookings(self, request, context):
        bookings_list = []

        # Iterate over all object in database
        for item in self.db:

            bookings_dates = [
                booking_pb2.Informations(
                    date=info['date'],
                    movies=info['movies']
                ) for info in item['dates']
            ]

            # Create proto data object
            booking = booking_pb2.BookingData(
                userid=item['userid'],
                dates=bookings_dates
            )

            # Add it to the return list
            bookings_list.append(booking)

        # Create the proto return object with the list of object
        return booking_pb2.BookingsData(bookings=bookings_list)

    def GetBookingByUser(self, request, context):

        if not request or request.userid == '':
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("The parameter userid must be defined")
            return Empty()

        # iterate over the bookings
        for item in self.db:
            if item["userid"] == request.userid:
                return self.proto_object_by_user(request.userid)

        # If userid note found, setup error information
        context.set_details('No data found for the specified userid.')
        context.set_code(grpc.StatusCode.NOT_FOUND)
        return Empty()

    def AddBookingByUser(self, request, context):

        if not request or request.userid == "" or request.date == "" or request.movieid == "":
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("The parameters userid, date, movieid must be defined")
            return Empty()

        userid = request.userid
        datetoadd = request.date
        movieidtoadd = request.movieid

        # check if the userid already exist
        userid_exist = False
        for booking in self.db:
            if booking["userid"] == userid:
                userid_exist = True

        if not userid_exist:
            context.set_details('No data found for the specified userid.')
            context.set_code(grpc.StatusCode.NOT_FOUND)
            return Empty()

        # if the user id is already in the json
        else:
            movie_exist_in_date = False
            date_exist = False

            # we grab the user booking
            for user_bookings in self.db:

                if user_bookings["userid"] == userid:

                    # we iterate over the user date
                    for date in user_bookings["dates"]:

                        # check if the date matches the one in the request body
                        if date["date"] == datetoadd:
                            date_exist = True

                            # if it's the same date, we iterate over the movies of the date
                            for movie in date["movies"]:

                                # if the movie is on the same date as in the request
                                if movie == movieidtoadd:
                                    movie_exist_in_date = True

                            # if the movie id is not in the date we add the movieid
                            if not movie_exist_in_date:

                                # chech if the movie is available
                                if self.movie_available(datetoadd, movieidtoadd):
                                    date["movies"].append(movieidtoadd)
                                    self.save_bookings(self.db)
                                    return self.proto_object_by_user(request.userid)
                                else:
                                    context.set_details("Booking are possible")
                                    context.set_code(grpc.StatusCode.FAILED_PRECONDITION)
                                    return Empty()

                    # if the date does not exist
                    if not date_exist:

                        # chech if the movie is available
                        if self.movie_available(datetoadd, movieidtoadd):
                            user_bookings["dates"].append({"date": datetoadd, "movies": [movieidtoadd]})
                            self.save_bookings(self.db)
                            return self.proto_object_by_user(userid)
                        else:
                            context.set_details("Booking are possible")
                            context.set_code(grpc.StatusCode.FAILED_PRECONDITION)
                            return Empty()

            context.set_details("An existing item already exists")
            context.set_code(grpc.StatusCode.ALREADY_EXISTS)
            return Empty()




def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    booking_pb2_grpc.add_BookingServicer_to_server(BookingServicer(), server)
    server.add_insecure_port('[::]:3003')
    server.start()
    server.wait_for_termination()


if __name__ == '__main__':
    serve()
