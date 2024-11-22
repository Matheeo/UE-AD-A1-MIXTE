#!/bin/bash

# Navigate to the root directory
cd "$(dirname "$0")"

# Function to compile gRPC code
generate_grpc_code() {
    local proto_file=$1
    local output_dir=$(dirname "$proto_file")
    python -m grpc_tools.protoc \
        -I "$output_dir" \
        --python_out="$output_dir" \
        --grpc_python_out="$output_dir" \
        "$proto_file"
}

# Function to install Python dependencies and run the service
run_python_service() {
    local service_dir=$1
    cd "$service_dir"

    # Install Python dependencies
    echo "Installing dependencies for $(basename "$service_dir")..."
    pip install -r requirements.txt

    # Generate gRPC code if a .proto file exists
    if compgen -G "*.proto" > /dev/null; then
        for proto in *.proto; do
            echo "Generating gRPC code for $proto..."
            generate_grpc_code "$proto"
        done
    fi

    # Run the Python service in the background
    echo "Starting service: $(basename "$service_dir")"
    python "$(basename "$service_dir").py" &
    cd - > /dev/null
}

# Function to build and run the frontend
run_frontend() {
    local frontend_dir=$1
    cd "$frontend_dir"

    # Install Node.js dependencies
    echo "Installing frontend dependencies..."
    npm install

    # Build and start the frontend
    echo "Building and starting the frontend..."
    npm start &
    cd - > /dev/null
}

# Run Python services
for service in booking movie showtime user; do
    if [ -d "$service" ]; then
        run_python_service "$service"
    fi
done

# Run the frontend
if [ -d "frontend" ]; then
    run_frontend "frontend"
fi

echo "All services started successfully."