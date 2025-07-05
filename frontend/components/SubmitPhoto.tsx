"use client";

import { usePhoto } from "@/hooks/usePhoto";

export default function SubmitPhoto() {
    const { setPhoto } = usePhoto();
    return (
        <>
            <div className="flex justify-center flex-col items-center">
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    id="photo-input"
                    onChange={(e) => setPhoto(e.target.files?.[0]!)}
                />
                <label
                    htmlFor="photo-input"
                    className="bg-black text-white py-3 px-6 rounded-lg"
                >
                    Submit Photo
                </label>
            </div>
        </>
    );
}   
