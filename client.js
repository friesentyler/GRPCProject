// Import necessary modules
const grpc = require("@grpc/grpc-js");
const readline = require('readline');
const protoLoader = require("@grpc/proto-loader")

// Load the Protocol Buffer definition file
const packageDef = protoLoader.loadSync("chat.proto", {});

// Load the chat service definition from the Protocol Buffer definition
const grpcObject = grpc.loadPackageDefinition(packageDef);
const chatPackage = grpcObject.chatPackage;

// Read command line argument for text
const text = process.argv[2];

// Create a new gRPC client instance
const client = new chatPackage.Chat("localhost:40000", grpc.credentials.createInsecure());

console.log(text)

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt the user for input
console.log("Enter something (or type 'exit' to quit)");

// Function to repeatedly ask for user input
function askUser() {
  rl.question('', (answer) => {
    // If the user types 'exit', close the readline interface and exit the function
    if (answer.toLowerCase() === 'exit') {
      rl.close();
      return; // Exit the recursive function
    }

    // Send the user's input as a message
    sendMessage(answer);

    // Schedule the function to run again after 200 milliseconds
    setTimeout(() => {
      askUser();
    }, 200);
  });
}

// Start asking for user input
askUser();

// Event listener for readline close event
rl.on('close', () => {
  console.log('Goodbye!');
  process.exit(0);
});

// Establish connection to server and set up bidirectional streaming
const call = client.sendCommunication((error, response) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Received message from server:', response.mess);
});

// Function to send a message to the server
const sendMessage = (content) => {
  const message = { mess: content };
  call.write(message);
};

// Event listener for incoming messages from the server
call.on('data', (message) => {
  console.log('Anonymous:', message.mess);
});

// Event listener for server ending the connection
call.on("end", e => console.log("server done!"));
