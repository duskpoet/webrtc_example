const constraints = {
  audio: true,
  video: true
};
const config = {
  urls: "stun:stun.l.google.com:19302"
};
const pcIn = new RTCPeerConnection(config);
const pcOut = new RTCPeerConnection(config);
pcIn.ontrack = event => {
  document.getElementById("them").srcObject = event.streams[0];
};
pcOut.ontrack = event => {
  document.getElementById("them").srcObject = event.streams[0];
};

const socket = (window._socket = io("/"));

window.submitName = () => {
  const name = document.getElementById("name").value;
  socket.emit("register", name);
};

socket.on("clients", clients => {
  document.getElementById("participants").innerHTML = `<table>
        ${Object.values(clients)
      .map(
        ({ name, id }) =>
          `<tr>
            <td>${name}</td>
            <td><button onclick="callClient('${id}')">CALL</td>
          </tr>`
      )
      .join("")}
    </table>`;
});

pcIn.onicecandidate = ({ candidate }) => socket.emit('in candidate', candidate);
pcOut.onicecandidate = ({ candidate }) => socket.emit('in candidate', candidate);
window.callClient = async id => {
  const ms = await navigator.mediaDevices.getUserMedia(constraints)
  document.getElementById("me").srcObject = ms;
  ms.getTracks().forEach(track => {
    pcOut.addTrack(track, ms);
  });
  const offer = await pcOut.createOffer();
  await pcOut.setLocalDescription(offer);
  socket.emit("call offer", { id, offer });
};
socket.on("incoming offer", async ({ offer, id }) => {
  await pcIn.setRemoteDescription(offer);
  const ms = await navigator.mediaDevices.getUserMedia(constraints)
  document.getElementById("me").srcObject = ms;
  ms.getTracks().forEach(track => {
    pcIn.addTrack(track, ms);
  });
  await pcIn.setLocalDescription(await pcIn.createAnswer())
  socket.emit('call answer', { id, offer: pcIn.localDescription });
});
socket.on('incoming answer', ({ id, offer }) => {
  pcOut.setRemoteDescription(offer);
});
socket.on('out candidate', (candidate) => {
  if (candidate) {
    pcIn.addIceCandidate(candidate);
    pcOut.addIceCandidate(candidate);
  }
});