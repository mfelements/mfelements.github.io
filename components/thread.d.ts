export default function createThread(url: string): {
    loaded: Promise<void>;
    destroy: () => void;
}
