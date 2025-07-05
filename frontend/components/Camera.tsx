"use client";

import Webcam from "react-webcam";
import { useCamera } from "../hooks/useCamera";

export default function Camera() {
    const { makePhoto, webcamRef, photo, isCameraOpen, setIsCameraOpen, setPhoto } = useCamera();
    return (
        <>
            <div className="space-y-4 flex justify-center flex-col items-center">
                {photo && <img src={photo} alt="photo" className="rounded-lg" />}
                {!photo && !isCameraOpen && <p className="text-gray-600 dark:text-gray-400">Loading camera...</p>}
                <Webcam
                    className={`rounded-lg ${photo ? "hidden" : "block"} ${isCameraOpen ? "block" : "hidden"}`}
                    ref={webcamRef}
                    audio={false}
                    height={240}
                    width={320}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        width: 320,
                        height: 240,
                        facingMode: "environment",
                    }}
                    onUserMedia={() => setIsCameraOpen(true)}
                />
                <button className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
                    onClick={photo ? () => setPhoto(null) : makePhoto}>{photo ? "Retake Photo" : "Take Photo"}</button>
            </div>
        </>
    );
}   
