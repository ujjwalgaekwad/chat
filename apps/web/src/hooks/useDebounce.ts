import { useEffect, useState } from "react"

const useDebounce = (value: string, delay: number = 300) => {
    const [debouncedValue, setDebounceValue] = useState("");

    useEffect(() => {
        let timer = setTimeout(() => {
            setDebounceValue(value);
        }, delay);
        return () => clearTimeout(timer)
    }, [value, delay])
    return debouncedValue
}

export default useDebounce;
