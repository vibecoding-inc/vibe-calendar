import { auth } from "@/auth"
import { SignIn } from "./SignIn"
import { SignOut } from "./UserMenu"

export async function Header() {
    const session = await auth()

    return (
        <header className="flex justify-between items-center p-4 border-b border-white/10 glass mb-8">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Vibe Calendar</h1>
            </div>
            <div>
                {session?.user ? (
                    <div className="flex gap-4 items-center">
                        {session.user.image && <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full ring-2 ring-primary/20" />}
                        <SignOut />
                    </div>
                ) : (
                    <SignIn />
                )}
            </div>
        </header>
    )
}
