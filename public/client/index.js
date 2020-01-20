const constraints = {
    audio: true,
    video: true,
}

navigator.mediaDevices.getUserMedia(constraints).then((ms) => {
    document.getElementById('me').srcObject = ms;
})