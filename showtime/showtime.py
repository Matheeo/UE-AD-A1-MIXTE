from queue import Empty

import grpc
from concurrent import futures
import showtime_pb2
import showtime_pb2_grpc
import json



class ShowtimeServicer(showtime_pb2_grpc.Showtime):

    def __init__(self):
        with open('{}/data/times.json'.format("."), "r") as jsf:
            self.db = json.load(jsf)["schedule"]

    def Home(self, request, context):
        return showtime_pb2.HTMLPage(
            html_content="<h1 style='color:blue'>Welcome to the Showtime service!</h1>"
        )

    def GetTimes(self, request, context):
        times_list = []

        # Iterate over all object in database
        for item in self.db:

            # Create proto data object
            movie_times = showtime_pb2.Time(
                date=item['date'],
                movies=item['movies']
            )

            # Add it to the return list
            times_list.append(movie_times)

        # Create the proto return object with the list of object
        return showtime_pb2.Times(times=times_list)

    def GetTimeByDate(self, request, context):

        if not request or request.date == "":
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("The parameter date must be defined")
            return Empty()

        # If no date, setup information error
        if not request.date:
            context.set_details('Date parameter is required.')
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            return Empty()

        # Iterate over all object in database
        for item in self.db:

            # If the curent date is the same as in request
            if item["date"] == request.date:

                # Create and return proto data object
                return showtime_pb2.Time(
                    date=item['date'],
                    movies=item['movies']
                )

        # If date note found, setup error information
        context.set_details('No data found for the specified date.')
        context.set_code(grpc.StatusCode.NOT_FOUND)
        return Empty()


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    showtime_pb2_grpc.add_ShowtimeServicer_to_server(ShowtimeServicer(), server)
    server.add_insecure_port('[::]:3002')
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
