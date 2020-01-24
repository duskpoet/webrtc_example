const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
app.use(express.static("public"));

const clients = {};
const clientsPool = {};
io.on("connection", socket => {
  clientsPool[socket.id] = socket;
  socket.on("register", name => {
    clients[socket.id] = { name, id: socket.id };
    sendClients();
  });
  socket.on("disconnect", () => {
    delete clients[socket.id];
    delete clientsPool[socket.id];
    sendClients();
  });
  socket.on("call offer", ({ id, offer }) => {
    clientsPool[id].emit("incoming offer", { offer, id: socket.id });
  });
  socket.on("in candidate", candidate => {
    Object.values(clientsPool)
      .filter(({ id }) => id !== socket.id)
      .forEach(socket => {
        socket.emit("out candidate", candidate);
      });
  });
  socket.on("call answer", ({ id, offer }) => {
    clientsPool[id].emit("incoming answer", { id: socket.id, offer });
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("Listening on " + port);
});

function sendClients() {
  Object.values(clientsPool).forEach(socket => {
    socket.emit("clients", clients);
  });
}
