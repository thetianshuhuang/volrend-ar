import * as Comlink from "https://unpkg.com/comlink/dist/esm/comlink.mjs";

const video = window.video = document.getElementById('webcam_canvas');
const canvas = window.canvas = document.getElementById('out_canvas');


canvas.width = 800;
canvas.height = 600;


if(navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({video: true})
        .then(function (stream) { video.srcObject = stream; })
        .catch(function (error) { console.log(error); })
}


window.onload = (event) => {
    init();
}

async function init() {
    const Apriltag = Comlink.wrap(new Worker("apriltag.js"));
    window.apriltag = await new Apriltag(Comlink.proxy(() => {
        window.requestAnimationFrame(process_frame)
    }));
}


async function process_frame() {

    let ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // console.log(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));

    let imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    let imageDataPixels = imageData.data;
    let grayscalePixels = new Uint8Array(ctx.canvas.width * ctx.canvas.height); // this is the grayscale image we will pass to the detector
  
    for (var i = 0, j = 0; i < imageDataPixels.length; i += 4, j++) {
      let grayscale = Math.round((imageDataPixels[i] + imageDataPixels[i + 1] + imageDataPixels[i + 2]) / 3);
      grayscalePixels[j] = grayscale; // single grayscale value
    }
    let detections = await apriltag.detect(grayscalePixels, ctx.canvas.width, ctx.canvas.height);
    ctx.putImageData(imageData, 0, 0);

    window.detections = detections;

    if (detections.length > 0) {
        let t = detections[0].pose.t;
        let xy = detections[0].center;
        let x = (xy.x - 400) / 1200;
        let y = (xy.y - 300) / 1200;
        let dist = Math.sqrt(t[0]**2 + t[1]**2 + t[2]**2) * 10;

        let center = [x * dist, dist, y * dist]
        Volrend.set_cam_center(center);
        Volrend.set_cam_back([0, 1, 0]);
        console.log(center[0], center[1], center[2]);
    }

    window.requestAnimationFrame(process_frame);
}
