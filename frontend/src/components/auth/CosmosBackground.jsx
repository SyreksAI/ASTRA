/** Полноэкранное фоновое фото */
export function CosmosBackground() {
    return (
        <div className="auth-landing__cosmos" aria-hidden>
            <img
                className="auth-landing__cosmos-photo"
                src="/auth/cosmos-bg.png"
                alt=""
                decoding="async"
            />
        </div>
    );
}
