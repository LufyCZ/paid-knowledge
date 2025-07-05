import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";


export const useCamera = () => {

    const webcamRef = useRef<Webcam>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const makePhoto = useCallback(() => {
        const photo = webcamRef.current?.getScreenshot();
        if (photo) {
            setPhoto(photo);
        }
    }, [webcamRef]);

    return {
        makePhoto,
        setPhoto,
        webcamRef,
        photo,
        isCameraOpen,
        setIsCameraOpen,
    };
};