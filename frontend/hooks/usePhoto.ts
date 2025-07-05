import { useState } from "react";

export function usePhoto() {
    const [photo, setPhoto] = useState<File | null>(null);

    return { photo, setPhoto };
}