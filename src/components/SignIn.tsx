import { signIn } from "@/auth"

export function SignIn() {
    return (
        <form
            action={async () => {
                "use server"
                await signIn("google")
            }}
        >
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded font-medium transition-colors">
                Sign in with Google
            </button>
        </form>
    )
}
