import { signOut } from "@/auth"
import { headers } from "next/headers"

export function SignOut() {
    return (
        <form
            action={async () => {
                "use server"
                await signOut()
            }}
        >
            <button type="submit" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Sign Out
            </button>
        </form>
    )
}
