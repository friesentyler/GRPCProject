// Import necessary modules
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the Protocol Buffer definition file
const packageDef = protoLoader.loadSync("chat.proto", {});

// Load the chat service definition from the Protocol Buffer definition
const grpcObject = grpc.loadPackageDefinition(packageDef);
const chatPackage = grpcObject.chatPackage;

// Create a new gRPC server instance
const server = new grpc.Server();

// Bind the server to the specified address and port asynchronously
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), (err, port) => {
    // Callback function to handle the result of the binding operation

    if (err) {
        // If an error occurs during the binding process, log the error
        console.error('Failed to bind server:', err);
    } else {
        // If the server is successfully bound to the port, log the port number
        console.log('Server bound to port:', port);
        // Start the server
        //server.start();
    }
});

// Set to keep track of active connections
const activeConnections = new Set();

// Add the chat service to the server with the specified service implementation
server.addService(chatPackage.Chat.service, {
    "sendCommunication": sendCommunication // Implement the sendCommunication method
});

// Implementation of the sendCommunication method
function sendCommunication(call) {
    // Add the incoming call to the set of active connections
    activeConnections.add(call);

    // Listen for incoming data messages
    call.on('data', (message) => {
        // Log received message
        console.log(`Received message: ${message.mess}`);
        // Broadcast the message to all active connections
        for (const connection of activeConnections) {
            connection.write(message);
        }
    });

    // Listen for the end of the call
    call.on('end', () => {
        // Remove the call from the set of active connections
        activeConnections.delete(call);
        // Notify remaining connections about the disconnection
        for (const connection of activeConnections) {
            const message = { mess: "Anonymous disconnected..." };
            connection.write(message);
        }
        // End the call
        call.end();
    });
}


// need to run npm install @grpc/grpc-js @grpc/proto-loader
// https://www.youtube.com/watch?v=2KIFNdpiwT4